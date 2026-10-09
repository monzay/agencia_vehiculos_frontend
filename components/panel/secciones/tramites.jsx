"use client";

import { useState } from "react";
import { BookmarkCheck, Handshake, ShoppingCart, Banknote, Repeat } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";
import { SenaModal } from "./senas/sena-modal";
import { IngresoFormulario } from "./documentos/ingreso-formulario";

// Trámites: el único lugar donde se crea una operación. El usuario elige qué
// necesita el cliente y se abre el formulario que corresponde. Lo creado se
// sigue después en su sección (Señas o Documentos).

const OPCIONES = [
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
    titulo: "Venta con parte de pago",
    detalle: "La agencia le vende un vehículo; el cliente entrega un usado y lo que falta lo paga con plata o cuotas.",
    icono: Repeat,
  },
];

function Tarjetas({ opciones, onElegir }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {opciones.map(({ id, titulo, detalle, icono: Icono }) => (
        <button
          key={id}
          type="button"
          onClick={() => onElegir(id)}
          className={cn(
            "text-left rounded-xl border border-border bg-card p-4 flex gap-3 items-start",
            "hover:border-foreground/30 hover:bg-secondary/40 transition-colors"
          )}
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

// `onSenaCreada`: lleva a Señas. `onTramiteCreado({ id, modalidad })`: abre el legajo en Documentos.
export function SeccionTramites({ onSenaCreada, onTramiteCreado }) {
  const [abierto, setAbierto] = useState(null); // sena | consignacion | compra | contado | permuta

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">¿Qué necesita el cliente?</p>
      <Tarjetas opciones={OPCIONES} onElegir={setAbierto} />

      {abierto === "sena" && <SenaModal onCerrar={() => setAbierto(null)} onGuardado={onSenaCreada} />}

      {abierto && abierto !== "sena" && (
        <IngresoFormulario
          modalidad={abierto}
          onCerrar={() => setAbierto(null)}
          onGuardado={(ingreso) => onTramiteCreado({ id: ingreso.id, modalidad: ingreso.modalidad })}
        />
      )}
    </div>
  );
}
