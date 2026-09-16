"use client";

import { useState } from "react";
import { ScanLine, Loader2 } from "lucide-react";
import { extraerDatosDocumento } from "@/lib/api";
import { Boton } from "../../ui/boton";
import { Aviso } from "./campos";

// Lee las fotos ya subidas y completa el formulario.
//
// No guarda nada: lo que devuelve queda en el formulario para que la persona lo
// revise. Si el escaneo falla, se sigue cargando a mano como siempre: por eso el
// error se muestra y no corta nada.

export function Escaner({ ingresoId, tipo, imagenes, onDatos }) {
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);

  async function escanear() {
    setLeyendo(true);
    setError(null);
    try {
      const extraido = await extraerDatosDocumento(ingresoId, { tipo, imagenes });
      onDatos(extraido);
      setListo(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLeyendo(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={escanear} cargando={leyendo} disabled={!imagenes.length}>
          {leyendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
          {leyendo ? "Leyendo la foto…" : "Escanear y completar"}
        </Boton>
        {!imagenes.length && <span className="text-[11px] text-muted-foreground">Subí o sacá una foto primero.</span>}
        {listo && !leyendo && !error && (
          <span className="text-[11px] text-muted-foreground">Revisá los datos contra la foto antes de guardar.</span>
        )}
      </div>
      {error && <Aviso>{error}</Aviso>}
    </div>
  );
}
