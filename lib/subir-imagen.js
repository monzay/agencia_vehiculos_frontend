import { getToken } from "@/lib/api";

// Sube un archivo a Vercel Blob a través de /api/blob/upload (que optimiza las
// imágenes con sharp y exige sesión de admin).
//
// Según el destino devuelve cosas distintas, porque son stores distintos:
//   "catalogo"   → la URL pública, que es el dato que se guarda y se publica.
//   "documentos" → el pathname del store privado. La URL para verlo se pide
//                  firmada al backend cada vez, así que no hay URL que guardar.
//   "listas"     → el pathname de la lista del catálogo (PDF o imagen) que se
//                  importa desde Vehículos.
//
// El límite tiene que coincidir con el del endpoint: acá se corta antes de
// gastar la subida, allá se vuelve a verificar porque el cliente no es confiable.
export const MAX_IMG_MB = 10;

function exigirTamano(file) {
  if (file.size > MAX_IMG_MB * 1024 * 1024) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`"${file.name}" pesa ${mb} MB. El máximo permitido es ${MAX_IMG_MB} MB.`);
  }
}

async function subir(file, destino) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("destino", destino);

  const res = await fetch("/api/blob/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `No se pudo subir "${file.name}".`);
  return data;
}

export async function subirImagen(file, destino = "catalogo") {
  if (!file?.type?.startsWith("image/")) {
    throw new Error(`"${file?.name ?? "El archivo"}" no es una imagen.`);
  }
  exigirTamano(file);
  const data = await subir(file, destino);
  return destino === "documentos" ? data.pathname : data.url;
}

// PDF o imagen. Sin tipo declarado (Windows no lo pone para .webp o .heic) se
// deja pasar: el servidor revisa el contenido.
export async function subirArchivoDeLista(file) {
  const tipo = file?.type ?? "";
  if (tipo && tipo !== "application/pdf" && !tipo.startsWith("image/")) {
    throw new Error(`"${file.name}" no es un PDF ni una imagen.`);
  }
  exigirTamano(file);
  const data = await subir(file, "listas");
  return data.pathname;
}
