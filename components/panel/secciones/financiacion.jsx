"use client";

import { Fragment, useState } from "react";
import {
  CalendarClock, CalendarDays,
  Loader2, Pencil, Trash2, ListChecks, CheckCircle2, Circle,
  ChevronRight, ChevronDown,
} from "lucide-react";
import {
  actualizarFinanciacion, eliminarFinanciacion, marcarCuotaPagada,
  obtenerFinanciacionesPagina,
} from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { Boton } from "../ui/boton";
import { Tabla, FILA, CELDA } from "../ui/tabla";
import { Modal, ModalPie } from "../ui/modal";
import { Campo, CampoNumero, CLASE_INPUT } from "../ui/campo";
import { Insignia } from "../ui/insignia";
import { ConfirmarModal } from "../ui/confirmar-modal";
import { EtiquetaAviso, IconosRespuestas, RespuestasCliente } from "./financiacion-alertas";

const FORM_VACIO = {
  nombre: "",
  telefono: "",
  telefonoAlt: "",
  dni: "",
  email: "",
  cantidadCuotas: "",
  precioCuota: "",
  diaPago: "1",
  avisosWhatsapp: true,
};

const COLUMNAS = [
  { label: "", className: "w-10" },
  { label: "Cliente" },
  { label: "Plan de cuotas" },
  { label: "Progreso" },
  { label: "Acciones", alinear: "right" },
];

const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);
const PAGINA = 10; // cuántas financiaciones se muestran por bloque

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

// Fecha corta (dd mmm yyyy) para el cronograma de cuotas.
function fechaCorta(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
}

