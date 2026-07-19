"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Loader2, ImageOff } from "lucide-react";
import { obtenerEntregas, crearEntrega, eliminarEntrega } from "@/lib/api";
import { Boton } from "../ui/boton";
import { ConfirmarModal } from "../ui/confirmar-modal";

// Límite de tamaño de imagen (debe coincidir con el del endpoint /api/blob/upload).
const MAX_IMG_MB = 10;

// Sube un archivo a Blob y devuelve la URL pública de la imagen ya optimizada.
async function subirArchivo(file) {
  if (!file.type?.startsWith("image/")) {
    throw new Error(`"${file.name}" no es una imagen.`);
  }
  if (file.size > MAX_IMG_MB * 1024 * 1024) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`"${file.name}" pesa ${mb} MB. El máximo permitido es ${MAX_IMG_MB} MB.`);
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/blob/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen.");
  return data.url;
}

export function SeccionEntregas() {
  const [entregas, setEntregas] = useState(null); // null = cargando
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let activo = true;
    obtenerEntregas()
      .then((datos) => activo && setEntregas(datos || []))
      .catch((e) => activo && (setEntregas([]), setError(e.message)));
    return () => {
      activo = false;
    };
  }, []);

  // Sube una o varias fotos en orden y las agrega a la galería.
  async function alElegirArchivos(e) {
    const files = [...(e.target.files || [])];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!files.length) return;

    setSubiendo(true);
    setError(null);
    try {
      for (const file of files) {
        const url = await subirArchivo(file);
        const creada = await crearEntrega(url);
        setEntregas((prev) => [creada, ...(prev || [])]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function confirmarBorrado() {
    setBorrando(true);
    setError(null);
    try {
      await eliminarEntrega(aBorrar.id);
      setEntregas((prev) => (prev || []).filter((x) => x.id !== aBorrar.id));
      setABorrar(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {entregas === null
            ? "Cargando…"
            : `${entregas.length} ${entregas.length === 1 ? "foto" : "fotos"} en la galería del home`}
        </p>
        <Boton variante="primario" className="gap-1.5" cargando={subiendo} onClick={() => inputRef.current?.click()}>
          {!subiendo && <Upload className="w-4 h-4" />}
          {subiendo ? "Subiendo…" : "Subir fotos"}
        </Boton>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={alElegirArchivos} />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">{error}</div>
      )}

      {entregas === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : entregas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground rounded-xl border border-dashed border-border bg-card">
          <ImageOff className="w-8 h-8 opacity-50" />
          <p className="text-sm">Todavía no hay fotos de entregas. Subí la primera para que aparezca en el home.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {entregas.map((entrega) => (
            <figure key={entrega.id} className="group relative m-0 aspect-video overflow-hidden rounded-xl border border-border bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entrega.url} alt="Entrega" className="absolute inset-0 w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setABorrar(entrega)}
                title="Eliminar foto"
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive transition-all"
                aria-label="Eliminar foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </figure>
          ))}
        </div>
      )}

      <ConfirmarModal
        abierto={Boolean(aBorrar)}
        titulo="¿Eliminar esta foto?"
        mensaje="Se va a quitar de la galería de entregas del home."
        cargando={borrando}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  );
}
