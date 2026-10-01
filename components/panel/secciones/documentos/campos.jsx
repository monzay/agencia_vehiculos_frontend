"use client";

import { combinadorClases as cn } from "@/lib/utilidades";
import { CLASE_INPUT } from "../../ui/campo";

// Piezas de formulario compartidas por el alta del ingreso, los papeles y el
// contrato. Todas hablan el mismo idioma: `valor` + `onCambio`.

export function Etiqueta({ label, ayuda, children, className }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>}
      {children}
      {ayuda && <span className="block text-[11px] text-muted-foreground mt-1">{ayuda}</span>}
    </label>
  );
}

export function Texto({ label, valor, onCambio, placeholder, tipo = "text", ayuda, className, ...props }) {
  return (
    <Etiqueta label={label} ayuda={ayuda} className={className}>
      <input
        type={tipo}
        value={valor ?? ""}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        className={cn(CLASE_INPUT, "h-9")}
        {...props}
      />
    </Etiqueta>
  );
}

export function Area({ label, valor, onCambio, placeholder, filas = 3, ayuda, className, maximo }) {
  return (
    <Etiqueta label={label} ayuda={ayuda} className={className}>
      <textarea
        value={valor ?? ""}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        rows={filas}
        maxLength={maximo}
        className={cn(CLASE_INPUT, "py-2 resize-y")}
      />
    </Etiqueta>
  );
}

// `opciones` = [{ valor, label }]. `vacio` agrega una opción sin elegir.
export function Selector({ label, valor, onCambio, opciones, vacio, ayuda, className }) {
  return (
    <Etiqueta label={label} ayuda={ayuda} className={className}>
      <select value={valor ?? ""} onChange={(e) => onCambio(e.target.value)} className={cn(CLASE_INPUT, "h-9")}>
        {vacio && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.label}
          </option>
        ))}
      </select>
    </Etiqueta>
  );
}

// Elección entre dos valores, dibujada como par de botones. Se usa para "quién
// paga qué": en el contrato siempre es agencia o cliente.
export function Alternador({ label, valor, onCambio, opciones, ayuda, className }) {
  return (
    <Etiqueta label={label} ayuda={ayuda} className={className}>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {opciones.map((o) => (
          <button
            key={String(o.valor)}
            type="button"
            onClick={() => onCambio(o.valor)}
            className={cn(
              "flex-1 h-9 text-xs font-medium transition-colors",
              valor === o.valor
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Etiqueta>
  );
}

// Encabezado de paso: número + título, con una línea que lo separa del anterior.
// Mismo patrón que el formulario de consignaciones, para que los dos se lean igual.
export function Paso({ n, titulo, ayuda, children, primero = false }) {
  return (
    <section className={cn("space-y-3", !primero && "pt-5 border-t border-border")}>
      <div className="flex items-baseline gap-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary border border-border text-[10px] font-semibold text-muted-foreground shrink-0">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">{titulo}</h3>
          {ayuda && <p className="text-xs text-muted-foreground mt-0.5">{ayuda}</p>}
        </div>
      </div>
      <div className="pl-[30px] space-y-3">{children}</div>
    </section>
  );
}

export function Aviso({ tono = "error", children }) {
  if (!children) return null;
  const tonos = {
    error: "bg-destructive/10 border-destructive/30 text-destructive",
    alerta: "bg-amber-500/10 border-amber-500/30 text-amber-500",
    info: "bg-secondary border-border text-muted-foreground",
  };
  return <div className={cn("rounded-xl border p-3 text-sm", tonos[tono])}>{children}</div>;
}
