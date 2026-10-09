"use client";

import { Selector, Aviso } from "./campos";
import { pesos } from "./impresos/etiquetas";
import { usarStockPropio } from "./usar-stock-propio";

// El auto de la agencia que compra el cliente, en el alta de la parte de pago o
// la venta al contado. El boleto lo toma de acá. Muestra el precio y lo que la
// agencia publicó para ese auto (descuento, promociones), como lo vio el cliente.
//
// `actual`: el auto ya elegido (al editar). `bloqueado`: no se puede cambiar
// (boleto firmado o trámite que nació de una seña).

const titulo = (a) => `${a.brand ?? a.marca} ${a.model ?? a.modelo} ${a.year ?? a.anio} · ref ${a.ref}`;

function Detalle({ auto }) {
  const promos = (auto.promociones ?? []).map((p) => p.nombre);
  return (
    <div className="text-xs text-muted-foreground space-y-0.5">
      <p>
        Precio de lista {pesos(auto.precio)}
        {auto.descuento && (
          <>
            {" · "}
            <span className="text-emerald-500">
              {auto.descuento.nombre}: {pesos(auto.precio_final)}
            </span>
          </>
        )}
      </p>
      {promos.length > 0 && <p>Promociones: {promos.join(", ")}</p>}
    </div>
  );
}

export function VehiculoQueCompra({ valor, onCambio, ingresoId = null, actual = null, bloqueado = false }) {
  const stock = usarStockPropio(!bloqueado, ingresoId);
  const elegido = stock.find((a) => a.ref === valor);

  if (bloqueado) return <p className="text-sm text-foreground">{actual ? titulo(actual) : "—"}</p>;

  const opciones = stock.map((a) => ({ valor: a.ref, label: titulo(a) }));
  // El auto ya elegido sigue en la lista aunque el filtro lo saque (por ejemplo,
  // si lo reservó la seña de este mismo trámite).
  if (actual && !opciones.some((o) => o.valor === actual.ref)) opciones.unshift({ valor: actual.ref, label: titulo(actual) });

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Selector label="Vehículo *" valor={valor} onCambio={onCambio} opciones={opciones} vacio="Elegí un vehículo…" />
      </div>
      {elegido && <Detalle auto={elegido} />}
      {elegido && !elegido.dominio && (
        <Aviso tono="alerta">Este vehículo no tiene dominio cargado: se puede crear el trámite, pero antes del boleto hay que completarlo en Vehículos → Editar.</Aviso>
      )}
    </div>
  );
}
