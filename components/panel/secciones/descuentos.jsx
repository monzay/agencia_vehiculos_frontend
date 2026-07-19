"use client";

import { Fragment, useMemo, useState } from "react";
import {
  BadgePercent,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  CalendarClock,
  Pencil,
  Trash2,
  Car,
  ChevronRight,
  ChevronDown,
  Search,
  Gift,
} from "lucide-react";
import { SeccionPromociones } from "./promociones";
import { Overlay } from "../ui/overlay";
import { ConfirmarModal } from "../ui/confirmar-modal";
import {
  crearDescuento,
  actualizarDescuento,
  eliminarDescuento,
  aplicarDescuentoVehiculos,
  quitarDescuentoVehiculos,
} from "@/lib/api";

const FORM_VACIO = {
  nombre: "",
  tipo: "porcentaje", // "porcentaje" | "monto"
  valor: "",
  fecha_fin: "", // "" = sin vencimiento
};

function formatearPrecio(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

// Etiqueta legible del valor del descuento segun su tipo.
function etiquetaValor(d) {
  return d.tipo === "porcentaje" ? `${d.valor}%` : formatearPrecio(d.valor);
}

// ISO ("2026-12-31T...") -> "31/12/2026" para mostrar en la tabla.
function formatearFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
}

// Igual que formatearFecha pero con texto cuando no hay vencimiento.
function formatearFechaFin(iso) {
  return iso ? formatearFecha(iso) : "Sin vencimiento";
}

