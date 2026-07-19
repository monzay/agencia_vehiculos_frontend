"use client";

import { combinadorClases as cn } from "@/lib/utilidades";

// Contenedor de superficie estándar del panel: card elevada, borde hairline,
// esquinas suaves y sombra sutil. `padding` controla el relleno interno.
const PADDINGS = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Tarjeta({ children, padding = "md", className, ...props }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-[var(--shadow-sm)]",
        PADDINGS[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Encabezado opcional de una tarjeta: título + acción a la derecha.
export function TarjetaEncabezado({ titulo, children, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{titulo}</h3>
      {children}
    </div>
  );
}
