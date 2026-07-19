"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Gift,
  Plus,
  X,
  Loader2,
  Pencil,
  Trash2,
  Car,
  ChevronRight,
  ChevronDown,
  Search,
  Tag,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import {
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
  aplicarPromocionVehiculos,
  quitarPromocionVehiculos,
} from "@/lib/api";
import { Overlay } from "../ui/overlay";
import { ConfirmarModal } from "../ui/confirmar-modal";

// Tipos de descuento (debe coincidir con el backend).
const DESCUENTO_TIPOS = {
  porcentaje: { label: "Porcentaje (%)", unidad: "%" },
  monto: { label: "Monto fijo ($)", unidad: "$" },
};

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  conDescuento: false,
  descuento: "",
  descuento_tipo: "porcentaje",
  fecha_fin: "",
};

function formatearPrecio(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatearFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
}
function isoAInputDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

// "10%" o "$500.000", o "—" si la promo no tiene descuento.
function detalleDescuento(p) {
  if (p.descuento == null) return "—";
  if (p.descuento_tipo === "monto") return formatearPrecio(p.descuento);
  return `${p.descuento}%`;
}

export function SeccionPromociones({ promociones, vehiculos, busqueda, onRecargar, esAdmin = false }) {
  const [abierto, setAbierto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);

  // Modal aplicar a vehículos
  const [aplicarPromo, setAplicarPromo] = useState(null);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [aplicando, setAplicando] = useState(false);
  const [busquedaVehiculo, setBusquedaVehiculo] = useState("");

  const editando = editId != null;

  const filtrados = useMemo(() => {
    const q = (busqueda || "").trim().toLowerCase();
    if (!q) return promociones;
    return promociones.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion || "").toLowerCase().includes(q)
    );
  }, [promociones, busqueda]);

  // Agrupa vehículos por cada promo que tengan aplicada (N:N).
  const vehiculosPorPromo = useMemo(() => {
    const m = new Map();
    for (const v of vehiculos || []) {
      for (const p of v.promociones || []) {
        if (!m.has(p.id)) m.set(p.id, []);
        m.get(p.id).push(v);
      }
    }
    return m;
  }, [vehiculos]);

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

  function toggleExpandir(id) {
    setExpandidoId((prev) => (prev === id ? null : id));
  }
  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function abrirAlta() {
    setEditId(null);
    setForm(FORM_VACIO);
    setError(null);
    setAbierto(true);
  }
  function abrirEdicion(p) {
    setEditId(p.id);
    setForm({
      nombre: p.nombre || "",
      descripcion: p.descripcion || "",
      conDescuento: p.descuento != null,
      descuento: p.descuento != null ? String(p.descuento) : "",
      descuento_tipo: p.descuento_tipo || "porcentaje",
      fecha_fin: isoAInputDate(p.fecha_fin),
    });
    setError(null);
    setAbierto(true);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!form.descripcion.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (form.conDescuento) {
      const valor = Number(form.descuento);
      if (!(valor > 0)) {
        setError("El descuento debe ser un número mayor a 0.");
        return;
      }
      if (form.descuento_tipo === "porcentaje" && valor > 100) {
        setError("Un porcentaje no puede superar 100.");
        return;
      }
    }
    setGuardando(true);
    setError(null);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        descuento: form.conDescuento ? Number(form.descuento) : null,
        descuento_tipo: form.conDescuento ? form.descuento_tipo : null,
        fecha_fin: form.fecha_fin || null,
      };
      if (editando) await actualizarPromocion(editId, datos);
      else await crearPromocion(datos);
      setAbierto(false);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar la promoción.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(p) {
    setBorrandoId(p.id);
    setError(null);
    try {
      await eliminarPromocion(p.id);
      setABorrar(null);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la promoción.");
    } finally {
      setBorrandoId(null);
    }
  }

  // ── Aplicar a vehículos ──
  function abrirAplicar(p) {
    setAplicarPromo(p);
    const yaAplicados = (vehiculos || [])
      .filter((v) => (v.promociones || []).some((x) => x.id === p.id))
      .map((v) => String(v.ref));
    setSeleccion(new Set(yaAplicados));
    setBusquedaVehiculo("");
    setError(null);
  }
  function cerrarAplicar() {
    setAplicarPromo(null);
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
    if (!aplicarPromo) return;
    setAplicando(true);
    setError(null);
    try {
      const elegidos = new Set(seleccion);
      const aQuitar = (vehiculos || [])
        .filter(
          (v) => (v.promociones || []).some((x) => x.id === aplicarPromo.id) && !elegidos.has(String(v.ref))
        )
        .map((v) => String(v.ref));
      const aAplicar = [...elegidos];

      if (aAplicar.length > 0) await aplicarPromocionVehiculos(aplicarPromo.id, aAplicar);
      if (aQuitar.length > 0) await quitarPromocionVehiculos(aplicarPromo.id, aQuitar);

      cerrarAplicar();
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudieron aplicar los cambios.");
    } finally {
      setAplicando(false);
    }
  }

  // Estado (Vigente/Vencido), igual que en Descuentos. Una promo sin fecha_fin
  // nunca vence → Vigente.
  const estadoPromo = (p) =>
    p.vencida ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-amber-600 border-amber-500/40 bg-amber-500/10">
        <CalendarClock className="w-3 h-3" /> Vencido
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
        <CheckCircle2 className="w-3 h-3" /> Vigente
      </span>
    );

  // Vigencia, acciones y lista de vehículos: compartidos por tabla (desktop) y tarjetas (móvil).
  const vigenciaPromo = (p) =>
    p.fecha_fin ? (
      p.vencida ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-amber-600 border-amber-500/40 bg-amber-500/10">
          <CalendarClock className="w-3 h-3" /> Vencida {formatearFecha(p.fecha_fin)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="w-3.5 h-3.5" /> Hasta {formatearFecha(p.fecha_fin)}
        </span>
      )
    ) : (
      <span className="text-muted-foreground">Sin límite</span>
    );

  const accionesPromo = (p) => (
    <div className="flex items-center gap-1.5">
      <button onClick={() => abrirAplicar(p)} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors">
        Aplicar a vehículos
      </button>
      <button onClick={() => abrirEdicion(p)} title="Editar" className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setABorrar(p)} disabled={borrandoId === p.id} title="Eliminar" className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors disabled:opacity-50">
        {borrandoId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  const listaVehiculosPromo = (p, lista) => (
    <>
      <p className="text-xs font-medium text-muted-foreground mb-3">Vehículos con “{p.nombre}” ({lista.length})</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((v) => (
          <div key={v.ref} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <Car className="w-4 h-4 text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                <span className="text-muted-foreground font-mono text-xs mr-1.5">#{v.ref}</span>
                {v.brand} {v.model} <span className="text-muted-foreground font-normal">· {v.year}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatearPrecio(v.precio)}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {promociones.length} {promociones.length === 1 ? "promoción" : "promociones"} en total
        </p>
        {esAdmin && (
          <button
            onClick={abrirAlta}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Nueva promoción
          </button>
        )}
      </div>

      {error && !abierto && !aplicarPromo && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Desktop: tabla */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Promoción</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Descripción</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Descuento</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Estado</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Vigencia</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Vehículos</th>
                {esAdmin && <th className="px-5 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const lista = vehiculosPorPromo.get(p.id) || [];
                const aplicados = lista.length;
                const expandido = expandidoId === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr className="border-t border-border hover:bg-secondary/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => aplicados > 0 && toggleExpandir(p.id)}
                          title={aplicados > 0 ? "Ver vehículos con esta promoción" : "Sin vehículos aplicados"}
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
                            <Gift className="w-4 h-4 text-accent shrink-0" />
                          )}
                          {p.nombre}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground max-w-xs">
                        <span className="line-clamp-2">{p.descripcion || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.descuento != null ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Tag className="w-3.5 h-3.5 text-accent" /> {detalleDescuento(p)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">{estadoPromo(p)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">{vigenciaPromo(p)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {aplicados > 0 ? (
                          <button
                            onClick={() => toggleExpandir(p.id)}
                            className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
                          >
                            <Car className="w-3.5 h-3.5" /> {aplicados}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      {esAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">{accionesPromo(p)}</div>
                        </td>
                      )}
                    </tr>

                    {expandido && (
                      <tr className="border-t border-border bg-secondary/30">
                        <td colSpan={esAdmin ? 7 : 6} className="px-5 py-4">{listaVehiculosPromo(p, lista)}</td>
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
            No hay promociones todavía. Creá la primera con “Nueva promoción”.
          </p>
        )}
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {filtrados.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground rounded-xl border border-border bg-card">
            No hay promociones todavía. Creá la primera con “Nueva promoción”.
          </p>
        ) : (
          filtrados.map((p) => {
            const lista = vehiculosPorPromo.get(p.id) || [];
            const aplicados = lista.length;
            const expandido = expandidoId === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground inline-flex items-center gap-2 min-w-0">
                      <Gift className="w-4 h-4 text-accent shrink-0" />
                      <span className="truncate">{p.nombre}</span>
                    </p>
                    {p.descuento != null && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground text-sm shrink-0">
                        <Tag className="w-3.5 h-3.5 text-accent" /> {detalleDescuento(p)}
                      </span>
                    )}
                  </div>
                  {p.descripcion && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.descripcion}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">{estadoPromo(p)}{vigenciaPromo(p)}</div>
                  {aplicados > 0 && (
                    <button onClick={() => toggleExpandir(p.id)} className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-accent transition-colors">
                      {expandido ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <Car className="w-3.5 h-3.5" /> {aplicados} vehículo(s)
                    </button>
                  )}
                </div>
                {esAdmin && (
                  <div className="border-t border-border px-3 py-2 flex flex-wrap justify-end gap-1.5">{accionesPromo(p)}</div>
                )}
                {expandido && aplicados > 0 && (
                  <div className="border-t border-border bg-secondary/30 px-3 py-3">{listaVehiculosPromo(p, lista)}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal alta / edición */}
      {abierto && (
        <Overlay>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                {editando ? <Pencil className="w-5 h-5 text-accent" /> : <Gift className="w-5 h-5 text-accent" />}
                {editando ? "Editar promoción" : "Nueva promoción"}
              </h2>
              <button onClick={() => setAbierto(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={enviar} className="px-6 py-5 space-y-4 overflow-auto">
              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre *</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => cambiar("nombre", e.target.value)}
                  placeholder="Ej: Promo de junio"
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Descripción *</span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => cambiar("descripcion", e.target.value)}
                  rows={2}
                  placeholder="Detalle visible para el cliente. Ej: Llevate tu 0km con beneficios exclusivos este mes."
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all resize-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha de finalización (opcional)</span>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => cambiar("fecha_fin", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                />
                <span className="block text-[11px] text-muted-foreground mt-1">
                  Si la dejás vacía, la promoción no vence. Al pasar esta fecha deja de mostrarse en los vehículos.
                </span>
              </label>

              {/* Descuento opcional */}
              <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.conDescuento}
                    onChange={(e) => cambiar("conDescuento", e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <span className="text-sm text-foreground inline-flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-accent" /> Esta promoción tiene un descuento
                  </span>
                </label>

                {form.conDescuento && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo de descuento</span>
                      <select
                        value={form.descuento_tipo}
                        onChange={(e) => cambiar("descuento_tipo", e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                      >
                        {Object.entries(DESCUENTO_TIPOS).map(([id, meta]) => (
                          <option key={id} value={id}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Valor ({DESCUENTO_TIPOS[form.descuento_tipo]?.unidad})
                      </span>
                      <input
                        type="number"
                        min="0"
                        step={form.descuento_tipo === "porcentaje" ? "0.1" : "1"}
                        value={form.descuento}
                        onChange={(e) => cambiar("descuento", e.target.value)}
                        placeholder="0"
                        className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                      />
                    </label>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">{error}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
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
                  {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear promoción"}
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      )}

      {/* Modal aplicar a vehículos */}
      {aplicarPromo && (
        <Overlay>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                <Car className="w-5 h-5 text-accent" />
                Aplicar “{aplicarPromo.nombre}”
              </h2>
              <button onClick={cerrarAplicar} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

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
                const otras = (v.promociones || []).filter((x) => x.id !== aplicarPromo.id);
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
                        {otras.length > 0 && (
                          <span className="ml-2 text-sky-600">· {otras.length} promo(s) más</span>
                        )}
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
        mensaje={`¿Seguro querés eliminar la promoción "${aBorrar?.nombre}"? Se quitará de todos los vehículos que la tengan.`}
        cargando={borrandoId === aBorrar?.id}
        onConfirmar={() => borrar(aBorrar)}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  );
}