// Panel expandido: bloque agrupado (título + pares dato/valor).
function Grupo({ titulo, children }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{titulo}</p>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function Item({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-foreground font-medium text-right tabular-nums break-all">{children}</dd>
    </div>
  );
}

// Las financiaciones se crean dentro del legajo de una parte de pago (último
// paso del trámite). Acá se siguen: cuotas, datos y edición del plan.
export function SeccionFinanciacion({ busqueda, refrescar }) {
  const [abierto, setAbierto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null); // fila con panel de datos abierto

  // Modal de cronograma (ver/marcar cuotas).
  const [detalle, setDetalle] = useState(null); // financiación abierta
  const [cuotaCargando, setCuotaCargando] = useState(null); // número de cuota togglendo

  // Datos paginados del server (búsqueda incluida). `recargar` refresca tras CRUD.
  const { items, total, hayMas, cargandoInicial, cargandoMas, error: errorLista, cargarMas, recargar } = usarListaPaginada(
    ({ offset, limite }) => obtenerFinanciacionesPagina({ q: busqueda, offset, limite }),
    [busqueda, refrescar],
    { limite: PAGINA }
  );

  function abrirEdicion(f) {
    setEditId(f.id);
    setForm({
      nombre: f.nombre || "",
      telefono: f.telefono || "",
      telefonoAlt: f.telefonoAlt || "",
      dni: f.dni || "",
      email: f.email || "",
      cantidadCuotas: String(f.cantidadCuotas ?? ""),
      precioCuota: String(f.precioCuota ?? ""),
      diaPago: String(f.diaPago ?? "1"),
      avisosWhatsapp: !f.avisosBaja,
    });
    setError(null);
    setAbierto(true);
  }

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim() || !form.dni.trim()) {
      setError("Nombre, teléfono y DNI son obligatorios.");
      return;
    }
    if (!/^\d{6,}$/.test(form.telefono.replace(/\D/g, ""))) {
      setError("El teléfono no es válido (solo números, mínimo 6 dígitos).");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setError("Ingresá un email válido.");
      return;
    }
    if (!(Number(form.cantidadCuotas) > 0)) {
      setError("La cantidad de cuotas debe ser un número mayor a 0.");
      return;
    }
    if (!(Number(form.precioCuota) > 0)) {
      setError("El precio de la cuota debe ser mayor a 0.");
      return;
    }
    if (!(Number(form.diaPago) >= 1 && Number(form.diaPago) <= 31)) {
      setError("El día de pago debe estar entre 1 y 31.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await actualizarFinanciacion(editId, form);
      setAbierto(false);
      recargar();
    } catch (err) {
      setError(err.message || "No se pudo guardar la financiación.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(f) {
    setBorrandoId(f.id);
    setError(null);
    try {
      await eliminarFinanciacion(f.id);
      setABorrar(null);
      recargar();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la financiación.");
    } finally {
      setBorrandoId(null);
    }
  }

  // Marca/desmarca una cuota. Actualiza el detalle en pantalla y refresca la tabla.
  async function toggleCuota(cuota) {
    if (!detalle) return;
    setCuotaCargando(cuota.numero);
    try {
      const actualizada = await marcarCuotaPagada(detalle.id, cuota.numero, !cuota.pagado);
      setDetalle(actualizada);
      recargar();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la cuota.");
    } finally {
      setCuotaCargando(null);
    }
  }

  // Botones de acción y panel de datos: compartidos por tabla (desktop) y tarjetas (móvil).
  const accionesFinanciacion = (f) => (
    <div className="flex items-center gap-1.5">
      <Boton variante="secundario" tamano="icono" onClick={() => setDetalle(f)} title="Ver cuotas">
        <ListChecks className="w-3.5 h-3.5" />
      </Boton>
      <Boton variante="secundario" tamano="icono" onClick={() => abrirEdicion(f)} title="Editar">
        <Pencil className="w-3.5 h-3.5" />
      </Boton>
      <Boton variante="peligro" tamano="icono" onClick={() => setABorrar(f)} disabled={borrandoId === f.id} title="Eliminar">
        {borrandoId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </Boton>
    </div>
  );

  const panelDatos = (f) => (
    <div className="space-y-3">
      <RespuestasCliente respuestas={f.respuestas} onAtendida={recargar} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Grupo titulo="Identidad">
          <Item label="Teléfono">{f.telefono || "—"}</Item>
          <Item label="Tel. alt.">{f.telefonoAlt || "—"}</Item>
          <Item label="Email">{f.email || "—"}</Item>
          <Item label="DNI">{f.dni || "—"}</Item>
        </Grupo>
        <Grupo titulo="Plan">
          <Item label="Cuotas">{f.cantidadCuotas}</Item>
          <Item label="Precio cuota">{money.format(f.precioCuota)}</Item>
          <Item label="Día de pago">{f.diaPago}</Item>
          <Item label="Total">{money.format(f.montoTotal)}</Item>
          <Item label="Avisos WhatsApp">{f.avisosBaja ? `Baja desde ${fechaCorta(f.avisosBaja)}` : "Activos"}</Item>
        </Grupo>
        <Grupo titulo="Montos">
          <Item label="Pagadas">{f.cuotasPagadas}/{f.cantidadCuotas}</Item>
          <Item label="Pagado">{money.format(f.montoPagado)}</Item>
          <Item label="Saldo">{money.format(f.saldo)}</Item>
        </Grupo>
        <Grupo titulo="Fechas">
          <Item label="Próxima cuota">
            {f.proximaCuota
              ? `Cuota ${f.proximaCuota.numero} · ${fechaCorta(f.proximaCuota.vencimiento)}`
              : f.completada ? "Completada" : "—"}
          </Item>
          <Item label="Finaliza">{fechaCorta(f.fechaFin)}</Item>
          <Item label="Creada">{fechaCorta(f.creado)}</Item>
          <Item label="Actualizada">{fechaCorta(f.actualizado)}</Item>
        </Grupo>
      </div>
    </div>
  );

  // Etiqueta del aviso en curso y un ícono por cada respuesta del cliente.
  const marcasDeAviso = (f) =>
    (f.proximoAviso || f.respuestas?.length > 0) && (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <EtiquetaAviso aviso={f.proximoAviso} />
        <IconosRespuestas respuestas={f.respuestas} />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "financiación" : "financiaciones"} en total
        </p>
      </div>

      {error && !abierto && !detalle && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {errorLista && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
          {errorLista}
        </div>
      )}

      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <Tabla columnas={COLUMNAS} vacio={!cargandoInicial && items.length === 0} mensajeVacio="No hay financiaciones que coincidan.">
          {items.map((f) => {
            const abierto = expandidoId === f.id;
            return (
              <Fragment key={f.id}>
                <tr onClick={() => setExpandidoId(abierto ? null : f.id)} className={`${FILA} cursor-pointer ${f.proximoAviso ? "bg-amber-500/5" : ""}`}>
                  <td className={`${CELDA} text-muted-foreground`}>
                    {abierto ? <ChevronDown className="w-4 h-4 text-accent" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className={CELDA}>
                    <p className="font-medium text-foreground">{f.nombre || "—"}</p>
                    {f.telefono && <p className="text-xs text-muted-foreground mt-0.5">{f.telefono}</p>}
                    {marcasDeAviso(f)}
                  </td>
                  <td className={`${CELDA} text-foreground`}>
                    <p>
                      <span className="font-medium tabular-nums">{f.cantidadCuotas}</span>
                      <span className="text-muted-foreground"> × </span>
                      <span className="tabular-nums">{money.format(f.precioCuota)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" /> Todos los días {f.diaPago} · Total {money.format(f.montoTotal)}
                    </p>
                  </td>
                  <td className={CELDA}>
                    <div className="space-y-1">
                      <Insignia variante={f.completada ? "exito" : "neutral"}>
                        {f.completada ? <CheckCircle2 className="w-3 h-3" /> : <ListChecks className="w-3 h-3" />}
                        {f.cuotasPagadas}/{f.cantidadCuotas} pagas
                      </Insignia>
                      <p className="text-xs text-muted-foreground tabular-nums">Saldo {money.format(f.saldo)}</p>
                    </div>
                  </td>
                  <td className={CELDA} onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">{accionesFinanciacion(f)}</div>
                  </td>
                </tr>

                {abierto && (
                  <tr className="border-t border-border bg-secondary/30">
                    <td colSpan={COLUMNAS.length} className="px-5 py-4">{panelDatos(f)}</td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </Tabla>
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {!cargandoInicial && items.length === 0 ? (
          <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">No hay financiaciones que coincidan.</p>
        ) : (
          items.map((f) => {
            const abierto = expandidoId === f.id;
            return (
              <div key={f.id} className={`rounded-xl border bg-card overflow-hidden ${f.proximoAviso ? "border-amber-500/40" : "border-border"}`}>
                <button type="button" onClick={() => setExpandidoId(abierto ? null : f.id)} className="w-full text-left p-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{f.nombre || "—"}</p>
                      {f.telefono && <p className="text-xs text-muted-foreground mt-0.5">{f.telefono}</p>}
                      {marcasDeAviso(f)}
                    </div>
                    {abierto ? <ChevronDown className="w-4 h-4 text-accent shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-sm text-foreground mt-2">
                    <span className="font-medium tabular-nums">{f.cantidadCuotas}</span>
                    <span className="text-muted-foreground"> × </span>
                    <span className="tabular-nums">{money.format(f.precioCuota)}</span>
                    <span className="text-xs text-muted-foreground"> · Total {money.format(f.montoTotal)}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Insignia variante={f.completada ? "exito" : "neutral"}>
                      {f.completada ? <CheckCircle2 className="w-3 h-3" /> : <ListChecks className="w-3 h-3" />}
                      {f.cuotasPagadas}/{f.cantidadCuotas} pagas
                    </Insignia>
                    <span className="text-xs text-muted-foreground tabular-nums">Saldo {money.format(f.saldo)}</span>
                  </div>
                </button>
                <div className="px-3 pb-3 flex justify-end">{accionesFinanciacion(f)}</div>
                {abierto && (
                  <div className="border-t border-border bg-secondary/30 px-3 py-3">{panelDatos(f)}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {hayMas && (
        <div className="flex justify-center pt-1">
          <Boton variante="secundario" onClick={cargarMas} cargando={cargandoMas}>
            {cargandoMas ? "Cargando…" : `Cargar más (${total - items.length} restantes)`}
          </Boton>
        </div>
      )}

      {/* Modal de alta / edición */}
      {abierto && (
        <Modal
          titulo="Editar financiación"
          icono={Pencil}
          onCerrar={() => setAbierto(false)}
          ancho="max-w-lg"
        >
          <form onSubmit={enviar} className="px-6 py-5 space-y-4 overflow-auto">
            <Campo label="Nombre *" valor={form.nombre} onCambio={(v) => cambiar("nombre", v)} placeholder="Ej: Juan Pérez" autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Teléfono *" valor={form.telefono} onCambio={(v) => cambiar("telefono", v)} placeholder="3811234567" />
              <Campo label="DNI *" valor={form.dni} onCambio={(v) => cambiar("dni", v)} placeholder="30111222" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Teléfono alternativo" valor={form.telefonoAlt} onCambio={(v) => cambiar("telefonoAlt", v)} placeholder="Otro número (opcional)" />
              <Campo label="Email *" tipo="email" valor={form.email} onCambio={(v) => cambiar("email", v)} placeholder="cliente@correo.com" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Campo
                label="Cantidad de cuotas *"
                tipo="number"
                valor={form.cantidadCuotas}
                onCambio={(v) => cambiar("cantidadCuotas", v)}
                placeholder="12"
              />
              <CampoNumero
                label="Precio por cuota *"
                valor={form.precioCuota}
                onCambio={(v) => cambiar("precioCuota", v)}
                placeholder="85.000"
              />
              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Día de pago *</span>
                <select
                  value={form.diaPago}
                  onChange={(e) => cambiar("diaPago", e.target.value)}
                  className={`${CLASE_INPUT} h-9`}
                >
                  {DIAS.map((d) => (
                    <option key={d} value={d}>
                      Día {d} de cada mes
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.avisosWhatsapp}
                onChange={(e) => cambiar("avisosWhatsapp", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-current"
              />
              <span>
                Recibe recordatorios de cuota por WhatsApp
                <span className="block text-xs text-muted-foreground">3 días antes, 1 día antes y el día del vencimiento. Se apaga solo si el cliente responde BAJA.</span>
              </span>
            </label>

            {form.cantidadCuotas && form.precioCuota && (
              <p className="text-xs text-muted-foreground">
                Total del plan:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {money.format((Number(form.cantidadCuotas) || 0) * (Number(form.precioCuota) || 0))}
                </span>
              </p>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <ModalPie className="px-0 pb-0 border-t-0">
              <Boton variante="fantasma" onClick={() => setAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" variante="primario" cargando={guardando}>
                {guardando ? "Guardando…" : "Guardar cambios"}
              </Boton>
            </ModalPie>
          </form>
        </Modal>
      )}

      {/* Modal de cronograma de cuotas */}
      {detalle && (
        <Modal
          titulo={`Cuotas de ${detalle.nombre || "cliente"}`}
          icono={CalendarDays}
          onCerrar={() => setDetalle(null)}
          ancho="max-w-md"
        >
          <div className="px-6 py-5 space-y-4 overflow-auto">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">Pagas</p>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {detalle.cuotasPagadas}/{detalle.cantidadCuotas}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">Saldo</p>
                <p className="text-sm font-semibold text-foreground tabular-nums">{money.format(detalle.saldo)}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">Finaliza</p>
                <p className="text-sm font-semibold text-foreground">{fechaCorta(detalle.fechaFin)}</p>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Lista de cuotas: click para marcar/desmarcar pago */}
            <ul className="space-y-1.5">
              {detalle.cronograma?.map((cuota) => {
                const cargando = cuotaCargando === cuota.numero;
                return (
                  <li key={cuota.numero}>
                    <button
                      type="button"
                      onClick={() => toggleCuota(cuota)}
                      disabled={cargando}
                      className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                        cuota.pagado
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-border bg-secondary/40 hover:border-foreground/30"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {cargando ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : cuota.pagado ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={cuota.pagado ? "text-foreground" : "text-muted-foreground"}>
                          Cuota {cuota.numero}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{fechaCorta(cuota.vencimiento)}</span>
                        <span className="tabular-nums text-foreground">{money.format(detalle.precioCuota)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <ModalPie>
            <Boton variante="secundario" onClick={() => setDetalle(null)}>
              Cerrar
            </Boton>
          </ModalPie>
        </Modal>
      )}

      <ConfirmarModal
        abierto={!!aBorrar}
        mensaje={`¿Seguro querés eliminar la financiación de "${aBorrar?.nombre}"? Esta acción no se puede deshacer.`}
        cargando={borrandoId === aBorrar?.id}
        onConfirmar={() => borrar(aBorrar)}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  );
}
