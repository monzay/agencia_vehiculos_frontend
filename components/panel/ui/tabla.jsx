"use client";

import { combinadorClases as cn } from "@/lib/utilidades";

// Shell de tabla del panel: contenedor con borde, encabezado consistente y
// estado vacío. Las secciones pasan sus <tr> como children del <tbody>.
//
//   columnas: [{ label, alinear?: "left"|"right", className? }]
//   vacio:    boolean → muestra `mensajeVacio` en lugar de la tabla vacía
export function Tabla({ columnas = [], children, vacio = false, mensajeVacio = "No hay datos." }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr className="text-left">
              {columnas.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-5 py-3 font-medium text-xs uppercase tracking-wide",
                    c.alinear === "right" && "text-right",
                    c.className
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {vacio && (
        <p className="text-center py-14 text-sm text-muted-foreground">{mensajeVacio}</p>
      )}
    </div>
  );
}

// Clases base reutilizables para filas y celdas (coherencia de padding/hover).
export const FILA = "border-t border-border hover:bg-secondary/40 transition-colors";
export const CELDA = "px-5 py-3.5 align-middle";
