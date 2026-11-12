"use client";

import { CampoContrasena } from "@/components/interfaz/campo-contrasena";
import { combinadorClases as cn } from "@/lib/utilidades";
import { conPuntosDeMiles, soloDigitos, aDigitos } from "@/lib/numeros";

// Clase compartida de inputs/areas/selects para que todos los formularios del panel
// se vean igual (altura, foco mono, radios suaves).
export const CLASE_INPUT =
  "w-full px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus:border-foreground/30 transition-all duration-200";

// Campo de texto etiquetado (label + input). Para textarea/select usar CLASE_INPUT directo.
export function Campo({ label, valor, onCambio, placeholder, tipo = "text", autoFocus, className, inputMode }) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      )}
      {tipo === "password" ? (
        <CampoContrasena
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="new-password"
          className={cn(CLASE_INPUT, "h-9")}
        />
      ) : (
        <input
          type={tipo}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          inputMode={inputMode}
          className={cn(CLASE_INPUT, "h-9")}
        />
      )}
    </label>
  );
}

// Precio o kilómetros: se ve con puntos de miles mientras se tipea (1.000.000)
// pero `onCambio` recibe solo los dígitos, así el formulario guarda lo mismo.
export function CampoNumero({ valor, onCambio, ...props }) {
  return <Campo {...props} valor={conPuntosDeMiles(aDigitos(valor))} onCambio={(v) => onCambio(soloDigitos(v))} inputMode="numeric" />;
}