// ISO -> "YYYY-MM-DD" para el input type=date al editar.
function isoAInputDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function SeccionDescuentos({ descuentos, promociones, vehiculos, busqueda, onRecargar, esAdmin = false }) {
  const [tab, setTab] = useState("descuentos"); // "descuentos" | "promociones"
  const [abierto, setAbierto] = useState(false);
  const [editId, setEditId] = useState(null); // null = alta, id = edicion
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null); // descuento desplegado

  // Modal "aplicar a vehiculos"
  const [aplicarDesc, setAplicarDesc] = useState(null); // descuento elegido
  const [seleccion, setSeleccion] = useState(() => new Set()); // refs marcadas
  const [aplicando, setAplicando] = useState(false);
  const [busquedaVehiculo, setBusquedaVehiculo] = useState(""); // buscador del modal

  // Vehículos del modal filtrados por id (ref) o coincidencia (marca/modelo/año).
  const vehiculosFiltrados = useMemo(() => {
    const lista = vehiculos || [];
    const q = busquedaVehiculo.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((v) => {
      const ref = String(v.ref).toLowerCase();
      const texto = `${v.brand} ${v.model} ${v.year}`.toLowerCase();
      return ref.includes(q) || texto.includes(q);
    });
  }, [vehiculos, busquedaVehiculo]);

  const filtrados = useMemo(() => {
    const q = (busqueda || "").trim().toLowerCase();
    if (!q) return descuentos;
    return descuentos.filter((d) => d.nombre.toLowerCase().includes(q));
  }, [descuentos, busqueda]);

  // Agrupa los vehículos por el id de descuento que tienen aplicado.
  const vehiculosPorDescuento = useMemo(() => {
    const m = new Map();
    for (const v of vehiculos || []) {
      const id = v.descuento?.id;
      if (id == null) continue;
      if (!m.has(id)) m.set(id, []);
      m.get(id).push(v);
    }
    return m;
  }, [vehiculos]);

  function toggleExpandir(id) {
    setExpandidoId((prev) => (prev === id ? null : id));
  }

  const vigentes = descuentos.filter((d) => d.vigente).length;
  const editando = editId != null;

  function abrirAlta() {
    setEditId(null);
    setForm(FORM_VACIO);
    setError(null);
    setAbierto(true);
  }

  function abrirEdicion(d) {
    setEditId(d.id);
    setForm({
      nombre: d.nombre || "",
      tipo: d.tipo || "porcentaje",
      valor: String(d.valor ?? ""),
      fecha_fin: isoAInputDate(d.fecha_fin),
    });
    setError(null);
    setAbierto(true);
  }

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    const valor = Number(form.valor);
    if (!(valor > 0)) {
      setError("El valor debe ser un número mayor a 0.");
      return;
    }
    if (form.tipo === "porcentaje" && valor > 100) {
      setError("El porcentaje no puede superar 100.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        valor,
        fecha_fin: form.fecha_fin || null, // null = sin vencimiento
      };
      if (editando) {
        await actualizarDescuento(editId, datos);
      } else {
        await crearDescuento(datos);
      }
      setAbierto(false);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar el descuento.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(d) {
    setBorrandoId(d.id);
    setError(null);
    try {
      await eliminarDescuento(d.id);
      setABorrar(null);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el descuento.");
    } finally {
      setBorrandoId(null);
    }
  }

  // ── Aplicar a vehículos ──
  function abrirAplicar(d) {
    setAplicarDesc(d);
    // Premarcar los vehículos que ya tienen este descuento.
    const yaAplicados = (vehiculos || [])
      .filter((v) => v.descuento?.id === d.id)
      .map((v) => String(v.ref));
    setSeleccion(new Set(yaAplicados));
    setBusquedaVehiculo("");
    setError(null);
  }

  function cerrarAplicar() {
    setAplicarDesc(null);
    setBusquedaVehiculo("");
    setError(null);
  }

  function alternarVehiculo(ref) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      const k = String(ref);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  async function guardarAplicacion() {
    if (!aplicarDesc) return;
    setAplicando(true);
    setError(null);
    try {
      const elegidos = new Set(seleccion);
      // Vehículos que YA tenían este descuento pero ahora se desmarcaron → quitar.
      const aQuitar = (vehiculos || [])
        .filter((v) => v.descuento?.id === aplicarDesc.id && !elegidos.has(String(v.ref)))
        .map((v) => String(v.ref));

      const aAplicar = [...elegidos];

      if (aAplicar.length > 0) await aplicarDescuentoVehiculos(aplicarDesc.id, aAplicar);
      if (aQuitar.length > 0) await quitarDescuentoVehiculos(aQuitar);

      cerrarAplicar();
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudieron aplicar los cambios.");
    } finally {
      setAplicando(false);
    }
  }

  // Estado, acciones y lista de vehículos: compartidos por tabla (desktop) y tarjetas (móvil).
  const estadoDescuento = (d) =>
    d.vigente ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
        <CheckCircle2 className="w-3 h-3" /> Vigente
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-amber-600 border-amber-500/40 bg-amber-500/10">
        <CalendarClock className="w-3 h-3" /> Vencido
      </span>
    );

  const accionesDescuento = (d) => (
    <div className="flex items-center gap-1.5">
      <button onClick={() => abrirAplicar(d)} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors">
        Aplicar a vehículos
      </button>
      <button onClick={() => abrirEdicion(d)} title="Editar" className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setABorrar(d)} disabled={borrandoId === d.id} title="Eliminar" className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors disabled:opacity-50">
        {borrandoId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  const listaVehiculosDescuento = (d, lista) => (
    <>
      <p className="text-xs font-medium text-muted-foreground mb-3">Vehículos con “{d.nombre}” ({lista.length})</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((v) => (
          <div key={v.ref} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <Car className="w-4 h-4 text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {v.brand} {v.model} <span className="text-muted-foreground font-normal">· {v.year}</span>
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground line-through">{formatearPrecio(v.precio)}</span>{" "}
                <span className="text-emerald-600 font-semibold">{formatearPrecio(v.precio_final)}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Pestañas: Descuentos | Promociones */}
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border">
        <button
          onClick={() => setTab("descuentos")}
          className={`inline-flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === "descuentos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BadgePercent className="w-4 h-4" /> Descuentos
        </button>
        <button
          onClick={() => setTab("promociones")}
          className={`inline-flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === "promociones" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gift className="w-4 h-4" /> Promociones
        </button>
      </div>

      {tab === "promociones" ? (
        <SeccionPromociones
          promociones={promociones}
          vehiculos={vehiculos}
          busqueda={busqueda}
          onRecargar={onRecargar}
          esAdmin={esAdmin}
        />
      ) : (
        <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {vigentes} {vigentes === 1 ? "descuento vigente" : "descuentos vigentes"} de {descuentos.length} en total
        </p>
        {esAdmin && (
          <button
            onClick={abrirAlta}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Nuevo descuento
          </button>
        )}
      </div>

      {error && !abierto && !aplicarDesc && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Desktop: tabla */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Descuento</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Tipo</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Valor</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Finaliza</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Creado</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Vehículos</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Estado</th>
                {esAdmin && <th className="px-5 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((d) => {
                const lista = vehiculosPorDescuento.get(d.id) || [];
                const aplicados = lista.length;
                const expandido = expandidoId === d.id;
                return (
                  <Fragment key={d.id}>
                    <tr className="border-t border-border hover:bg-secondary/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => aplicados > 0 && toggleExpandir(d.id)}
                          title={aplicados > 0 ? "Ver vehículos con este descuento" : "Sin vehículos aplicados"}
                          className={`font-medium text-foreground inline-flex items-center gap-2 ${
                            aplicados > 0 ? "hover:text-accent transition-colors cursor-pointer" : "cursor-default"
                          }`}
                        >
                          {aplicados > 0 ? (
                            expandido ? (
                              <ChevronDown className="w-4 h-4 text-accent shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )
                          ) : (
                            <BadgePercent className="w-4 h-4 text-accent shrink-0" />
                          )}
                          {d.nombre}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground capitalize">{d.tipo}</td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">{etiquetaValor(d)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5" /> {formatearFechaFin(d.fecha_fin)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{formatearFecha(d.creado)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {aplicados > 0 ? (
                          <button
                            onClick={() => toggleExpandir(d.id)}
                            className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
                          >
                            <Car className="w-3.5 h-3.5" /> {aplicados}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5">{estadoDescuento(d)}</td>
                      {esAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">{accionesDescuento(d)}</div>
                        </td>
                      )}
                    </tr>

                    {/* Fila desplegable: vehículos con este descuento */}
                    {expandido && (
                      <tr className="border-t border-border bg-secondary/30">
                        <td colSpan={esAdmin ? 8 : 7} className="px-5 py-4">{listaVehiculosDescuento(d, lista)}</td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && (
          <p className="text-center py-12 text-muted-foreground">
            No hay descuentos todavía. Creá el primero con “Nuevo descuento”.
          </p>
        )}
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {filtrados.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground rounded-xl border border-border bg-card">
            No hay descuentos todavía. Creá el primero con “Nuevo descuento”.
          </p>
        ) : (
          filtrados.map((d) => {
            const lista = vehiculosPorDescuento.get(d.id) || [];
            const aplicados = lista.length;
            const expandido = expandidoId === d.id;
            return (
              <div key={d.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground inline-flex items-center gap-2 min-w-0">
                      <BadgePercent className="w-4 h-4 text-accent shrink-0" />
                      <span className="truncate">{d.nombre}</span>
                    </p>
                    {estadoDescuento(d)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="capitalize">{d.tipo}</span>
                    <span className="font-semibold text-foreground">{etiquetaValor(d)}</span>
                    <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {formatearFechaFin(d.fecha_fin)}</span>
                  </div>
                  {aplicados > 0 && (
                    <button onClick={() => toggleExpandir(d.id)} className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-accent transition-colors">
                      {expandido ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <Car className="w-3.5 h-3.5" /> {aplicados} vehículo(s)
                    </button>
                  )}
                </div>
                {esAdmin && (
                  <div className="border-t border-border px-3 py-2 flex flex-wrap justify-end gap-1.5">{accionesDescuento(d)}</div>
                )}
                {expandido && aplicados > 0 && (
                  <div className="border-t border-border bg-secondary/30 px-3 py-3">{listaVehiculosDescuento(d, lista)}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de alta / edición */}
      {abierto && (
        <Overlay>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                {editando ? <Pencil className="w-5 h-5 text-accent" /> : <BadgePercent className="w-5 h-5 text-accent" />}
                {editando ? "Editar descuento" : "Nuevo descuento"}
              </h2>
              <button onClick={() => setAbierto(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={enviar} className="px-6 py-5 space-y-4">
              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre *</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => cambiar("nombre", e.target.value)}
                  placeholder="Ej: Black Friday"
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo *</span>
                  <select
                    value={form.tipo}
                    onChange={(e) => cambiar("tipo", e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="monto">Monto fijo ($)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Valor * {form.tipo === "porcentaje" ? "(%)" : "($)"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step={form.tipo === "porcentaje" ? "1" : "1000"}
                    value={form.valor}
                    onChange={(e) => cambiar("valor", e.target.value)}
                    placeholder={form.tipo === "porcentaje" ? "10" : "500000"}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Fecha de finalización <span className="opacity-70">(opcional)</span>
                </span>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => cambiar("fecha_fin", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                />
                <span className="block text-[11px] text-muted-foreground mt-1">
                  Si la dejás vacía, el descuento no vence. Al pasar esta fecha deja de aplicarse solo.
                </span>
              </label>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">{error}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear descuento"}
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      )}

      {/* Modal aplicar a vehículos */}
      {aplicarDesc && (
        <Overlay>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                <Car className="w-5 h-5 text-accent" />
                Aplicar “{aplicarDesc.nombre}” ({etiquetaValor(aplicarDesc)})
              </h2>
              <button onClick={cerrarAplicar} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador + acciones rápidas */}
            <div className="px-6 py-3 border-b border-border space-y-2.5">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={busquedaVehiculo}
                  onChange={(e) => setBusquedaVehiculo(e.target.value)}
                  placeholder="Buscar por ID o marca / modelo / año…"
                  className="w-full h-9 pl-9 pr-9 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                />
                {busquedaVehiculo && (
                  <button
                    onClick={() => setBusquedaVehiculo("")}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">
                  {vehiculosFiltrados.length} resultado(s){busquedaVehiculo && ` para “${busquedaVehiculo}”`}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-3 py-2">
              {(vehiculos || []).length === 0 && (
                <p className="text-center py-10 text-muted-foreground">No hay vehículos cargados.</p>
              )}
              {(vehiculos || []).length > 0 && vehiculosFiltrados.length === 0 && (
                <p className="text-center py-10 text-muted-foreground">
                  No hay vehículos que coincidan con “{busquedaVehiculo}”.
                </p>
              )}
              {vehiculosFiltrados.map((v) => {
                const ref = String(v.ref);
                const marcado = seleccion.has(ref);
                const otro = v.descuento && v.descuento.id !== aplicarDesc.id ? v.descuento : null;
                return (
                  <label
                    key={ref}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => alternarVehiculo(ref)}
                      className="w-4 h-4 accent-[var(--accent)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        <span className="text-muted-foreground font-mono text-xs mr-1.5">#{ref}</span>
                        {v.brand} {v.model} <span className="text-muted-foreground">· {v.year}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatearPrecio(v.precio)}
                        {otro && <span className="ml-2 text-amber-600">· ya tiene “{otro.nombre}”</span>}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {error && (
              <div className="mx-6 mb-3 bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border">
              <span className="text-xs text-muted-foreground">{seleccion.size} seleccionado(s)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cerrarAplicar}
                  className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarAplicacion}
                  disabled={aplicando}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {aplicando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {aplicando ? "Aplicando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      <ConfirmarModal
        abierto={!!aBorrar}
        mensaje={`¿Seguro querés eliminar el descuento "${aBorrar?.nombre}"? Se quitará de todos los vehículos que lo tengan.`}
        cargando={borrandoId === aBorrar?.id}
        onConfirmar={() => borrar(aBorrar)}
        onCancelar={() => setABorrar(null)}
      />
        </div>
      )}
    </div>
  );
}
