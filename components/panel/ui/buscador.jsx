"use client";

import { Search, X } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";

// Input de búsqueda con ícono y botón de limpiar. Usado en el header y en modales.
export function Buscador({ valor, onCambio, placeholder = "Buscar…", autoFocus, className }) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={valor}
        autoFocus={autoFocus}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-9 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus:border-foreground/30 transition-all duration-200"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambio("")}
          className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
          title="Limpiar búsqueda"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
