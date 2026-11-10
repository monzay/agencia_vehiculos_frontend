"use client";

import { useEffect, useState } from "react";
import { BookmarkCheck } from "lucide-react";
import { crearSena, actualizarSena, obtenerVehiculosAdmin } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Texto, Numero, Selector, Area, Paso, Aviso } from "../documentos/campos";
import { BuscadorPersona, ayudaDeCarga } from "../documentos/buscador-persona";
import { pesos } from "../documentos/impresos/etiquetas";
import { FORMAS_PAGO, tituloAuto, fechaCorta } from "./formato";

// Alta y edición de una seña. El plazo es obligatorio a propósito: cuántos días
// se mantiene la reserva lo decide la agencia en cada caso. Se carga en días y
// se guarda como fecha de vencimiento (hoy + plazo).

const TOPE_MONTO = 9999999999.99;
const MAX_DIAS = 365;
const DIA_MS = 86_400_000;

// Fecha local AAAA-MM-DD a `dias` de hoy. Se arma con el calendario local para
// que no se corra de día por el huso horario.
function enDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("en-CA");
}

// Al editar, el plazo arranca en los días que le quedan. Vencida, vacío.
function diasRestantes(vence) {
  if (!vence) return "";
  const [a, m, d] = vence.split("-").map(Number);
  const hoy = new Date();
  const dias = Math.round((new Date(a, m - 1, d) - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / DIA_MS);
  return dias >= 1 ? String(dias) : "";
}

// Los autos que se pueden señar: a la venta y sin otra seña que los reserve.
function useAutosLibres(activo) {
  const [autos, setAutos] = useState([]);
  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    obtenerVehiculosAdmin("no")
      .then((lista) => vigente && setAutos((lista ?? []).filter((a) => !a.sena)))
      .catch(() => vigente && setAutos([]));
    return () => {
      vigente = false;
    };
  }, [activo]);
  return autos;
}

function validar(form, editando) {
  if (!editando) {
    if (!form.autoRef) return "Elegí el vehículo que se seña.";
    if (!form.cliente.nombre.trim()) return "El nombre del cliente es obligatorio.";
    const dni = form.cliente.dni.replace(/\D/g, "");
    if (dni.length < 7 || dni.length > 9) return "El DNI del cliente debe tener entre 7 y 9 dígitos.";
  }
  const monto = Number(form.monto);
  if (!(monto > 0)) return "El monto de la seña es obligatorio.";
  if (monto > TOPE_MONTO) return "El monto supera el máximo que admite el sistema.";
  const dias = Number(form.plazo);
  if (!form.plazo || !Number.isInteger(dias) || dias < 1) return "Indicá el plazo de la seña en días.";
  if (dias > MAX_DIAS) return `El plazo no puede superar los ${MAX_DIAS} días.`;
  return null;
}

const aCliente = (p) => ({ nombre: p?.nombre ?? "", apellido: p?.apellido ?? "", dni: p?.dni ?? "", telefono: p?.telefono ?? "" });

