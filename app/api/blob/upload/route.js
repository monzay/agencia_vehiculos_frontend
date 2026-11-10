import { put } from "@vercel/blob";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { esPdf, huellaDe, pathnameDeLista } from "@/lib/archivo-lista";

// sharp es nativo: este handler debe correr en Node, no en edge.
export const runtime = "nodejs";

const MAX_ENTRADA = 10 * 1024 * 1024; // 10 MB de entrada (antes de optimizar)
// Tope de píxeles al decodificar: una imagen chica en bytes puede expandirse a
// gigas en memoria. 60 MP alcanza para las cámaras de celular de 48 MP.
const MAX_PIXELES = 60_000_000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Tres destinos, dos stores de Blob distintos.
//
// El catálogo son fotos de autos que se publican en el sitio: store público, y
// la URL es el dato útil. Los documentos son DNI, títulos y cédulas de clientes
// reales: store PRIVADO, la URL sola no abre nada, y lo que se guarda es el
// pathname para firmarlo cuando alguien con permiso lo quiera ver.
//
// Las listas son la lista del catálogo que se importa desde Vehículos (PDF o
// foto). Van al store privado de documentos: tienen precios y el stock entero.
// Se guardan con la huella del archivo original como nombre, que es lo que usa
// el backend para no importar dos veces la misma lista.
//
// La separación es por store y no por un parámetro dentro del mismo, a propósito:
// si algún día se manda el destino equivocado, el archivo cae en el store que no
// es y se nota. Con un solo store, equivocarse dejaba un DNI público en silencio.
const DESTINOS = {
  catalogo: { prefijo: "vehiculos/imagen.jpg", access: "public", token: () => process.env.BLOB_READ_WRITE_TOKEN },
  documentos: { prefijo: "documentos/papel.jpg", access: "private", token: () => process.env.BLOB_DOCUMENTOS_TOKEN },
  listas: { access: "private", token: () => process.env.BLOB_DOCUMENTOS_TOKEN, esLista: true },
};

const respuestaError = (error, status) => NextResponse.json({ error }, { status });

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

// El MIME que declara el cliente NO alcanza como validación: lo controla él y
// encima Windows no registra tipo para .webp, .avif ni .heic, que son imágenes
// válidas. Esos llegan como octet-stream (el multipart no admite tipo vacío),
// así que un genérico no se puede rechazar de entrada.
//
// Acá solo se descarta lo que se declara explícitamente como otra cosa
// (video/mp4, o un PDF fuera de las listas). Del contenido real se ocupan sharp
// y la firma del PDF, que es la comprobación que de verdad vale.
function tipoAceptado(tipo, destino) {
  if (tipo === "" || tipo === "application/octet-stream" || tipo.startsWith("image/")) return true;
  return Boolean(destino.esLista) && tipo === "application/pdf";
}

