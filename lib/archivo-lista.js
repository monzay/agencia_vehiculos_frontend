import { createHash } from "node:crypto";

// Archivos de la lista de vehículos que se importa desde Vehículos.
//
// Solo lo usa la ruta de subida, en el servidor. El nombre del archivo guardado
// es la huella del original: así el backend sabe qué archivo es sin descargarlo,
// y el mismo archivo siempre cae en el mismo nombre, que es lo que permite
// frenarlo si se vuelve a subir.

const FIRMA_PDF = "%PDF-";

/** El contenido manda, no el nombre ni el tipo que declara el navegador. */
export function esPdf(bytes) {
  if (bytes.length < FIRMA_PDF.length) return false;
  return [...FIRMA_PDF].every((letra, i) => bytes[i] === letra.charCodeAt(0));
}

/** SHA-256 en hexadecimal de los bytes originales, antes de recomprimir. */
export const huellaDe = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const pathnameDeLista = (huella, pdf) => `listas/${huella}.${pdf ? "pdf" : "jpg"}`;
