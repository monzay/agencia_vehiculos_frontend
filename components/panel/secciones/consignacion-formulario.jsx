"use client";

import { useState } from "react";
import { conPuntosDeMiles, soloDigitos, aDigitos } from "@/lib/numeros";
import { Handshake, AlertCircle } from "lucide-react";
import { crearConsignacion, actualizarConsignacion } from "@/lib/api";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Modal, ModalPie } from "../ui/modal";
import { Boton } from "../ui/boton";
import { Campo, CLASE_INPUT } from "../ui/campo";
import { SelectorVehiculo } from "./selector-vehiculo";

export const ESTADOS = [
  { valor: "en_venta", label: "En venta" },
  { valor: "vendido", label: "Vendido" },
  { valor: "retirado", label: "Retirado" },
];

const VACIO = {
  vehiculoRef: "", patente: "",
  duenioNombre: "", duenioTelefono: "",
  precioPactado: "", comision: "", estado: "en_venta", notas: "",
};

// `consignacion` viene con el shape del backend (vehiculo/duenio anidados).
const aFormulario = (c) =>
  c
    ? {
        vehiculoRef: c.vehiculo?.ref ?? "",
        patente: c.patente ?? "",
        duenioNombre: c.duenio.nombre,
        duenioTelefono: c.duenio.telefono ?? "",
        precioPactado: String(c.precioPactado),
        comision: String(c.comision),
        estado: c.estado,
        notas: c.notas ?? "",
      }
    : VACIO;

// Las mismas reglas que el backend, para avisar sin ir y volver.
function validar(f) {
  if (!f.vehiculoRef) return "Elegí un vehículo del catálogo.";
  if (!f.duenioNombre.trim()) return "El nombre del dueño es obligatorio.";

  const precio = Number(f.precioPactado);
  if (!Number.isFinite(precio) || precio < 0) return "El precio pactado no es válido.";

  const comision = Number(f.comision);
  if (!Number.isFinite(comision) || comision < 0 || comision > 100) return "La comisión debe estar entre 0 y 100.";
  return null;
}

const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

// Encabezado de paso: número + título, con una línea que lo separa del anterior.
function Paso({ n, titulo, ayuda, children, primero = false }) {
  return (
    <section className={cn("space-y-3", !primero && "pt-5 border-t border-border")}>
      <div className="flex items-baseline gap-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary border border-border text-[10px] font-semibold text-muted-foreground shrink-0">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground leading-none">{titulo}</h3>
          {ayuda && <p className="text-xs text-muted-foreground mt-1">{ayuda}</p>}
        </div>
      </div>
      <div className="pl-[30px]">{children}</div>
    </section>
  );
}

export function FormularioConsignacion({ consignacion, vehiculos, onCerrar, onGuardado }) {
  const [form, setForm] = useState(aFormulario(consignacion));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const editando = Boolean(consignacion);
  const campo = (clave) => (valor) => setForm((f) => ({ ...f, [clave]: valor }));

  const precio = Number(form.precioPactado);
  const comision = Number(form.comision);
  const hayAcuerdo = Number.isFinite(precio) && precio > 0 && Number.isFinite(comision) && comision >= 0;
  const ganancia = hayAcuerdo ? precio * (comision / 100) : null;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    const problema = validar(form);
    if (problema) return setError(problema);

    setGuardando(true);
    try {
      const datos = {
        vehiculoRef: form.vehiculoRef,
        patente: form.patente.trim() || null,
        duenioNombre: form.duenioNombre.trim(),
        duenioTelefono: form.duenioTelefono.trim() || null,
        precioPactado: precio,
        comision,
        estado: form.estado,
        notas: form.notas.trim() || null,
      };
      await (editando ? actualizarConsignacion(consignacion.id, datos) : crearConsignacion(datos));
      await onGuardado?.();
      onCerrar();
    } catch (err) {
      setError(err.message || "No se pudo guardar la consignación.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? "Editar consignación" : "Nueva consignación"}
      icono={Handshake}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
    >
      {/* El form es el flex item que se estira: así el cuerpo scrollea y el pie queda fijo. */}
      <form onSubmit={enviar} className="flex flex-col min-h-0 flex-1">
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          <Paso n={1} titulo="Vehículo" ayuda="Elegilo del catálogo. Marca, modelo, año y kilómetros se toman de ahí." primero>
            <SelectorVehiculo vehiculos={vehiculos} refElegida={form.vehiculoRef} onElegir={campo("vehiculoRef")} />
            <div className="mt-3 sm:max-w-[240px]">
              <Campo label="Patente (opcional)" valor={form.patente} onCambio={campo("patente")} placeholder="AB123CD" />
            </div>
          </Paso>

          <Paso n={2} titulo="Dueño" ayuda="Quién es el titular del vehículo.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Nombre" valor={form.duenioNombre} onCambio={campo("duenioNombre")} placeholder="Ana Ruiz" />
              <Campo label="Teléfono (opcional)" valor={form.duenioTelefono} onCambio={campo("duenioTelefono")} placeholder="3885551234" />
            </div>
          </Paso>

          <Paso n={3} titulo="Acuerdo" ayuda="Precio que se pactó con el dueño y comisión de la agencia.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Precio pactado</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={conPuntosDeMiles(aDigitos(form.precioPactado))}
                    onChange={(e) => campo("precioPactado")(soloDigitos(e.target.value))}
                    placeholder="8.000.000"
                    className={cn(CLASE_INPUT, "h-9 pl-7")}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Comisión</span>
                <div className="relative">
                  <input
                    type="number"
                    value={form.comision}
                    onChange={(e) => campo("comision")(e.target.value)}
                    placeholder="10"
                    className={cn(CLASE_INPUT, "h-9 pr-8")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                </div>
              </label>
            </div>

            {/* Resumen del acuerdo: se arma con lo que hay escrito ahora. */}
            <div
              className={cn(
                "mt-3 rounded-lg border px-4 py-3 transition-colors",
                ganancia ? "border-accent/30 bg-accent/5" : "border-dashed border-border bg-secondary/30"
              )}
            >
              {ganancia ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">Si se vende al precio pactado</span>
                  <div className="flex items-baseline gap-4 tabular-nums">
                    <span className="text-xs text-muted-foreground">
                      Al dueño <span className="text-foreground">{pesos(precio - ganancia)}</span>
                    </span>
                    <span className="text-sm">
                      <span className="text-muted-foreground text-xs">A la agencia </span>
                      <span className="font-semibold text-foreground">{pesos(ganancia)}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Cargá el precio y la comisión para ver cuánto se lleva cada parte.</p>
              )}
            </div>

            {/* Estado: control segmentado, más claro que un desplegable de 3. */}
            <div className="mt-4">
              <span className="block text-xs font-medium text-muted-foreground mb-1.5">Estado</span>
              <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5">
                {ESTADOS.map((e) => (
                  <button
                    key={e.valor}
                    type="button"
                    onClick={() => campo("estado")(e.valor)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      form.estado === e.valor
                        ? "bg-card text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </Paso>

          <Paso n={4} titulo="Notas" ayuda="Opcional. Detalles del acuerdo o del estado del vehículo.">
            <textarea
              value={form.notas}
              onChange={(e) => campo("notas")(e.target.value)}
              rows={3}
              placeholder="Se acordó revisión mecánica antes de exhibirlo…"
              className={cn(CLASE_INPUT, "py-2 resize-none")}
            />
          </Paso>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <ModalPie>
          <Boton variante="fantasma" type="button" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" cargando={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear consignación"}
          </Boton>
        </ModalPie>
      </form>
    </Modal>
  );
}
