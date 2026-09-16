import { put } from "@vercel/blob";
import sharp from "sharp";
import { NextResponse } from "next/server";

// sharp es nativo: este handler debe correr en Node, no en edge.
export const runtime = "nodejs";

const MAX_ENTRADA = 10 * 1024 * 1024; // 10 MB de entrada (antes de optimizar)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Dos destinos, dos stores de Blob distintos.
//
// El catálogo son fotos de autos que se publican en el sitio: store público, y
// la URL es el dato útil. Los documentos son DNI, títulos y cédulas de clientes
// reales: store PRIVADO, la URL sola no abre nada, y lo que se guarda es el
// pathname para firmarlo cuando alguien con permiso lo quiera ver.
//
// La separación es por store y no por un parámetro dentro del mismo, a propósito:
// si algún día se manda el destino equivocado, el archivo cae en el store que no
// es y se nota. Con un solo store, equivocarse dejaba un DNI público en silencio.
const DESTINOS = {
  catalogo: { prefijo: "vehiculos/imagen.jpg", access: "public", token: () => process.env.BLOB_READ_WRITE_TOKEN },
  documentos: { prefijo: "documentos/papel.jpg", access: "private", token: () => process.env.BLOB_DOCUMENTOS_TOKEN },
};

// Valida el JWT del panel contra el backend (sin duplicar el secreto en el front)
// y exige rol admin: subir imágenes es una acción del panel, no algo público.
// Devuelve true solo si el token es válido y pertenece a un admin.
async function esAdmin(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = await res.json().catch(() => ({}));
    return json?.data?.rol === "admin";
  } catch {
    return false;
  }
}

// Recibe un archivo de imagen, lo optimiza con sharp (auto-orienta + descarta EXIF,
// redimensiona a 1600px máx sin agrandar, y comprime a JPEG progresivo) y lo guarda
// en el store de Blob que corresponda según el campo `destino` del formulario.
// Devuelve { url } para el catálogo y { pathname } para los documentos.
export async function POST(request) {
  try {
    if (!(await esAdmin(request))) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");

    // Sin destino se asume catálogo: es lo que hacían las pantallas que ya
    // existían antes de que hubiera un segundo store.
    const destino = DESTINOS[form.get("destino") || "catalogo"];
    if (!destino) {
      return NextResponse.json({ error: "Destino de imagen desconocido." }, { status: 400 });
    }
    if (!destino.token()) {
      return NextResponse.json({ error: "El almacenamiento de imágenes no está configurado." }, { status: 503 });
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }
    // El MIME que declara el cliente NO alcanza como validación: lo controla él
    // y encima Windows no registra tipo para .webp, .avif ni .heic, que son
    // imágenes válidas. Esos llegan como octet-stream (el multipart no admite
    // tipo vacío), así que un genérico no se puede rechazar de entrada.
    //
    // Acá solo se descarta lo que se declara explícitamente como otra cosa
    // (application/pdf, video/mp4…). Del contenido real se ocupa sharp más
    // abajo, que es la comprobación que de verdad vale: si no es una imagen, no
    // la puede decodificar.
    const tipo = file.type || "";
    const tipoGenerico = tipo === "" || tipo === "application/octet-stream";
    if (!tipoGenerico && !tipo.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo no es una imagen." }, { status: 400 });
    }
    if (file.size > MAX_ENTRADA) {
      return NextResponse.json({ error: "La imagen supera los 10 MB." }, { status: 400 });
    }

    // `Buffer.from(arrayBuffer)` NO copia: comparte la memoria del ArrayBuffer
    // que devuelve undici, y sharp rechaza esa entrada con "ArrayBuffer:
    // SharedArrayBuffer is not allowed". Pasando por un Uint8Array, Buffer.from
    // sí copia los bytes y sharp recibe memoria propia.
    const entrada = Buffer.from(new Uint8Array(await file.arrayBuffer()));

    let optimizada;
    try {
      optimizada = await sharp(entrada)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toBuffer();
    } catch {
      // sharp no pudo leerla: o no es una imagen, o el formato no es uno de los
      // que soporta (por ejemplo HEIC, según cómo esté compilado libvips).
      return NextResponse.json(
        { error: "No pudimos leer esa imagen. Probá con un archivo JPG, PNG o WebP." },
        { status: 400 }
      );
    }

    // `put` sube el archivo con fetch, y undici rechaza cualquier cuerpo cuyo
    // ArrayBuffer sea COMPARTIDO: "ArrayBuffer: SharedArrayBuffer is not
    // allowed" (undici/lib/web/fetch/webidl.js). En el runtime de Vercel el
    // buffer que devuelve sharp cae en ese caso —local no—, así que se copia a
    // memoria propia antes de subirlo. El mensaje parece de sharp pero no lo es.
    const salida = new Uint8Array(optimizada.byteLength);
    salida.set(optimizada);

    let blob;
    try {
      blob = await put(destino.prefijo, salida, {
        access: destino.access,
        token: destino.token(),
        contentType: "image/jpeg",
        addRandomSuffix: true,
      });
    } catch (e) {
      // Falla de almacenamiento, no del archivo que mandó el usuario: 502 y no
      // 400, para que no se confunda con una imagen inválida.
      return NextResponse.json(
        { error: `No se pudo guardar la imagen: ${e.message}` },
        { status: 502 }
      );
    }

    // El catálogo necesita la URL, que es pública y no vence. Los documentos
    // necesitan el pathname: su URL hay que firmarla cada vez, así que guardar
    // la de ahora sería guardar un enlace que mañana no abre.
    return NextResponse.json(destino.access === "private" ? { pathname: blob.pathname } : { url: blob.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
