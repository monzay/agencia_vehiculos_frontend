"use client";

import { AlertTriangle } from "lucide-react";
import { Texto, Selector } from "./campos";

// Un campo del papel, dibujado según lo que declara el catálogo. El valor del
// formulario siempre es texto: el backend lo convierte al tipo que corresponde.
//
// `dudoso` marca los campos que el escaneo leyó con dudas. Es la diferencia
// entre un formulario precargado y uno precargado en el que se sabe dónde mirar.

const SI_NO = [
  { valor: "true", label: "Sí" },
  { valor: "false", label: "No" },
];

function Control({ campo, valor, onCambio }) {
  const label = campo.requerido ? `${campo.label} *` : campo.label;

  if (campo.tipo === "booleano") {
    return <Selector label={label} valor={valor} onCambio={onCambio} opciones={SI_NO} vacio="Sin completar" />;
  }
  if (campo.tipo === "opciones") {
    const opciones = campo.opciones.map((o) => ({ valor: o, label: o.replace(/_/g, " ") }));
    return <Selector label={label} valor={valor} onCambio={onCambio} opciones={opciones} vacio="Sin completar" />;
  }
  if (campo.tipo === "fecha") {
    return <Texto label={label} valor={valor} onCambio={onCambio} tipo="date" />;
  }
  if (campo.tipo === "numero" || campo.tipo === "moneda") {
    return <Texto label={label} valor={valor} onCambio={onCambio} inputMode="decimal" placeholder={campo.tipo === "moneda" ? "0" : ""} />;
  }
  return <Texto label={label} valor={valor} onCambio={onCambio} maxLength={campo.max} />;
}

export function CampoDeclarado({ campo, valor, onCambio, dudoso = false }) {
  return (
    <div>
      <Control campo={campo} valor={valor} onCambio={onCambio} />
      {dudoso && (
        <p className="text-[11px] text-amber-500 inline-flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3 h-3 shrink-0" /> Se leyó con dudas: comparalo con la foto
        </p>
      )}
    </div>
  );
}
