"use client";

import { combinadorClases as cn } from "@/lib/utilidades";

// Badge/pill de estado. Mono por defecto; el color se reserva para significado.
const VARIANTES = {
  neutral: "text-muted-foreground border-border bg-secondary/60",
  solido: "text-primary-foreground bg-primary border-transparent",
  contorno: "text-foreground border-border bg-transparent",
  exito: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  alerta: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  peligro: "text-red-400 border-red-500/30 bg-red-500/10",
  info: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

export function Insignia({ children, variante = "neutral", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
        VARIANTES[variante],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
