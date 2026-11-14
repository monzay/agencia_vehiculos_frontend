"use client";

import { useMemo, useState } from "react";
import { Car, Plus, Pencil, X, Loader2, BadgePercent, Gift, Upload, Image as ImageIcon, RotateCcw, Handshake, BookmarkCheck, ListPlus } from "lucide-react";
import {
  crearVehiculo,
  actualizarVehiculo,
  cerrarConsignacionVehiculo,
  getToken,
} from "@/lib/api";
import { Overlay } from "../ui/overlay";
import { numerarVehiculos } from "@/lib/vehiculos";
import { fechaCorta } from "./senas/formato";
import { Campo, CampoNumero } from "../ui/campo";
import { ImportarLista } from "./vehiculos/importar-lista";
import { EliminarVehiculo } from "./vehiculos/eliminar-vehiculo";
import { TIPOS_VEHICULO, tipoVehiculo } from "@/lib/tipos-vehiculo";
import { COMBUSTIBLES, etiquetaCombustible } from "@/lib/combustibles";
import { IMAGENES_ADICIONALES_MAX, lugaresLibres, repartirElegidas, imagenesParaGuardar } from "@/lib/imagenes-vehiculo";

// Límite de tamaño de imagen (debe coincidir con el del endpoint /api/blob/upload).
const MAX_IMG_MB = 10;

// Estado inicial de los filtros (usado también por el botón "Resetear filtros").
const FILTROS_VACIOS = {
  orden: "marca_az", marca: "", condicion: "", beneficio: "",
  precioMin: "", precioMax: "", anioMin: "", anioMax: "",
};

const FORM_VACIO = {
  marca: "",
  modelo: "",
  version: "",
  disponible: true, // publicado en la web
  anio: "",
  precio: "",
  precioContado: "",
  anticipo: "",
  kms: "",
  stock: "1",
  condicion: "usado",
  tipoVehiculo: "auto",
  combustible: "",
  descripcion: "",
  imagenPrincipal: "",
  imagenes: [],
};

