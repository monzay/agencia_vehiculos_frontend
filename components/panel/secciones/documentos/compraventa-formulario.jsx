"use client";

import { useEffect, useState } from "react";
import { FileSignature } from "lucide-react";
import { guardarCompraventaIngreso, obtenerVehiculosAdmin } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Texto, Numero, Selector, Area, Alternador, Paso, Aviso } from "./campos";
import { pesos } from "./impresos/etiquetas";

// Las condiciones del boleto de compraventa o del contrato de permuta.
//
// Son los puntos que un boleto de automotor tiene que dejar escritos para que
// no haya discusión después: precio y forma de pago, el momento exacto de la
// entrega (corta la responsabilidad del vendedor), el plazo para transferir, y
// quién paga la transferencia. Lo legal fijo (evicción, vicios ocultos, deudas
// anteriores a la entrega) lo pone el impreso: acá no se elige.

const A_CARGO = [
  { valor: "agencia", label: "La agencia" },
  { valor: "cliente", label: "El cliente" },
];

const FORMAS_PAGO = [
  { valor: "transferencia", label: "Transferencia" },
  { valor: "efectivo", label: "Efectivo" },
  { valor: "cheque", label: "Cheque" },
];

// Mismos topes que el backend: montos DECIMAL(12,2), textos que entran en la hoja.
const TOPE_MONTO = 9999999999.99;
const TOPE_LIBRE = 500;

