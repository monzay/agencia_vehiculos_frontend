"use client";

import { Loader2 } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";

// Botón base del panel. Variantes mono + estados estándar.
//   primario   → blanco con texto oscuro (acción principal, look Vercel)
//   secundario → superficie sutil con borde hairline
//   fantasma   → sin fondo, se ilumina al hover
//   peligro    → acción destructiva (borde/texto rojo)
const VARIANTES = {
  primario:
    "bg-primary text-primary-foreground hover:opacity-90 border border-transparent",
  secundario:
    "bg-secondary text-foreground border border-border hover:border-foreground/30 hover:bg-secondary/70",
  fantasma:
    "bg-transparent text-muted-foreground border border-transparent hover:text-foreground hover:bg-secondary",
  peligro:
    "bg-transparent text-muted-foreground border border-border hover:text-destructive hover:border-destructive/50",
};

const TAMANOS = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  icono: "h-9 w-9 justify-center rounded-lg text-sm",
};

// Clases del botón, para reutilizarlas en elementos que no pueden ser un <button> (p. ej. un <a>).
export function clasesBoton({ variante = "secundario", tamano = "md", className } = {}) {
  return cn(
    "inline-flex items-center font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
    VARIANTES[variante],
    TAMANOS[tamano],
    className
  );
}

export function Boton({
  children,
  variante = "secundario",
  tamano = "md",
  cargando = false,
  className,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={clasesBoton({ variante, tamano, className })}
      {...props}
    >
      {cargando && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