function precioARS(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const CLASE_FILTRO =
  "h-9 px-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent";

// "-10%" o "-$500.000" según el tipo de descuento.
function etiquetaDescuento(d) {
  if (!d) return "";
  return d.tipo === "porcentaje" ? `-${d.valor}%` : `-${precioARS(d.valor)}`;
}

// "Promo · -10%" / "Promo · -$500.000" o solo el nombre si la promo no lleva descuento.
function etiquetaPromo(p) {
  if (p.descuento == null) return p.nombre;
  const val = p.descuento_tipo === "monto" ? precioARS(p.descuento) : `${p.descuento}%`;
  return `${p.nombre} · -${val}`;
}

export function SeccionVehiculos({ vehiculos, busqueda, onRecargar, esAdmin = false }) {
  const [abierto, setAbierto] = useState(false);
  const [editRef, setEditRef] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [detalle, setDetalle] = useState(null); // vehículo abierto en el modal de detalle
  const [subiendoPrincipal, setSubiendoPrincipal] = useState(false);
  const [subiendoGaleria, setSubiendoGaleria] = useState(false);
  const [importando, setImportando] = useState(false); // modal "Importar lista"

  // Solo el stock que sigue a la venta. Vender (y deshacer una venta) se hace
  // en el legajo del trámite, en Documentos: acá no hay vendidos.
  const [cerrando, setCerrando] = useState(null); // ref con una acción en curso
  const origen = vehiculos || [];

  const editando = editRef != null;

  // Filtros de la sección Vehículos.
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const setF = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));
  // Hay algún filtro activo (distinto del estado inicial) para mostrar el reset.
  const hayFiltros = useMemo(
    () => Object.keys(FILTROS_VACIOS).some((k) => filtros[k] !== FILTROS_VACIOS[k]),
    [filtros]
  );

  const marcas = useMemo(
    () => [...new Set((origen || []).map((v) => v.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [origen]
  );

  const filtrados = useMemo(() => {
    const q = (busqueda || "").trim().toLowerCase();
    const precioDe = (v) => v.precio_final ?? v.precio ?? 0;
    const arr = origen.filter((v) => {
      if (q && !`${v.brand} ${v.model} ${v.version ?? ""} ${v.year}`.toLowerCase().includes(q)) return false;
      if (filtros.marca && v.brand !== filtros.marca) return false;
      if (filtros.condicion && v.condicion !== filtros.condicion) return false;
      if (filtros.beneficio === "descuento" && !v.descuento) return false;
      if (filtros.beneficio === "promo" && !(v.promociones || []).length) return false;
      if (filtros.precioMin && precioDe(v) < Number(filtros.precioMin)) return false;
      if (filtros.precioMax && precioDe(v) > Number(filtros.precioMax)) return false;
      if (filtros.anioMin && v.year < Number(filtros.anioMin)) return false;
      if (filtros.anioMax && v.year > Number(filtros.anioMax)) return false;
      return true;
    });
    const cmp = {
      marca_az: (a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`),
      marca_za: (a, b) => `${b.brand} ${b.model}`.localeCompare(`${a.brand} ${a.model}`),
      precio_asc: (a, b) => precioDe(a) - precioDe(b),
      precio_desc: (a, b) => precioDe(b) - precioDe(a),
      anio_asc: (a, b) => a.year - b.year,
      anio_desc: (a, b) => b.year - a.year,
    }[filtros.orden] || (() => 0);
    return [...arr].sort(cmp);
  }, [origen, busqueda, filtros]);

  function abrirAlta() {
    setEditRef(null);
    setForm(FORM_VACIO);
    setError(null);
    setAbierto(true);
  }

  function abrirEdicion(v) {
    setEditRef(v.ref);
    setForm({
      marca: v.brand || "",
      modelo: v.model || "",
      version: v.version || "",
      disponible: Boolean(v.disponible),
      anio: String(v.year || ""),
      precio: String(v.precio || ""),
      precioContado: String(v.precio_contado || ""),
      anticipo: String(v.anticipo || ""),
      kms: String(v.kms || ""),
      stock: String(v.stock ?? 1),
      condicion: v.condicion || "usado",
      tipoVehiculo: v.tipo || "auto",
      combustible: v.combustible || "",
      descripcion: v.descripcion || "",
      imagenPrincipal: v.imagenes?.[0] || (v.image && v.image !== "/placeholder.svg" ? v.image : ""),
      imagenes: v.imagenes?.slice(1) || [],
    });
    setError(null);
    setAbierto(true);
  }

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  // Postea el archivo al server, que lo optimiza (sharp) y lo guarda en Vercel Blob.
  // Devuelve la URL pública de la imagen ya optimizada.
  async function subirArchivo(file) {
    if (file.size > MAX_IMG_MB * 1024 * 1024) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      throw new Error(`La imagen "${file.name}" pesa ${mb} MB. El máximo permitido es ${MAX_IMG_MB} MB; subí una más liviana.`);
    }
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/blob/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen.");
    return data.url;
  }

  async function onImagenPrincipal(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoPrincipal(true);
    setError(null);
    try {
      cambiar("imagenPrincipal", await subirArchivo(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoPrincipal(false);
      e.target.value = "";
    }
  }

  async function onImagenesGaleria(e) {
    const elegidos = [...(e.target.files || [])];
    e.target.value = "";
    if (!elegidos.length) return;
    const { entran: files, sobran } = repartirElegidas(form.imagenes, elegidos);
    if (sobran.length) {
      setError(`Un vehículo puede tener hasta ${IMAGENES_ADICIONALES_MAX} imágenes además de la principal. No se agregaron ${sobran.length}.`);
    } else {
      setError(null);
    }
    if (!files.length) return;
    setSubiendoGaleria(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await subirArchivo(f));
      setForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, ...urls] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoGaleria(false);
    }
  }

  const sinLugarGaleria = lugaresLibres(form.imagenes) === 0;

  function quitarImagen(url) {
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((u) => u !== url) }));
  }

  async function enviar(e) {
    e.preventDefault();
    if (!form.marca.trim() || !form.modelo.trim() || !form.anio || !form.precio) {
      setError("Marca, modelo, año y precio son obligatorios.");
      return;
    }
    if (!(Number(form.anio) >= 1900 && Number(form.anio) <= 2100)) {
      setError("El año no es válido.");
      return;
    }
    if (!(Number(form.precio) > 0)) {
      setError("El precio debe ser mayor a 0.");
      return;
    }
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      setError("El stock debe ser un número entero de 0 o más.");
      return;
    }
    setGuardando(true);
    setError(null);
    const payload = {
      marca: form.marca,
      modelo: form.modelo,
      version: form.version,
      disponible: form.disponible,
      anio: Number(form.anio),
      precio: Number(form.precio),
      precio_contado: form.precioContado,
      anticipo: form.anticipo,
      kms: Number(form.kms) || 0,
      stock: Number(form.stock),
      condicion: form.condicion,
      tipoVehiculo: form.tipoVehiculo,
      combustible: form.combustible,
      descripcion: form.descripcion,
      // La imagen principal va primera (el backend usa fotos_json[0] como principal).
      imgs: imagenesParaGuardar(form.imagenPrincipal, form.imagenes),
    };
    try {
      if (editando) await actualizarVehiculo(editRef, payload);
      else await crearVehiculo(payload);
      setAbierto(false);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar el vehículo.");
    } finally {
      setGuardando(false);
    }
  }

  async function cerrarConsignacion(v, estado) {
    setCerrando(v.ref);
    setError(null);
    try {
      await cerrarConsignacionVehiculo(v.ref, estado);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo cerrar la consignación.");
    } finally {
      setCerrando(null);
    }
  }

  // Beneficios (descuento + promos) y acciones: compartidos por tabla (desktop) y tarjetas (móvil).
  const beneficios = (v) => (
    <div className="flex flex-wrap gap-1">
      {v.descuento && (
        <span
          title={`Descuento: ${v.descuento.nombre}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
        >
          <BadgePercent className="w-3 h-3" /> {v.descuento.nombre} {etiquetaDescuento(v.descuento)}
        </span>
      )}
      {(v.promociones || []).map((p) => (
        <span
          key={p.id}
          title={p.descripcion || p.nombre}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-sky-500 border-sky-500/30 bg-sky-500/10"
        >
          <Gift className="w-3 h-3" /> {etiquetaPromo(p)}
        </span>
      ))}
      {!v.descuento && (v.promociones || []).length === 0 && (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );

  // Insignia de consignación: el auto es de un tercero, no del stock propio.
  // Cambia qué se puede hacer con él, así que tiene que verse en la fila.
  // `deConsignacion`: entró por Documentos → Consignación, aunque su
  // consignación comercial se haya archivado.
  const insigniaConsignacion = (v) =>
    v.consignacion || v.deConsignacion ? (
      <span
        title={
          v.consignacion
            ? `En consignación de ${v.consignacion.duenio_nombre} · comisión ${v.consignacion.comision}%`
            : "Ingresó en consignación desde Documentos"
        }
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-amber-500 border-amber-500/30 bg-amber-500/10"
      >
        <Handshake className="w-3 h-3" /> Consignación
      </span>
    ) : null;

  // Insignia de seña: el auto está reservado y no se ve en el catálogo público.
  const insigniaSena = (v) =>
    v.sena ? (
      <span
        title={
          v.sena.estado === "convertida"
            ? `Señado por ${v.sena.cliente ?? "un cliente"} · ya pasó a trámite`
            : `Señado por ${v.sena.cliente ?? "un cliente"} hasta el ${fechaCorta(v.sena.vence)}`
        }
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-violet-500 border-violet-500/30 bg-violet-500/10"
      >
        <BookmarkCheck className="w-3 h-3" /> Señado
      </span>
    ) : null;

  const accionesVehiculo = (v) => {
    const ocupado = cerrando === v.ref;
    const spinner = <Loader2 className="w-3.5 h-3.5 animate-spin" />;

    return (
      <div className="flex items-center gap-1.5">
        {/* Auto de tercero: el dueño se lo puede llevar. Retirado NO es una
            venta; la venta se marca en el legajo, en Documentos. */}
        {v.consignacion && (
          <button
            onClick={() => cerrarConsignacion(v, "retirado")}
            disabled={ocupado}
            title="El dueño retiró el vehículo (no es una venta)"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-50"
          >
            {ocupado && spinner} Retirado
          </button>
        )}

        <button onClick={() => abrirEdicion(v)} title="Editar" className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <EliminarVehiculo vehiculo={v} onRecargar={onRecargar} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">{`${origen.length} en el catálogo`}</p>
        {esAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportando(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:border-accent/50 transition-colors"
            >
              <ListPlus className="w-4 h-4" /> Importar lista
            </button>
            <button
              onClick={abrirAlta}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Nuevo vehículo
            </button>
          </div>
        )}
      </div>

      {error && !abierto && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filtros.orden} onChange={(e) => setF("orden", e.target.value)} className={CLASE_FILTRO}>
          <option value="marca_az">Marca A-Z</option>
          <option value="marca_za">Marca Z-A</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
          <option value="anio_asc">Año: menor a mayor</option>
          <option value="anio_desc">Año: mayor a menor</option>
        </select>
        <select value={filtros.marca} onChange={(e) => setF("marca", e.target.value)} className={CLASE_FILTRO}>
          <option value="">Todas las marcas</option>
          {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtros.condicion} onChange={(e) => setF("condicion", e.target.value)} className={CLASE_FILTRO}>
          <option value="">0km y usados</option>
          <option value="0km">0 km</option>
          <option value="usado">Usado</option>
        </select>
        <select value={filtros.beneficio} onChange={(e) => setF("beneficio", e.target.value)} className={CLASE_FILTRO}>
          <option value="">Con o sin beneficio</option>
          <option value="descuento">Con descuento</option>
          <option value="promo">Con promoción</option>
        </select>
        <input type="number" placeholder="$ mín" value={filtros.precioMin} onChange={(e) => setF("precioMin", e.target.value)} className={`${CLASE_FILTRO} w-24`} />
        <input type="number" placeholder="$ máx" value={filtros.precioMax} onChange={(e) => setF("precioMax", e.target.value)} className={`${CLASE_FILTRO} w-24`} />
        <input type="number" placeholder="Año mín" value={filtros.anioMin} onChange={(e) => setF("anioMin", e.target.value)} className={`${CLASE_FILTRO} w-24`} />
        <input type="number" placeholder="Año máx" value={filtros.anioMax} onChange={(e) => setF("anioMax", e.target.value)} className={`${CLASE_FILTRO} w-24`} />
        {hayFiltros && (
          <button
            type="button"
            onClick={() => setFiltros(FILTROS_VACIOS)}
            title="Resetear todos los filtros"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Resetear filtros
          </button>
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">N°</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Vehículo</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Año</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Kms</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Precio</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Condición</th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide">Beneficios</th>
                {esAdmin && <th className="px-5 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {numerarVehiculos(filtrados).map((v) => (
                <tr key={v.ref} className="border-t border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{v.numero}</td>
                  <td className="px-5 py-3.5">
                    <button type="button" onClick={() => setDetalle(v)} title="Ver detalle del vehículo" className="flex items-center gap-3 text-left group">
                      <div className="w-12 h-9 rounded-md bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                        {v.image && v.image !== "/placeholder.svg" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.image} alt={v.model} className="w-full h-full object-cover" />
                        ) : (
                          <Car className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-accent transition-colors">{v.brand} {v.model}{v.version ? ` ${v.version}` : ""}</p>
                        {!v.disponible && <p className="text-xs text-muted-foreground">Sin publicar</p>}
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{v.year}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{v.kms?.toLocaleString("es-AR")}</td>
                  <td className="px-5 py-3.5">
                    {v.descuento ? (
                      <div className="leading-tight">
                        <span className="block text-xs text-muted-foreground line-through">{precioARS(v.precio)}</span>
                        <span className="block font-medium text-emerald-500">{precioARS(v.precio_final)}</span>
                      </div>
                    ) : (
                      <span className="font-medium text-foreground">{precioARS(v.precio)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                      {v.condicion === "0km" ? "0 km" : "Usado"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-1">
                      {insigniaConsignacion(v)}
                      {insigniaSena(v)}
                      {beneficios(v)}
                    </div>
                  </td>
                  {esAdmin && (
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">{accionesVehiculo(v)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <p className="text-center py-12 text-muted-foreground">No hay vehículos que coincidan.</p>}
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {filtrados.length === 0 ? (
          <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">No hay vehículos que coincidan.</p>
        ) : (
          numerarVehiculos(filtrados).map((v) => (
            <div key={v.ref} className="rounded-xl border border-border bg-card overflow-hidden">
              <button type="button" onClick={() => setDetalle(v)} title="Ver detalle del vehículo" className="w-full text-left flex gap-3 p-3 hover:bg-secondary/40 transition-colors">
                <div className="w-24 h-16 rounded-md bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                  {v.image && v.image !== "/placeholder.svg" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image} alt={v.model} className="w-full h-full object-cover" />
                  ) : (
                    <Car className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{v.brand} {v.model}{v.version ? ` ${v.version}` : ""}</p>
                  <p className="text-xs text-muted-foreground">N° {v.numero}{!v.disponible && " · sin publicar"}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-1">
                    <span>{v.year}</span>
                    <span>·</span>
                    <span>{v.kms?.toLocaleString("es-AR")} km</span>
                    <span className="px-2 py-0.5 rounded-full border border-border">{v.condicion === "0km" ? "0 km" : "Usado"}</span>
                  </div>
                  <div className="mt-1">
                    {v.descuento ? (
                      <span>
                        <span className="text-xs text-muted-foreground line-through mr-1">{precioARS(v.precio)}</span>
                        <span className="font-medium text-emerald-500">{precioARS(v.precio_final)}</span>
                      </span>
                    ) : (
                      <span className="font-medium text-foreground">{precioARS(v.precio)}</span>
                    )}
                  </div>
                </div>
              </button>
              {(v.descuento || (v.promociones || []).length > 0 || v.sena) && (
                <div className="px-3 pb-2 flex flex-wrap items-center gap-1">
                  {insigniaConsignacion(v)}
                  {insigniaSena(v)}
                  {beneficios(v)}
                </div>
              )}
              {esAdmin && (
                <div className="border-t border-border px-3 py-2 flex justify-end">{accionesVehiculo(v)}</div>
              )}
            </div>
          ))
        )}
      </div>

      {abierto && (
        <Overlay>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                {editando ? <Pencil className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />}
                {editando ? "Editar vehículo" : "Nuevo vehículo"}
              </h2>
              <button onClick={() => setAbierto(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={enviar} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Campo label="Marca / Nombre *" valor={form.marca} onCambio={(v) => cambiar("marca", v)} placeholder="Volkswagen" autoFocus />
                <Campo label="Modelo *" valor={form.modelo} onCambio={(v) => cambiar("modelo", v)} placeholder="Gol Trend" />
                <Campo label="Versión" valor={form.version} onCambio={(v) => cambiar("version", v)} placeholder="1.6 Pack I" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Campo label="Año *" tipo="number" valor={form.anio} onCambio={(v) => cambiar("anio", v)} placeholder="2020" />
                <CampoNumero label="Kms" valor={form.kms} onCambio={(v) => cambiar("kms", v)} placeholder="45.000" />
                <label className="block">
                  <span className="block text-xs font-medium text-muted-foreground mb-1.5">Condición</span>
                  <select
                    value={form.condicion}
                    onChange={(e) => cambiar("condicion", e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent"
                  >
                    <option value="usado">Usado</option>
                    <option value="0km">0 km</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo</span>
                  <select
                    value={form.tipoVehiculo}
                    onChange={(e) => cambiar("tipoVehiculo", e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent"
                  >
                    {TIPOS_VEHICULO.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted-foreground mb-1.5">Combustible</span>
                  <select
                    value={form.combustible}
                    onChange={(e) => cambiar("combustible", e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent"
                  >
                    <option value="">Sin especificar</option>
                    {COMBUSTIBLES.map((c) => (
                      <option key={c.valor} value={c.valor}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CampoNumero label="Precio (ARS) *" valor={form.precio} onCambio={(v) => cambiar("precio", v)} placeholder="12.500.000" />
                <Campo label="Stock (unidades)" tipo="number" valor={form.stock} onCambio={(v) => cambiar("stock", v)} placeholder="1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CampoNumero label="Precio al contado (ARS)" valor={form.precioContado} onCambio={(v) => cambiar("precioContado", v)} placeholder="10.500.000" />
                <CampoNumero label="Anticipo (ARS)" valor={form.anticipo} onCambio={(v) => cambiar("anticipo", v)} placeholder="3.000.000" />
              </div>
              <label className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Descripción</span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => cambiar("descripcion", e.target.value)}
                  rows={2}
                  placeholder="Full, único dueño, service al día…"
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent resize-y"
                />
              </label>
              {/* Imagen principal */}
              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Imagen principal del vehículo</span>
                <div className="flex items-center gap-3">
                  {form.imagenPrincipal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imagenPrincipal} alt="principal" className="h-16 w-24 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="h-16 w-24 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm hover:border-accent/50 transition-colors">
                    {subiendoPrincipal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {subiendoPrincipal ? "Subiendo…" : form.imagenPrincipal ? "Cambiar" : "Subir imagen"}
                    <input type="file" accept="image/*" className="hidden" onChange={onImagenPrincipal} disabled={subiendoPrincipal} />
                  </label>
                  {form.imagenPrincipal && (
                    <button type="button" onClick={() => cambiar("imagenPrincipal", "")} className="text-xs text-muted-foreground hover:text-destructive">
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Imágenes (galería) */}
              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Imágenes</span>
                {form.imagenes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.imagenes.map((url) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-16 w-24 rounded-lg object-cover border border-border" />
                        <button
                          type="button"
                          onClick={() => quitarImagen(url)}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                          title="Quitar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm transition-colors ${sinLugarGaleria ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-accent/50"}`}>
                    {subiendoGaleria ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {subiendoGaleria ? "Subiendo…" : "Agregar imágenes"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onImagenesGaleria} disabled={subiendoGaleria || sinLugarGaleria} />
                  </label>
                  <span className="text-xs text-muted-foreground">{form.imagenes.length} de {IMAGENES_ADICIONALES_MAX}</span>
                </div>
              </div>

              {/* Sin marcar no sale en la web ni lo ofrece el bot. Los importados de una lista entran así. */}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.disponible} onChange={(e) => cambiar("disponible", e.target.checked)} className="h-4 w-4 accent-accent" />
                Publicado en la web
              </label>

              {error && <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">{error}</div>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setAbierto(false)} className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear vehículo"}
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      )}

      {detalle && (
        <Overlay>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                <Car className="w-5 h-5 text-accent" /> {detalle.brand} {detalle.model}
              </h2>
              <button onClick={() => setDetalle(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Imágenes */}
              {(detalle.imagenes && detalle.imagenes.length > 0) ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {detalle.imagenes.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={`${detalle.model} ${i + 1}`} className="h-32 rounded-lg object-cover shrink-0 border border-border" />
                  ))}
                </div>
              ) : detalle.image && detalle.image !== "/placeholder.svg" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detalle.image} alt={detalle.model} className="w-full h-40 rounded-lg object-cover border border-border" />
              ) : null}

              {/* Datos */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Dato label="Año">{detalle.year}</Dato>
                <Dato label="Kms">{detalle.kms?.toLocaleString("es-AR")}</Dato>
                {detalle.dominio && <Dato label="Dominio">{detalle.dominio}</Dato>}
                <Dato label="Stock">{detalle.stock ?? 0} {detalle.stock === 1 ? "unidad" : "unidades"}</Dato>
                <Dato label="Condición">{detalle.condicion === "0km" ? "0 km" : "Usado"}</Dato>
                <Dato label="Tipo">{tipoVehiculo(detalle.tipo).label}</Dato>
                {detalle.combustible && <Dato label="Combustible">{etiquetaCombustible(detalle.combustible)}</Dato>}
                <Dato label="Disponible">{detalle.disponible ? "Sí" : "No"}</Dato>
                <Dato label="Precio">
                  {detalle.descuento ? (
                    <span>
                      <span className="text-muted-foreground line-through mr-1">{precioARS(detalle.precio)}</span>
                      <span className="text-emerald-500 font-medium">{precioARS(detalle.precio_final)}</span>
                    </span>
                  ) : (
                    <span className="font-medium">{precioARS(detalle.precio)}</span>
                  )}
                </Dato>
              </div>

              {detalle.descripcion && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm text-foreground">{detalle.descripcion}</p>
                </div>
              )}

              {/* Beneficios */}
              {(detalle.descuento || (detalle.promociones || []).length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {detalle.descuento && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                      <BadgePercent className="w-3 h-3" /> {detalle.descuento.nombre} {etiquetaDescuento(detalle.descuento)}
                    </span>
                  )}
                  {(detalle.promociones || []).map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-sky-500 border-sky-500/30 bg-sky-500/10">
                      <Gift className="w-3 h-3" /> {etiquetaPromo(p)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-border">
              <button onClick={() => setDetalle(null)} className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cerrar</button>
            </div>
          </div>
        </Overlay>
      )}

      {importando && <ImportarLista onCerrar={() => setImportando(false)} onImportado={onRecargar} />}
    </div>
  );
}

function Dato({ label, children }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground">{children ?? "—"}</p>
    </div>
  );
}

