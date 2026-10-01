"use client";

import { useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { subirImagen } from "@/lib/subir-imagen";

// Las fotos públicas del auto en consignación: una principal y hasta 3 más.
// Se suben al store público del catálogo porque al publicar pasan tal cual a la
// ficha de la web. `fotos` es { principal, secundarias }.

export const MAX_SECUNDARIAS = 3;

export const aFotos = (lista = []) => ({ principal: lista[0] ?? "", secundarias: lista.slice(1) });
// La principal va primera: el catálogo usa la primera foto como portada.
export const listaDeFotos = ({ principal, secundarias }) => (principal ? [principal, ...secundarias] : []);

function Casilla({ url, etiqueta, principal, subiendo, onSubir, onQuitar, deshabilitada }) {
  return (
    <div className="space-y-1">
      <div className="relative aspect-[4/3] rounded-lg border border-border bg-secondary overflow-hidden">
        {url ? (
          <>
            <img src={url} alt={etiqueta} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onQuitar}
              className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive"
              aria-label={`Quitar ${etiqueta}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <label
            className={`flex flex-col items-center justify-center gap-1 w-full h-full text-xs text-muted-foreground ${
              deshabilitada ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:text-foreground"
            }`}
          >
            {subiendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            {subiendo ? "Subiendo…" : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={onSubir} disabled={deshabilitada || subiendo} />
          </label>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
        {principal && <Star className="w-3 h-3" />} {etiqueta}
      </p>
    </div>
  );
}

export function FotosVehiculo({ fotos, onCambio, onError }) {
  // Qué casilla está subiendo: "principal" o el índice de la secundaria.
  const [subiendo, setSubiendo] = useState(null);

  const subir = (casilla) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(casilla);
    onError(null);
    try {
      const url = await subirImagen(file, "catalogo");
      if (casilla === "principal") onCambio({ ...fotos, principal: url });
      else onCambio({ ...fotos, secundarias: [...fotos.secundarias, url].slice(0, MAX_SECUNDARIAS) });
    } catch (err) {
      onError(err.message);
    } finally {
      setSubiendo(null);
    }
  };

  const quitarSecundaria = (i) => onCambio({ ...fotos, secundarias: fotos.secundarias.filter((_, j) => j !== i) });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Casilla
        url={fotos.principal}
        etiqueta="Principal"
        principal
        subiendo={subiendo === "principal"}
        onSubir={subir("principal")}
        onQuitar={() => onCambio({ ...fotos, principal: "" })}
      />
      {Array.from({ length: MAX_SECUNDARIAS }, (_, i) => (
        <Casilla
          key={i}
          url={fotos.secundarias[i]}
          etiqueta={`Foto ${i + 2}`}
          subiendo={subiendo === i}
          // Se llenan en orden y después de la principal: así la lista nunca
          // queda con huecos ni sin portada.
          deshabilitada={!fotos.principal || i > fotos.secundarias.length}
          onSubir={subir(i)}
          onQuitar={() => quitarSecundaria(i)}
        />
      ))}
    </div>
  );
}
