import { put } from "@vercel/blob";
import sharp from "sharp";
import { NextResponse } from "next/server";

// sharp es nativo: este handler debe correr en Node, no en edge.
export const runtime = "nodejs";

const MAX_ENTRADA = 10 * 1024 * 1024; // 10 MB de entrada (antes de optimizar)

// Recibe un archivo de imagen, lo optimiza con sharp (auto-orienta + descarta EXIF,
// redimensiona a 1600px máx sin agrandar, y comprime a JPEG progresivo) y lo guarda
// en Vercel Blob (público). Devuelve { url }. Token: BLOB_READ_WRITE_TOKEN del entorno.
export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo no es una imagen." }, { status: 400 });
    }
    if (file.size > MAX_ENTRADA) {
      return NextResponse.json({ error: "La imagen supera los 10 MB." }, { status: 400 });
    }

    const entrada = Buffer.from(await file.arrayBuffer());
    const optimizada = await sharp(entrada)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer();

    const blob = await put("vehiculos/imagen.jpg", optimizada, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