// Un instante como lo pide <input type="datetime-local">: hora local, sin zona.
function aLocal(iso) {
  const d = iso ? new Date(iso) : new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

const aTexto = (n) => (n != null ? String(n) : "");

// Un boleto nuevo arranca con lo que ya se cargó al crear el trámite: lo que
// el cliente tiene para entregar y el estado en que se recibió la unidad. Un
// boleto ya guardado conserva sus propios valores. El valor del usado de la
// parte de pago no se carga acá: es siempre el valor de toma del trámite.
const aFormulario = (c, ingreso) => ({
  precio: c ? String(c.precio) : "",
  autoEntregadoRef: c?.permuta?.ref ?? "",
  entregadoValor: c?.permuta ? String(c.permuta.valor) : "",
  formaPago: c?.pago.forma ?? "transferencia",
  pagoEnActo: c ? String(c.pago.enActo) : aTexto(ingreso?.parteDePago?.efectivo),
  saldoFecha: c?.pago.saldoFecha ?? "",
  entrega: aLocal(c?.entrega),
  transferenciaDias: c ? String(c.transferencia.dias) : "30",
  gastosTransferencia: c?.transferencia.gastosACargo ?? "agencia",
  estadoUnidad: c ? c.estadoUnidad ?? "" : ingreso?.notas ?? "",
  condiciones: c?.condiciones ?? "",
  jurisdiccion: c?.jurisdiccion ?? "",
});

// Quién le paga a quién. Misma cuenta que hace el backend: en la parte de pago
// el usado se descuenta del precio del auto y se paga solo el saldo.
function aPagar(precio, valorEntregado) {
  if (valorEntregado == null) return { pagador: "agencia", monto: precio };
  const diferencia = precio - valorEntregado;
  if (diferencia === 0) return { pagador: null, monto: 0 };
  return diferencia > 0 ? { pagador: "agencia", monto: diferencia } : { pagador: "cliente", monto: -diferencia };
}

const QUIEN_PAGA = { agencia: "La agencia le paga al cliente", cliente: "El cliente le paga a la agencia" };
// En la parte de pago lo normal es que el cliente pague un saldo; si el usado
// vale más que el auto, la diferencia la paga la agencia.
const QUIEN_PAGA_SALDO = {
  agencia: "El usado vale más que el auto: la agencia le paga al cliente",
  cliente: "Saldo de precio a pagar por el cliente:",
};

// La cuenta de la parte de pago renglón por renglón: el auto de la agencia,
// menos el usado, menos lo que el cliente entrega en el acto, da lo que queda.
function DesgloseParteDePago({ precioAuto, valorUsado, enActo }) {
  const filas = [
    ["Precio del auto de la agencia", pesos(precioAuto)],
    ["− Usado que entrega el cliente", pesos(valorUsado)],
    ["− Tiene para entregar en el acto", pesos(enActo)],
  ];
  return (
    <div className="rounded-lg border border-border text-sm">
      {filas.map(([label, valor]) => (
        <div key={label} className="flex justify-between gap-4 px-3 py-1.5 border-b border-border">
          <span className="text-muted-foreground">{label}</span>
          <span className="tabular-nums text-foreground">{valor}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 px-3 py-1.5 font-medium">
        <span className="text-foreground">Queda pendiente de pago</span>
        <span className="tabular-nums text-foreground">{pesos(precioAuto - valorUsado - enActo)}</span>
      </div>
    </div>
  );
}

// Los autos de la agencia que se pueden dar en permuta: los que están a la venta.
function useStockPropio(activo) {
  const [stock, setStock] = useState([]);
  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    obtenerVehiculosAdmin("no")
      .then((autos) => vigente && setStock(autos.filter((a) => !a.consignacion)))
      .catch(() => vigente && setStock([]));
    return () => {
      vigente = false;
    };
  }, [activo]);
  return stock;
}

export function CompraventaFormulario({ ingresoId, ingreso, modalidad, contrato, onCerrar, onGuardado }) {
  const esPermuta = modalidad === "permuta";
  const [form, setForm] = useState(() => aFormulario(contrato, ingreso));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const stock = useStockPropio(esPermuta);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  // Al elegir el auto, el precio de venta arranca en su precio de lista.
  const elegirAuto = (ref) => {
    const auto = stock.find((a) => a.ref === ref);
    setForm((f) => ({ ...f, autoEntregadoRef: ref, entregadoValor: auto ? String(auto.precio) : f.entregadoValor }));
  };
  const elegido = stock.find((a) => a.ref === form.autoEntregadoRef);

  // En la parte de pago el valor del usado sale del trámite, igual que en el backend.
  const precio = esPermuta ? Number(ingreso?.parteDePago?.valor ?? 0) : Number(form.precio);
  const valorEntregado = esPermuta ? Number(form.entregadoValor) : null;
  const montosListos = precio > 0 && (!esPermuta || valorEntregado > 0);
  const pago = montosListos ? aPagar(precio, valorEntregado) : null;
  const enActo = form.pagoEnActo === "" ? pago?.monto ?? 0 : Number(form.pagoEnActo);
  const haySaldo = Boolean(pago) && enActo < pago.monto;

  const opcionesStock = stock.map((a) => ({ valor: a.ref, label: `${a.brand} ${a.model} ${a.year} · ref ${a.ref}` }));
  // Si el auto elegido ya no está a la venta (se vendió después), igual se ve.
  if (contrato?.permuta && !opcionesStock.some((o) => o.valor === contrato.permuta.ref)) {
    const p = contrato.permuta;
    opcionesStock.unshift({ valor: p.ref, label: `${p.marca} ${p.modelo} ${p.anio} · ref ${p.ref}` });
  }

  function validar() {
    if (!(precio > 0)) {
      return esPermuta ? "Falta el valor de toma del usado: cargalo en Editar ingreso." : "El valor del vehículo del cliente es obligatorio.";
    }
    if (precio > TOPE_MONTO) return "El valor del vehículo supera el máximo que admite el sistema.";
    if (esPermuta) {
      if (!form.autoEntregadoRef) return "Elegí el vehículo que vende la agencia.";
      if (!(valorEntregado > 0)) return "Falta el precio de venta del vehículo de la agencia.";
      if (valorEntregado > TOPE_MONTO) return "El valor del vehículo de la agencia supera el máximo que admite el sistema.";
    }
    if (!Number.isFinite(enActo) || enActo < 0) return "Lo que se paga en el acto no es válido.";
    if (enActo > pago.monto) return "Lo que se paga en el acto no puede superar el total a pagar.";
    if (haySaldo && !form.saldoFecha) return "Queda saldo: indicá la fecha en que se paga.";
    if (!form.entrega) return "Indicá la fecha y hora de entrega.";
    const dias = Number(form.transferenciaDias);
    if (!Number.isInteger(dias) || dias < 1 || dias > 365) return "El plazo para transferir va de 1 a 365 días.";
    return null;
  }

  async function guardar() {
    const problema = validar();
    if (problema) return setError(problema);

    setGuardando(true);
    setError(null);
    try {
      await guardarCompraventaIngreso(ingresoId, {
        precio,
        ...(esPermuta && {
          autoEntregadoRef: form.autoEntregadoRef,
          entregadoValor: valorEntregado,
        }),
        formaPago: form.formaPago,
        pagoEnActo: enActo,
        saldoFecha: haySaldo ? form.saldoFecha : null,
        entrega: new Date(form.entrega).toISOString(),
        transferenciaDias: Number(form.transferenciaDias),
        gastosTransferencia: form.gastosTransferencia,
        estadoUnidad: form.estadoUnidad,
        condiciones: form.condiciones,
        jurisdiccion: form.jurisdiccion,
      });
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  let n = 0;
  const paso = () => ++n;

  return (
    <Modal titulo={esPermuta ? "Boleto de compraventa con parte de pago" : "Boleto de compraventa"} icono={FileSignature} onCerrar={onCerrar} ancho="max-w-3xl">
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}
        {esPermuta && !(precio > 0) && (
          <Aviso tono="alerta">El trámite no tiene cargado el valor de toma del usado. Cargalo en Editar ingreso antes de guardar el boleto.</Aviso>
        )}
        <p className="text-xs text-muted-foreground">Los campos con * son obligatorios.</p>

        {/* En la parte de pago el valor del usado no se pide: es el valor de toma del trámite. */}
        {!esPermuta && (
          <Paso n={paso()} titulo="Valor del vehículo del cliente" ayuda="Lo que la agencia reconoce por la unidad que recibe." primero>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Numero label="Valor ($) *" valor={form.precio} onCambio={set("precio")} placeholder="15.000.000" />
            </div>
          </Paso>
        )}

        {esPermuta && (
          <Paso
            n={paso()}
            titulo="Vehículo que vende la agencia"
            ayuda="Sale del stock a la venta. Dominio, motor y chasis se toman de su ficha en Vehículos."
            primero
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Selector
                label="Vehículo *"
                valor={form.autoEntregadoRef}
                onCambio={elegirAuto}
                opciones={opcionesStock}
                vacio="Elegí un vehículo…"
              />
              <Numero
                label="Precio de venta ($) *"
                valor={form.entregadoValor}
                onCambio={set("entregadoValor")}
                ayuda="Se completa con el precio del auto; se puede ajustar."
              />
            </div>
            {elegido && !elegido.dominio && (
              <Aviso tono="alerta">Este vehículo no tiene dominio cargado. Completalo en Vehículos → Editar antes de guardar el boleto.</Aviso>
            )}
          </Paso>
        )}

        <Paso
          n={paso()}
          titulo="Pago"
          ayuda={esPermuta ? "El precio del auto menos el usado y lo que el cliente tiene para entregar." : "Lo que la agencia le paga al vendedor."}
        >
          {pago && (
            <p className="text-sm text-foreground">
              {pago.pagador ? (
                <>
                  {(esPermuta ? QUIEN_PAGA_SALDO : QUIEN_PAGA)[pago.pagador]} <strong>{pesos(pago.monto)}</strong>
                </>
              ) : (
                "El usado cubre todo el precio: no queda saldo a pagar."
              )}
            </p>
          )}
          {esPermuta && pago?.pagador === "cliente" && Number.isFinite(enActo) && (
            <DesgloseParteDePago precioAuto={valorEntregado} valorUsado={precio} enActo={enActo} />
          )}
          {pago?.pagador && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Selector label="Forma de pago" valor={form.formaPago} onCambio={set("formaPago")} opciones={FORMAS_PAGO} />
              <Texto
                label={esPermuta && pago.pagador === "cliente" ? "Tiene para entregar en el acto ($)" : "Se paga en el acto ($)"}
                valor={form.pagoEnActo}
                onCambio={set("pagoEnActo")}
                inputMode="decimal"
                placeholder={String(pago.monto)}
                ayuda="Vacío = todo en el acto."
              />
              {haySaldo && (
                <Texto
                  label={`Saldo de ${pesos(pago.monto - enActo)} el día *`}
                  tipo="date"
                  valor={form.saldoFecha}
                  onCambio={set("saldoFecha")}
                />
              )}
            </div>
          )}
        </Paso>

        <Paso
          n={paso()}
          titulo="Entrega y transferencia"
          ayuda="Desde la hora de entrega la unidad queda bajo responsabilidad de la agencia; desde ahí corre el plazo para transferir."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Texto label="Fecha y hora de entrega *" tipo="datetime-local" valor={form.entrega} onCambio={set("entrega")} />
            <Texto
              label="Plazo para transferir (días) *"
              valor={form.transferenciaDias}
              onCambio={set("transferenciaDias")}
              inputMode="numeric"
              ayuda="Vencido, el vendedor puede hacer la denuncia de venta."
            />
            <Alternador label="Gastos de transferencia" valor={form.gastosTransferencia} onCambio={set("gastosTransferencia")} opciones={A_CARGO} />
          </div>
        </Paso>

        <Paso n={paso()} titulo="Estado y condiciones" ayuda="Lo que se imprime tal cual en el boleto.">
          <Area
            label="Estado de la unidad al recibirla"
            valor={form.estadoUnidad}
            onCambio={set("estadoUnidad")}
            maximo={TOPE_LIBRE}
            placeholder="Chapa, faltantes, cubiertas, rueda de auxilio…"
            ayuda="Arranca con el estado cargado al crear el trámite. Los kilómetros salen del ingreso."
          />
          <Area
            label="Condiciones particulares"
            valor={form.condiciones}
            onCambio={set("condiciones")}
            maximo={TOPE_LIBRE}
            placeholder="Cancelación de prenda a cargo del vendedor con el saldo, entrega de segunda llave…"
            ayuda="Vacío = no se pactó nada especial."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Texto
              label="Jurisdicción (tribunales de)"
              valor={form.jurisdiccion}
              onCambio={set("jurisdiccion")}
              placeholder="Córdoba Capital"
              ayuda="Vacío = los del domicilio de la agencia."
            />
          </div>
        </Paso>
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={guardar} cargando={guardando}>
          Guardar condiciones
        </Boton>
      </ModalPie>
    </Modal>
  );
}
