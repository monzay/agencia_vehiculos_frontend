"use client";

import { ArrowRight, Check, Circle } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";

// La tira de pasos del trámite. Qué pasos hay y cuál sigue lo decide el backend;
// acá solo se muestra, y tocar un paso abre lo que ya existe para hacerlo.
export function Seguimiento({ seguimiento, onAccion }) {
  if (!seguimiento) return null;
  const { pasos, proximo } = seguimiento;
  const siguiente = pasos.find((p) => p.id === proximo);

  return (
    <section aria-label="Seguimiento del trámite" className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground">
          {siguiente ? (
            <>
              <span className="text-muted-foreground">Próximo paso: </span>
              <strong>{siguiente.label}</strong>
            </>
          ) : (
            <span className="text-muted-foreground">No quedan pasos pendientes.</span>
          )}
        </p>
        {siguiente?.accion && onAccion && (
          <Boton variante="primario" tamano="sm" className="gap-1.5" onClick={() => onAccion(siguiente.accion)}>
            Ir al paso <ArrowRight className="w-3.5 h-3.5" />
          </Boton>
        )}
      </div>

      <ol className="flex flex-wrap gap-1.5">
        {pasos.map((p) => {
          const accion = !p.hecho && p.accion && onAccion ? () => onAccion(p.accion) : undefined;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={accion}
                disabled={!accion}
                aria-current={p.id === proximo ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                  p.hecho ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground",
                  p.id === proximo && "border-foreground/50 text-foreground font-medium",
                  accion && "hover:border-foreground/30 hover:bg-secondary/40"
                )}
              >
                {p.hecho ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                {p.label}
                {p.opcional && !p.hecho && <span className="opacity-70">(opcional)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
