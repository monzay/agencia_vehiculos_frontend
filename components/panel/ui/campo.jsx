"use client";

import { combinadorClases as cn } from "@/lib/utilidades";

// Clase compartida de inputs/areas/selects para que todos los formularios del panel
// se vean igual (altura, foco mono, radios suaves).
export const CLASE_INPUT =
  "w-full px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus:border-foreground/30 transition-all duration-200";

// Campo de texto etiquetado (label + input). Para textarea/select usar CLASE_INPUT directo.
export function Campo({ label, valor, onCambio, placeholder, tipo = "text", autoFocus, className }) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      )}
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(CLASE_INPUT, "h-9")}
      />
    </label>
  );
}
