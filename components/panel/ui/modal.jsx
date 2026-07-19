"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";

// Shell de modal del panel: overlay con blur + panel elevado con header y cierre.
// El contenido (formulario, listas, etc.) va como children. Para la fila de
// acciones inferior usar <ModalPie>. No cierra al click en el overlay para no
// perder datos del formulario sin querer.
//
// Se renderiza con un PORTAL a <body>: así el overlay `fixed inset-0` queda
// centrado respecto a la pantalla y no respecto al contenedor del panel (que
// aplica `transform` en sus animaciones y descentraría el modal).
export function Modal({ titulo, icono: Icono, onCerrar, children, ancho = "max-w-lg", className }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado) return null;

  return createPortal(
    // `panel-dark` re-aplica los tokens de color del panel: al portar a <body>
    // salimos del contenedor que los define, así que los traemos con nosotros.
    <div className="panel-dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-foreground">
      <div
        className={cn(
          "bg-card border border-border rounded-2xl w-full shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
          ancho,
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2 tracking-tight">
            {Icono && <Icono className="w-5 h-5 text-muted-foreground" />}
            {titulo}
          </h2>
          <button
            onClick={onCerrar}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Fila de acciones inferior del modal (borde superior, alineada a la derecha).
export function ModalPie({ children, className }) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0",
        className
      )}
    >
      {children}
    </div>
  );
}
