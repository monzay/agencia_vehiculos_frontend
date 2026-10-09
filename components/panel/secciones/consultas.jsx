"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Phone, Car, Tag, User, UserCheck, Loader2, ChevronRight, ChevronDown, HelpCircle, CheckCircle2, Circle, MapPin,
} from "lucide-react";
import { obtenerConsultas, obtenerConsulta, marcarConsultaAtendida } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../ui/boton";
import { Tabla, FILA, CELDA } from "../ui/tabla";
import { Insignia } from "../ui/insignia";
import { ConsultasVenta } from "./consultas-venta";

const PAGINA = 10; // tamaño del bloque de lazy loading

// Filtros que se resuelven en el server (afectan también total y paginación).
// El valor "" significa "sin filtrar por este eje".
const FILTRO_CLASIF = [
  { valor: "", label: "Todas" },
  { valor: "CALIENTE", label: "Calientes" },
  { valor: "TIBIO", label: "Tibias" },
  { valor: "FRIO", label: "Frías" },
];

function Pills({ etiqueta, opciones, valor, onCambio }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-24 shrink-0">{etiqueta}</span>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onCambio(o.valor)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
            valor === o.valor
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const CANAL_VARIANTE = { whatsapp: "exito", instagram: "peligro", facebook: "info", web: "neutral" };
const CLASIF_VARIANTE = { CALIENTE: "peligro", TIBIO: "alerta", FRIO: "info" };

const COLUMNAS = [
  { label: "Vehículo de interés" },
  { label: "Cliente" },
  { label: "Asesor asignado" },
  { label: "Teléfono" },
  { label: "Provincia" },
  { label: "Hora de la consulta" },
  { label: "Clasificación" },
  { label: "Atención" },
];

function fechaHora(iso) {
  if (!iso) return "—";
  // Los timestamps se guardan en UTC y se muestran en hora de Argentina.
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function tituloConsulta(c) {
  if (c.vehiculo) return `${c.vehiculo.marca} ${c.vehiculo.modelo}${c.vehiculo.anio ? " " + c.vehiculo.anio : ""}`;
  if (c.tipoLead === "venta") return "Quiere vender su vehículo";
  return "Consulta general";
}

// Tipo de consulta: las de compra (las del bot de siempre) o las de quienes
// quieren vender su auto, en venta directa o en consignación.
const FILTRO_TIPO = [
  { valor: "compra", label: "Compra" },
  { valor: "venta", label: "Venta directa" },
  { valor: "consignacion", label: "Consignación" },
];

// `nuevoDesdeVenta`: marca de "nuevo" de las consultas de venta/consignación.
export function SeccionConsultas({ nuevoDesdeVenta = null, ...props }) {
  const [tipo, setTipo] = useState("compra");
  return (
    <div className="space-y-4">
      <Pills etiqueta="Tipo" opciones={FILTRO_TIPO} valor={tipo} onCambio={setTipo} />
      {tipo === "compra" ? (
        <ConsultasCompra {...props} />
      ) : (
        <ConsultasVenta key={tipo} modalidad={tipo} busqueda={props.busqueda} nuevoDesde={nuevoDesdeVenta} />
      )}
    </div>
  );
}

function ConsultasCompra({ busqueda, mostrarAsesor = true, nuevoDesde = null, abrirId = null }) {
  // Con la repartición desactivada se oculta quién atiende cada consulta.
  const columnas = mostrarAsesor ? COLUMNAS : COLUMNAS.filter((c) => c.label !== "Asesor asignado");

  // Consulta "nueva": iniciada después de la última revisión del usuario (nuevoDesde).
  const esNueva = (c) => nuevoDesde && c.hora && new Date(c.hora) > new Date(nuevoDesde);

  const [clasif, setClasif] = useState("");

  // Datos paginados del server: la búsqueda y los filtros van a la base (toda la
  // DB por coincidencia), no filtran sólo lo ya cargado. Cambia cualquiera →
  // recarga la primera página (con debounce).
  const { items, total, hayMas, cargandoInicial, cargandoMas, error: errorLista, cargarMas } = usarListaPaginada(
    ({ offset, limite }) => obtenerConsultas({ q: busqueda, clasif, offset, limite }),
    [busqueda, clasif],
    { limite: PAGINA }
  );

  const [error, setError] = useState(null); // error de la acción "marcar atendida"

  const [expandidoId, setExpandidoId] = useState(null);
  const [detalles, setDetalles] = useState({}); // { [sesionId]: { cargando, respuestas, mensajes, error } }
  const [atendidoOverride, setAtendidoOverride] = useState({}); // { [sesionId]: {at,por}|null }
  const [marcando, setMarcando] = useState(null);
  const pedidos = useRef(new Set()); // detalles ya pedidos, para no repetir el fetch

  // Estado de atención efectivo (override optimista o lo que trajo el server).
  const getAtendido = (c) => (c.sesionId in atendidoOverride ? atendidoOverride[c.sesionId] : c.atendido);

  async function toggleAtendido(c) {
    const actual = getAtendido(c);
    setMarcando(c.sesionId);
    setError(null);
    try {
      const res = await marcarConsultaAtendida(c.sesionId, !actual);
      setAtendidoOverride((o) => ({ ...o, [c.sesionId]: res?.atendido ?? null }));
    } catch (e) {
      setError(e.message);
    } finally {
      setMarcando(null);
    }
  }

  // Expande una consulta y trae su detalle (solo la primera vez).
  const abrir = useCallback(async (sesionId) => {
    setExpandidoId(sesionId);
    if (pedidos.current.has(sesionId)) return;
    pedidos.current.add(sesionId);
    setDetalles((d) => ({ ...d, [sesionId]: { cargando: true } }));
    try {
      const res = await obtenerConsulta(sesionId);
      setDetalles((d) => ({ ...d, [sesionId]: { cargando: false, respuestas: res?.respuestas ?? [] } }));
    } catch (err) {
      setDetalles((d) => ({ ...d, [sesionId]: { cargando: false, error: err.message } }));
    }
  }, []);

  function alternar(c) {
    if (expandidoId === c.sesionId) {
      setExpandidoId(null);
      return;
    }
    abrir(c.sesionId);
  }

  // Link directo del aviso de Telegram (/admin/<sesionId>): abre esa consulta sola.
  useEffect(() => {
    const id = Number(abrirId);
    if (Number.isInteger(id) && id > 0) abrir(id);
  }, [abrirId, abrir]);

  // Botón "atendida" (toggle). Compartido por la tabla (desktop) y las tarjetas (móvil).
  const botonAtendido = (c) => {
    const at = getAtendido(c);
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleAtendido(c); }}
        disabled={marcando === c.sesionId}
        title={at ? `Atendida el ${fechaHora(at.at)}${at.por ? ` por ${at.por}` : ""} — clic para desmarcar` : "Clic para marcar como atendida"}
        className="disabled:opacity-60"
      >
        {marcando === c.sesionId ? (
          <Insignia variante="neutral"><Loader2 className="w-3 h-3 animate-spin" /> Guardando…</Insignia>
        ) : at ? (
          <Insignia variante="exito"><CheckCircle2 className="w-3 h-3" /> Atendida</Insignia>
        ) : (
          <Insignia variante="alerta"><Circle className="w-3 h-3" /> Pendiente</Insignia>
        )}
      </button>
    );
  };

  // Detalle expandido (respuestas del cliente). Compartido por ambas vistas.
  const panelRespuestas = (det) =>
    det?.cargando ? (
      <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando respuestas…</p>
    ) : det?.error ? (
      <p className="text-sm text-destructive">No se pudieron cargar las respuestas. ({det.error})</p>
    ) : (det?.respuestas || []).length > 0 ? (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Respuestas del cliente</p>
        <div className="flex flex-col gap-2">
          {det.respuestas.map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><HelpCircle className="w-3 h-3" /> {r.pregunta}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{r.respuesta}</p>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Sin datos en esta consulta.</p>
    );

  return (
    <div className="space-y-4">
      {/* Filtros (van al server). Quedan visibles mientras recarga. */}
      <div className="space-y-2">
        <Pills etiqueta="Clasificación" opciones={FILTRO_CLASIF} valor={clasif} onCambio={setClasif} />
      </div>

      {cargandoInicial ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
      <>
      <p className="text-sm text-muted-foreground">
        Mostrando {items.length} de {total} {total === 1 ? "consulta" : "consultas"}
      </p>

      {(error || errorLista) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">{error || errorLista}</div>
      )}

      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <Tabla columnas={columnas} vacio={items.length === 0} mensajeVacio="No hay consultas que coincidan.">
          {items.map((c) => {
            const abierta = expandidoId === c.sesionId;
            const det = detalles[c.sesionId];
            return (
              <Fragment key={c.sesionId}>
                <tr className={`${FILA} cursor-pointer`} onClick={() => alternar(c)}>
                  <td className={CELDA}>
                    <span className="font-medium text-foreground inline-flex items-center gap-2">
                      {abierta ? <ChevronDown className="w-4 h-4 text-accent shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      {c.vehiculo ? <Car className="w-3.5 h-3.5 text-accent shrink-0" /> : <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      {tituloConsulta(c)}
                      {esNueva(c) && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Nuevo</span>
                      )}
                    </span>
                  </td>
                  <td className={CELDA}>
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> {c.nombre || "Sin nombre"}
                    </span>
                  </td>
                  {mostrarAsesor && (
                    <td className={CELDA}>
                      {c.asesor ? (
                        <Insignia variante="info"><UserCheck className="w-3 h-3" /> {c.asesor}</Insignia>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin asignar</span>
                      )}
                    </td>
                  )}
                  <td className={`${CELDA} text-muted-foreground whitespace-nowrap`}>
                    {c.telefonoLocal ? <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> {c.telefonoLocal}</span> : "—"}
                  </td>
                  <td className={`${CELDA} text-muted-foreground whitespace-nowrap`}>
                    {c.provincia
                      ? <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.provincia}</span>
                      : <span title="No se pudo deducir del código de área">—</span>}
                  </td>
                  <td className={`${CELDA} text-muted-foreground whitespace-nowrap`}>
                    {(() => {
                      const [fecha, hora] = fechaHora(c.hora).split(", ");
                      return (
                        <div className="flex flex-col leading-tight">
                          <span>{fecha}</span>
                          {hora && <span className="text-xs">{hora}</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    {c.clasificacion ? (
                      <Insignia variante={CLASIF_VARIANTE[c.clasificacion] || "neutral"}>{c.clasificacion}</Insignia>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>{botonAtendido(c)}</td>
                </tr>

                {abierta && (
                  <tr className="border-t border-border bg-secondary/30">
                    <td colSpan={mostrarAsesor ? 7 : 6} className="px-5 py-4">
                      {panelRespuestas(det)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </Tabla>
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">No hay consultas que coincidan.</p>
        ) : (
          items.map((c) => {
            const abierta = expandidoId === c.sesionId;
            const det = detalles[c.sesionId];
            return (
              <div key={c.sesionId} className="rounded-xl border border-border bg-card overflow-hidden">
                <button type="button" onClick={() => alternar(c)} className="w-full text-left p-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground inline-flex items-center gap-1.5 min-w-0">
                      {c.vehiculo ? <Car className="w-3.5 h-3.5 text-accent shrink-0" /> : <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <span className="truncate">{tituloConsulta(c)}</span>
                      {esNueva(c) && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">Nuevo</span>
                      )}
                    </p>
                    {abierta ? <ChevronDown className="w-4 h-4 text-accent shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {c.nombre || "Sin nombre"}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {c.clasificacion && <Insignia variante={CLASIF_VARIANTE[c.clasificacion] || "neutral"}>{c.clasificacion}</Insignia>}
                    {mostrarAsesor && (c.asesor
                      ? <Insignia variante="info"><UserCheck className="w-3 h-3" /> {c.asesor}</Insignia>
                      : <span className="text-xs text-muted-foreground">Sin asignar</span>)}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <Phone className="w-3 h-3 shrink-0" /> {c.telefonoLocal || "—"}
                    </span>
                    {c.provincia && (
                      <span className="inline-flex items-center gap-1 min-w-0 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {c.provincia}
                      </span>
                    )}
                    <span className="whitespace-nowrap shrink-0">{fechaHora(c.hora)}</span>
                  </div>
                </button>

                <div className="px-3 pb-3">{botonAtendido(c)}</div>

                {abierta && (
                  <div className="border-t border-border bg-secondary/30 px-3 py-3">{panelRespuestas(det)}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Botón Ver más (lazy loading; también pagina resultados de búsqueda) */}
      {hayMas && (
        <div className="flex justify-center pt-1">
          <Boton variante="secundario" onClick={cargarMas} cargando={cargandoMas}>
            {cargandoMas ? "Cargando…" : `Ver más (${total - items.length} restantes)`}
          </Boton>
        </div>
      )}
      </>
      )}
    </div>
  );
}
