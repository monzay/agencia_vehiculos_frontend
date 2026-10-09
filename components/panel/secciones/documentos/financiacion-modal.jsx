"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { crearFinanciacionIngreso, actualizarFinanciacion } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Numero, Selector, Paso, Aviso } from "./campos";
import { pesos } from "./impresos/etiquetas";

// Financiación del saldo de una parte de pago: lo que el cliente todavía debe
// del auto (precio − usado − lo que entregó en el acto) se paga en cuotas.
// Es una financiación más: también aparece en la sección Financiación.

const DIAS = Array.from({ length: 31 }, (_, i) => ({ valor: String(i + 1), label: `Día ${i + 1} de cada mes` }));
const MAX_CUOTAS = 600;

// Misma regla que el backend (financiacion.mapper.js): la 1ª cuota vence el día
// de pago del mes de alta si todavía no pasó, si no el mes siguiente; cada
// cuota suma un mes y un día inexistente se corta al último del mes.
function vencimientoUltimaCuota(altaISO, cuotas, diaPago) {
  const base = altaISO ? new Date(altaISO) : new Date();
  const offset = diaPago >= base.getDate() ? 0 : 1;
  const mes = base.getMonth() + offset + cuotas - 1;
  const ultimoDia = new Date(base.getFullYear(), mes + 1, 0).getDate();
  return new Date(base.getFullYear(), mes, Math.min(diaPago, ultimoDia));
}

function Renglon({ label, valor, fuerte = false }) {
  return (
    <div className={`flex justify-between gap-4 px-3 py-1.5 border-b border-border last:border-b-0 ${fuerte ? "font-medium" : ""}`}>
      <span className={fuerte ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums text-foreground">{valor}</span>
    </div>
  );
}

export function FinanciacionModal({ ingreso, onCerrar, onGuardado }) {
  const { contrato, financiacion } = ingreso;
  const editando = Boolean(financiacion);

  const [form, setForm] = useState(() => ({
    cantidadCuotas: financiacion ? String(financiacion.cantidadCuotas) : "",
    precioCuota: financiacion ? String(financiacion.precioCuota) : "",
    diaPago: String(financiacion?.diaPago ?? 10),
  }));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  // Lo que queda del vehículo sale del boleto: sin boleto no hay saldo que financiar.
  const restante = contrato?.pago.pagador === "cliente" ? contrato.pago.saldo : 0;
  const precioAuto = contrato?.permuta?.valor ?? 0;

  const cuotas = Number(form.cantidadCuotas);
  const precioCuota = Number(form.precioCuota);
  const diaPago = Number(form.diaPago);
  const planListo = Number.isInteger(cuotas) && cuotas > 0 && precioCuota > 0;
  const totalFinanciado = planListo ? cuotas * precioCuota : 0;
  const diferencia = totalFinanciado - restante;
  const fin = planListo ? vencimientoUltimaCuota(financiacion?.creado, cuotas, diaPago) : null;

  function validar() {
    if (!Number.isInteger(cuotas) || cuotas < 1 || cuotas > MAX_CUOTAS) return `La cantidad de cuotas va de 1 a ${MAX_CUOTAS}.`;
    if (!(precioCuota > 0)) return "El precio de la cuota debe ser mayor a 0.";
    return null;
  }

  async function guardar() {
    const problema = validar();
    if (problema) return setError(problema);
    setGuardando(true);
    setError(null);
    try {
      const datos = { cantidadCuotas: cuotas, precioCuota, diaPago };
      if (editando) await actualizarFinanciacion(financiacion.id, datos);
      else await crearFinanciacionIngreso(ingreso.id, datos);
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo={editando ? "Editar financiación" : "Nueva financiación"} icono={HandCoins} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}

        {!contrato ? (
          <Aviso tono="alerta">Primero cargá las condiciones del boleto: de ahí sale lo que queda por pagar del vehículo.</Aviso>
        ) : !(restante > 0) && !editando ? (
          <Aviso tono="info">El boleto no tiene saldo a pagar por el cliente: no hay nada que financiar.</Aviso>
        ) : (
          <>
            <Paso n={1} titulo="Plan de cuotas" ayuda="Lo que queda por pagar del vehículo, en cuotas mensuales." primero>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Numero label="Cantidad de cuotas *" valor={form.cantidadCuotas} onCambio={set("cantidadCuotas")} placeholder="12" />
                <Numero label="Precio de cada cuota ($) *" valor={form.precioCuota} onCambio={set("precioCuota")} placeholder="850.000" />
                <Selector label="Fecha de pago *" valor={form.diaPago} onCambio={set("diaPago")} opciones={DIAS} />
              </div>
            </Paso>

            <Paso n={2} titulo="Resumen" ayuda="Se calcula solo con el boleto y el plan de cuotas.">
              <div className="rounded-lg border border-border text-sm">
                <Renglon label="Restante del vehículo" valor={pesos(restante)} />
                <Renglon label="Total financiado" valor={planListo ? pesos(totalFinanciado) : "—"} />
                <Renglon
                  label="Diferencia entre el restante y la financiación"
                  valor={planListo ? `${diferencia > 0 ? "+ " : ""}${pesos(diferencia)}` : "—"}
                />
                <Renglon label="Precio del auto" valor={pesos(precioAuto)} />
                <Renglon label="Precio final con la financiación" valor={planListo ? pesos(precioAuto + diferencia) : "—"} fuerte />
                <Renglon label="Termina de pagar" valor={fin ? fin.toLocaleDateString("es-AR") : "—"} fuerte />
              </div>
              {planListo && diferencia < 0 && (
                <Aviso tono="alerta">El total de las cuotas es menor que lo que queda por pagar del vehículo.</Aviso>
              )}
            </Paso>
          </>
        )}
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        {contrato && (restante > 0 || editando) && (
          <Boton variante="primario" onClick={guardar} cargando={guardando}>
            {editando ? "Guardar cambios" : "Crear financiación"}
          </Boton>
        )}
      </ModalPie>
    </Modal>
  );
}
