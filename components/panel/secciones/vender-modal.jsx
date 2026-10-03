"use client";

import { useState } from "react";
import { CircleDollarSign } from "lucide-react";
import { Modal, ModalPie } from "../ui/modal";
import { Boton } from "../ui/boton";
import { Campo, CampoNumero } from "../ui/campo";

// Cierre de la venta de un auto propio.
//
// Pide el precio REAL de cierre, no el de lista: casi ninguna venta sale al
// precio publicado, y es ese número el que después se suma como facturación.
// La fecha se pide porque las ventas se cargan tarde, y si quedara siempre
// "hoy" la comparación entre meses saldría corrida.
export function VenderModal({ vehiculo, cargando, onConfirmar, onCancelar }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [precio, setPrecio] = useState(String(vehiculo.precio ?? ""));
  const [fecha, setFecha] = useState(hoy);

  const costo = vehiculo.costo;
  const ganancia = costo != null && precio !== "" ? Number(precio) - Number(costo) : null;

  return (
    <Modal
      titulo={`Vender ${vehiculo.brand} ${vehiculo.model}`}
      icono={CircleDollarSign}
      onCerrar={onCancelar}
      ancho="max-w-sm"
    >
      <div className="px-6 py-5 space-y-4">
        <CampoNumero
          label="Precio de venta (ARS)"
          valor={precio}
          onCambio={setPrecio}
          placeholder="A cuánto se cerró"
          autoFocus
        />
        <Campo label="Fecha de venta" tipo="date" valor={fecha} onCambio={setFecha} />

        {/* Adelanto de la ganancia para que un costo mal cargado se note ACÁ y
            no dos meses después en la contabilidad. */}
        {costo == null ? (
          <p className="text-xs text-muted-foreground">
            Este vehículo no tiene costo de compra cargado: la venta va a sumar facturación,
            pero <strong className="text-foreground">0 de ganancia</strong>. Podés cargarlo
            editando el vehículo.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Costo {precioARS(costo)} · ganancia{" "}
            <strong className={ganancia >= 0 ? "text-emerald-500" : "text-destructive"}>
              {ganancia == null ? "—" : precioARS(ganancia)}
            </strong>
          </p>
        )}
      </div>
      <ModalPie>
        <Boton variante="fantasma" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton
          onClick={() => onConfirmar({ precioVenta: precio === "" ? null : Number(precio), vendidoAt: fecha })}
          cargando={cargando}
        >
          Marcar vendido
        </Boton>
      </ModalPie>
    </Modal>
  );
}

function precioARS(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