// Auto-orienta y descarta el EXIF, redimensiona a 1600px máx sin agrandar y
// comprime a JPEG progresivo. Devuelve null si sharp no la puede leer: o no es
// una imagen, o el formato no es uno de los que soporta (por ejemplo HEIC, según
// cómo esté compilado libvips).
async function optimizarImagen(entrada) {
  let optimizada;
  try {
    optimizada = await sharp(entrada, { limitInputPixels: MAX_PIXELES })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
  // `put` sube el archivo con fetch, y undici rechaza cualquier cuerpo cuyo
  // ArrayBuffer sea COMPARTIDO: "ArrayBuffer: SharedArrayBuffer is not
  // allowed" (undici/lib/web/fetch/webidl.js). En el runtime de Vercel el
  // buffer que devuelve sharp cae en ese caso —local no—, así que se copia a
  // memoria propia antes de subirlo. El mensaje parece de sharp pero no lo es.
  const salida = new Uint8Array(optimizada.byteLength);
  salida.set(optimizada);
  return salida;
}

// Qué se guarda y con qué nombre. Un PDF de lista va tal cual. La huella sale
// siempre del archivo original, antes de recomprimir.
async function archivoAGuardar(destino, entrada) {
  if (destino.esLista && esPdf(entrada)) {
    return { pathname: pathnameDeLista(huellaDe(entrada), true), cuerpo: new Uint8Array(entrada), contentType: "application/pdf" };
  }
  const imagen = await optimizarImagen(entrada);
  if (!imagen) return null;
  const pathname = destino.esLista ? pathnameDeLista(huellaDe(entrada), false) : destino.prefijo;
  return { pathname, cuerpo: imagen, contentType: "image/jpeg" };
}

// Recibe un archivo y lo guarda en el store de Blob que corresponda según el
// campo `destino` del formulario. Devuelve { url } para el catálogo y
// { pathname } para los documentos y las listas.
export async function POST(request) {
  try {
    if (!(await esAdmin(request))) return respuestaError("No autorizado.", 401);

    const form = await request.formData();
    const file = form.get("file");

    // Sin destino se asume catálogo: es lo que hacían las pantallas que ya
    // existían antes de que hubiera un segundo store.
    const destino = DESTINOS[form.get("destino") || "catalogo"];
    if (!destino) return respuestaError("Destino de imagen desconocido.", 400);
    if (!destino.token()) return respuestaError("El almacenamiento de imágenes no está configurado.", 503);
    if (!file || typeof file.arrayBuffer !== "function") return respuestaError("No se recibió ningún archivo.", 400);
    if (!tipoAceptado(file.type || "", destino)) {
      return respuestaError(destino.esLista ? "El archivo no es un PDF ni una imagen." : "El archivo no es una imagen.", 400);
    }
    if (file.size > MAX_ENTRADA) return respuestaError("El archivo supera los 10 MB.", 400);

    // `Buffer.from(arrayBuffer)` NO copia: comparte la memoria del ArrayBuffer
    // que devuelve undici, y sharp rechaza esa entrada con "ArrayBuffer:
    // SharedArrayBuffer is not allowed". Pasando por un Uint8Array, Buffer.from
    // sí copia los bytes y sharp recibe memoria propia.
    const entrada = Buffer.from(new Uint8Array(await file.arrayBuffer()));

    const archivo = await archivoAGuardar(destino, entrada);
    if (!archivo) {
      const formatos = destino.esLista ? "un PDF o una imagen JPG, PNG o WebP" : "un archivo JPG, PNG o WebP";
      return respuestaError(`No pudimos leer ese archivo. Probá con ${formatos}.`, 400);
    }

    let blob;
    try {
      blob = await put(archivo.pathname, archivo.cuerpo, {
        access: destino.access,
        token: destino.token(),
        contentType: archivo.contentType,
        // Una lista se llama como su huella: el mismo archivo pisa al mismo archivo.
        ...(destino.esLista ? { addRandomSuffix: false, allowOverwrite: true } : { addRandomSuffix: true }),
      });
    } catch (e) {
      // Falla de almacenamiento, no del archivo que mandó el usuario: 502 y no
      // 400, para que no se confunda con una imagen inválida. El detalle del
      // proveedor queda en el log: puede traer datos de la cuenta.
      console.error(`[blob/upload] no se pudo guardar: ${e.message}`);
      return respuestaError("No se pudo guardar el archivo. Probá de nuevo en un rato.", 502);
    }

    // El catálogo necesita la URL, que es pública y no vence. Los documentos y
    // las listas necesitan el pathname: su URL hay que firmarla cada vez, así que
    // guardar la de ahora sería guardar un enlace que mañana no abre.
    return NextResponse.json(destino.access === "private" ? { pathname: blob.pathname } : { url: blob.url });
  } catch (error) {
    console.error(`[blob/upload] pedido inválido: ${error.message}`);
    return respuestaError("No se pudo procesar el archivo.", 400);
  }
}
