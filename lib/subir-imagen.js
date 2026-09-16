import { getToken } from "@/lib/api";

// Sube una imagen a Vercel Blob a través de /api/blob/upload (que la optimiza
// con sharp y exige sesión de admin).
//
// Según el destino devuelve cosas distintas, porque son dos stores distintos:
//   "catalogo"   → la URL pública, que es el dato que se guarda y se publica.
//   "documentos" → el pathname del store privado. La URL para verlo se pide
//                  firmada al backend cada vez, así que no hay URL que guardar.
//
// El límite tiene que coincidir con el del endpoint: acá se corta antes de
// gastar la subida, allá se vuelve a verificar porque el cliente no es confiable.
export const MAX_IMG_MB = 10;

export async function subirImagen(file, destino = "catalogo") {
  if (!file?.type?.startsWith("image/")) {
    throw new Error(`"${file?.name ?? "El archivo"}" no es una imagen.`);
  }
  if (file.size > MAX_IMG_MB * 1024 * 1024) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`"${file.name}" pesa ${mb} MB. El máximo permitido es ${MAX_IMG_MB} MB.`);
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("destino", destino);

  const res = await fetch("/api/blob/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen.");
  return destino === "documentos" ? data.pathname : data.url;
}
