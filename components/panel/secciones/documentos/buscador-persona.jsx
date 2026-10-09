"use client";

import { useEffect, useState } from "react";
import { Search, Check, Loader2 } from "lucide-react";
import { buscarPersonas } from "@/lib/api";

// Buscar a alguien entre los clientes que ya están en la base antes de cargarlo
// de nuevo. Si esa persona escribió alguna vez por WhatsApp, su ficha ya existe:
// reusarla evita tener al mismo cliente dos veces.
//
// `onElegir` recibe la persona tal como la devuelve /api/ingresos/personas.
export function BuscadorPersona({ onElegir }) {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [reusada, setReusada] = useState(false);

  useEffect(() => {
    const texto = termino.trim();
    if (texto.length < 3) {
      setResultados([]);
      return;
    }
    let activo = true;
    setBuscando(true);
    const t = setTimeout(() => {
      buscarPersonas(texto)
        .then((datos) => activo && setResultados(datos ?? []))
        .catch(() => activo && setResultados([]))
        .finally(() => activo && setBuscando(false));
    }, 300);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, [termino]);

  function elegir(encontrada) {
    onElegir(encontrada);
    setReusada(true);
    setTermino("");
    setResultados([]);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          placeholder="Buscar por DNI, nombre o teléfono…"
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-all"
        />
        {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      {resultados.length > 0 && (
        <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          {resultados.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => elegir(r)}
                className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors"
              >
                <span className="text-sm text-foreground">
                  {[r.nombre, r.apellido].filter(Boolean).join(" ") || "Sin nombre"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {r.dni ? `DNI ${r.dni}` : "sin DNI"}
                  {r.telefono ? ` · ${r.telefono}` : ""} · {r.canal}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {reusada && (
        <p className="text-xs text-emerald-500 inline-flex items-center gap-1.5">
          <Check className="w-3 h-3" /> Se está reusando la ficha que ya existía en el sistema.
        </p>
      )}
    </div>
  );
}
