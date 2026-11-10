"use client";

import { BookmarkCheck, Handshake, ShoppingCart, Banknote, Repeat } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";
import { SenaModal } from "./senas/sena-modal";
import { IngresoFormulario } from "./documentos/ingreso-formulario";

// Las operaciones que se pueden abrir: las que muestran Trámites y el botón Avanzar
// de una consulta, y el formulario de cada una.

export const OPERACIONES = [
  { id: "sena", titulo: "Seña", detalle: "El cliente deja plata para reservar un vehículo.", icono: BookmarkCheck },
  { id: "consignacion", titulo: "Consignación", detalle: "El cliente deja su vehículo para que la agencia lo venda.", icono: Handshake },
  { id: "compra", titulo: "Compra de la agencia", detalle: "La agencia le compra el vehículo al cliente.", icono: ShoppingCart },
  {
    id: "contado",
    titulo: "Venta al contado",
    detalle: "La agencia le vende un vehículo y el cliente lo paga con plata, sin usado ni cuotas.",
    icono: Banknote,
  },
  {
    id: "permuta",
    titulo: "Venta financiada o con parte de pago",
    detalle: "La agencia le vende un vehículo; el cliente deja un anticipo o entrega un usado, y lo que falta lo paga con plata o cuotas.",
    icono: Repeat,
  },
];

export function TarjetasOperacion({ opciones = OPERACIONES, onElegir, className }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3", className)}>
      {opciones.map(({ id, titulo, detalle, icono: Icono }) => (
        <button
          key={id}
          type="button"
          onClick={() => onElegir(id)}
          className="text-left rounded-xl border border-border bg-card p-4 flex gap-3 items-start hover:border-foreground/30 hover:bg-secondary/40 transition-colors"
        >
          <span className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
            <Icono className="w-4 h-4 text-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">{titulo}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">{detalle}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// `precarga`: los datos de la consulta, si se avanzó desde una.
// `onSenaCreada`: al registrar la seña. `onTramiteCreado({ id, modalidad })`: al crear el trámite.
export function FormularioOperacion({ operacion, precarga = null, onCerrar, onSenaCreada, onTramiteCreado }) {
  if (operacion === "sena") {
    return (
      <SenaModal
        auto={precarga?.auto?.puedeSenar ? precarga.auto : null}
        clienteInicial={precarga?.cliente}
        sesionId={precarga?.sesionId}
        onCerrar={onCerrar}
        onGuardado={onSenaCreada}
      />
    );
  }
  return (
    <IngresoFormulario
      modalidad={operacion}
      precarga={precarga}
      onCerrar={onCerrar}
      onGuardado={(ingreso) => onTramiteCreado({ id: ingreso.id, modalidad: ingreso.modalidad })}
    />
  );
}