// `auto`, `clienteInicial` y `sesionId`: vienen cargados si se avanzó desde una consulta. `sena`: para editar.
export function SenaModal({ sena = null, auto = null, clienteInicial = null, sesionId = null, onCerrar, onGuardado }) {
  const editando = Boolean(sena);
  const desdeConsulta = Boolean(sesionId);
  const [form, setForm] = useState(() => ({
    autoRef: auto?.ref ?? "",
    cliente: aCliente(clienteInicial),
    monto: sena ? String(sena.monto) : "",
    formaPago: sena?.formaPago ?? "efectivo",
    plazo: diasRestantes(sena?.vence),
    notas: sena?.notas ?? "",
  }));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const libres = useAutosLibres(!editando && !auto);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const setCliente = (campo) => (valor) => setForm((f) => ({ ...f, cliente: { ...f.cliente, [campo]: valor } }));
  const elegirPersona = (p) => setForm((f) => ({ ...f, cliente: aCliente(p) }));

  const autoElegido = sena?.auto ?? auto ?? libres.find((a) => a.ref === form.autoRef);

  async function guardar() {
    const problema = validar(form, editando);
    if (problema) return setError(problema);
    setGuardando(true);
    setError(null);
    try {
      const datos = { monto: Number(form.monto), formaPago: form.formaPago, vence: enDias(Number(form.plazo)), notas: form.notas };
      if (editando) await actualizarSena(sena.id, datos);
      else await crearSena({ ...datos, autoRef: form.autoRef, cliente: form.cliente, sesionId });
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo={editando ? "Editar seña" : "Nueva seña"} icono={BookmarkCheck} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}
        <p className="text-xs text-muted-foreground">Los campos con * son obligatorios.</p>

        <Paso n={1} titulo="Vehículo" ayuda="Mientras la seña esté vigente, el auto no se ve en el catálogo." primero>
          {editando || auto ? (
            <p className="text-sm text-foreground">
              {tituloAuto(autoElegido)}
              {autoElegido?.precio != null && <span className="text-muted-foreground"> · {pesos(autoElegido.precio)}</span>}
            </p>
          ) : (
            <Selector
              label="Vehículo *"
              valor={form.autoRef}
              onCambio={set("autoRef")}
              opciones={libres.map((a) => ({ valor: a.ref, label: `${a.brand} ${a.model} ${a.year} · ref ${a.ref}` }))}
              vacio="Elegí un vehículo…"
            />
          )}
        </Paso>

        <Paso n={2} titulo="Cliente" ayuda={editando ? undefined : `Quien deja la seña. ${ayudaDeCarga(desdeConsulta)}`}>
          {editando ? (
            <p className="text-sm text-foreground">
              {[sena.cliente?.nombre, sena.cliente?.apellido].filter(Boolean).join(" ") || "Sin nombre"}
              {sena.cliente?.dni && <span className="text-muted-foreground"> · DNI {sena.cliente.dni}</span>}
            </p>
          ) : (
            <>
              {!desdeConsulta && <BuscadorPersona onElegir={elegirPersona} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Texto label="Nombre *" valor={form.cliente.nombre} onCambio={setCliente("nombre")} placeholder="Juan" />
                <Texto label="Apellido" valor={form.cliente.apellido} onCambio={setCliente("apellido")} placeholder="Pérez" />
                <Texto label="DNI *" valor={form.cliente.dni} onCambio={setCliente("dni")} placeholder="30123456" inputMode="numeric" />
                <Texto label="Teléfono" valor={form.cliente.telefono} onCambio={setCliente("telefono")} placeholder="3884001122" />
              </div>
            </>
          )}
        </Paso>

        <Paso n={3} titulo="Seña" ayuda="Si el cliente se arrepiente, pierde la seña.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Numero label="Monto ($) *" valor={form.monto} onCambio={set("monto")} placeholder="500.000" />
            <Selector label="Forma de pago" valor={form.formaPago} onCambio={set("formaPago")} opciones={FORMAS_PAGO} />
            <Numero
              label="Plazo (días) *"
              valor={form.plazo}
              onCambio={set("plazo")}
              placeholder="30"
              ayuda={
                Number(form.plazo) >= 1 && Number(form.plazo) <= MAX_DIAS
                  ? `Vence el ${fechaCorta(enDias(Number(form.plazo)))}, inclusive.`
                  : editando
                    ? "Días desde hoy: sirve para extenderla."
                    : "Cuántos días se reserva el auto."
              }
            />
          </div>
          <Area label="Notas" valor={form.notas} onCambio={set("notas")} maximo={500} filas={2} placeholder="Lo que se haya acordado con el cliente…" />
        </Paso>
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={guardar} cargando={guardando}>
          {editando ? "Guardar cambios" : "Registrar seña"}
        </Boton>
      </ModalPie>
    </Modal>
  );
}
