"use client";

import { useMemo, useState } from "react";
import { Car, Check, Search, X } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";
import { CLASE_INPUT } from "../ui/campo";

// Elige un vehículo del catálogo. El identificador es la `ref`, igual que en
// Descuentos: el backend la resuelve a la FK.
//
// `vehiculos` = lo que ya trae el panel (shape del front: ref, brand, model,
// year, kms, precio, image).

const pesos = (n) => (n ? `$ ${Number(n).toLocaleString("es-AR")}` : "Sin precio");
const titulo = (v) => `${v.brand} ${v.model}`;

export function SelectorVehiculo({ vehiculos = [], refElegida, onElegir }) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);

  const elegido = useMemo(() => vehiculos.find((v) => v.ref === refElegida) ?? null, [vehiculos, refElegida]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return vehiculos;
    return vehiculos.filter((v) =>
      [v.ref, v.brand, v.model, String(v.year)].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [vehiculos, busqueda]);

  // Ya elegido y con el buscador cerrado: se muestra la ficha.
  if (elegido && !abierto) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/40 p-3">
        <img src={elegido.image} alt="" className="w-20 h-20 rounded-lg object-cover bg-secondary shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground truncate">
            {titulo(elegido)} <span className="text-muted-foreground font-normal">{elegido.year}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded border border-border bg-card font-medium">REF {elegido.ref}</span>
            <span>{Number(elegido.kms ?? 0).toLocaleString("es-AR")} km</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Precio en catálogo: <span className="text-foreground tabular-nums">{pesos(elegido.precio)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setAbierto(true); setBusqueda(""); }}
          className="shrink-0 self-start px-2.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="relative border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por marca, modelo, año o REF…"
          autoFocus
          className={cn(CLASE_INPUT, "h-10 pl-9 rounded-none border-0 bg-transparent")}
        />
        {elegido && (
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-border">
        {filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {vehiculos.length === 0 ? "No hay vehículos en el catálogo." : "Ningún vehículo coincide."}
          </p>
        ) : (
          filtrados.map((v) => {
            const activo = v.ref === refElegida;
            return (
              <button
                key={v.ref}
                type="button"
                onClick={() => { onElegir(v.ref); setAbierto(false); }}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 text-left transition-colors",
                  activo ? "bg-secondary" : "hover:bg-secondary/50"
                )}
              >
                <img src={v.image} alt="" className="w-11 h-11 rounded-md object-cover bg-secondary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{titulo(v)} {v.year}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    REF {v.ref} · {Number(v.kms ?? 0).toLocaleString("es-AR")} km · {pesos(v.precio)}
                  </p>
                </div>
                {activo ? (
                  <Check className="w-4 h-4 text-accent shrink-0" />
                ) : (
                  <Car className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
