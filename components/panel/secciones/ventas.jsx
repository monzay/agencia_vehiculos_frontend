"use client";

import { Fragment, useRef, useState } from "react";
import { Tag, Phone, User, ChevronRight, ChevronDown, Loader2, HelpCircle } from "lucide-react";
import { obtenerConsulta, obtenerConsultasVenta } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { Boton } from "../ui/boton";
import { Tabla, FILA, CELDA } from "../ui/tabla";
import { Insignia } from "../ui/insignia";

const PAGINA = 10;

const COLUMNAS = [
  { label: "Vehículo a vender" },
  { label: "Tipo" },
  { label: "Cliente" },
  { label: "Teléfono" },
  { label: "Fecha" },
  { label: "Hora" },
];

// Cómo quiere entregar el vehículo. Null en las consultas anteriores a que el
// bot empezara a preguntarlo.
const MODALIDAD = {
  venta: { etiqueta: "Venta directa", variante: "info" },
  consignacion: { etiqueta: "Consignación", variante: "alerta" },
};

function InsigniaModalidad({ modalidad }) {
  const m = MODALIDAD[modalidad];
  if (!m) return <span className="text-xs text-muted-foreground">Sin especificar</span>;
  return <Insignia variante={m.variante}>{m.etiqueta}</Insignia>;
}

// Los timestamps se guardan en UTC y se muestran en hora de Argentina.
function soloFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric" });
}
function soloHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function tituloVenta(v = {}) {
  return [v.marca, v.modelo, v.anio].filter(Boolean).join(" ") || "Vehículo sin especificar";
}

export function SeccionVentas({ busqueda, refrescar, nuevoDesde = null }) {
  const [expandidoId, setExpandidoId] = useState(null);
  const [detalles, setDetalles] = useState({}); // { [sesionId]: { cargando, respuestas, error } }
  const pedidos = useRef(new Set()); // detalles ya pedidos, para no repetir el fetch

  // Consulta "nueva": su sesión empezó después de la última revisión del usuario.
  const esNueva = (l) => nuevoDesde && l.venta?.inicio && new Date(l.venta.inicio) > new Date(nuevoDesde);

  const { items, total, hayMas, cargandoInicial, cargandoMas, error, cargarMas } = usarListaPaginada(
    ({ offset, limite }) => obtenerConsultasVenta({ q: busqueda, offset, limite }),
    [busqueda, refrescar],
    { limite: PAGINA }
  );

  // Expande una consulta y trae su detalle (solo la primera vez), como en Consultas.
  async function alternar(sesionId) {
    if (expandidoId === sesionId) {
      setExpandidoId(null);
      return;
    }
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
  }

  // Detalle expandido: las respuestas del cliente en esa consulta (mismo panel
  // que la sección Consultas). Compartido por tabla (desktop) y tarjetas (móvil).
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
      <p className="text-sm text-muted-foreground">
        {cargandoInicial ? "Cargando…" : `Mostrando ${items.length} de ${total} ${total === 1 ? "consulta" : "consultas"} de venta / consignación`}
      </p>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">{error}</div>
      )}

      {cargandoInicial ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop: tabla */}
          <div className="hidden md:block">
            <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio="Todavía no hay consultas de venta o consignación.">
              {items.map((l) => {
                const v = l.venta || {};
                const abierta = expandidoId === l.sesionId;
                return (
                  <Fragment key={l.id}>
                    <tr className={`${FILA} cursor-pointer`} onClick={() => alternar(l.sesionId)}>
                      <td className={CELDA}>
                        <span className="font-medium text-foreground inline-flex items-center gap-2">
                          {abierta ? <ChevronDown className="w-4 h-4 text-accent shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                          <Tag className="w-3.5 h-3.5 text-accent shrink-0" />
                          {tituloVenta(v)}
                          {esNueva(l) && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Nuevo</span>
                          )}
                        </span>
                        <span className="ml-6 block text-xs text-muted-foreground tabular-nums">
                          {v.precio ? `$ ${v.precio}` : "Precio a definir"}
                        </span>
                      </td>
                      <td className={`${CELDA} whitespace-nowrap`}>
                        <InsigniaModalidad modalidad={v.modalidad} />
                      </td>
                      <td className={CELDA}>
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground" /> {l.nombre || "Sin nombre"}
                        </span>
                      </td>
                      <td className={`${CELDA} text-muted-foreground`}>
                        {l.telefono ? <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {l.telefono}</span> : "—"}
                      </td>
                      <td className={`${CELDA} text-muted-foreground whitespace-nowrap`}>{soloFecha(v.fecha)}</td>
                      <td className={`${CELDA} text-muted-foreground whitespace-nowrap tabular-nums`}>{soloHora(v.fecha)}</td>
                    </tr>

                    {abierta && (
                      <tr className="border-t border-border bg-secondary/30">
                        <td colSpan={6} className="px-5 py-4">{panelRespuestas(detalles[l.sesionId])}</td>
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
              <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">Todavía no hay consultas de venta o consignación.</p>
            ) : (
              items.map((l) => {
                const v = l.venta || {};
                const abierta = expandidoId === l.sesionId;
                return (
                  <div key={l.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button type="button" onClick={() => alternar(l.sesionId)} className="w-full text-left p-3 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground inline-flex items-center gap-1.5 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate">{tituloVenta(v)}</span>
                          {esNueva(l) && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">Nuevo</span>
                          )}
                        </p>
                        {abierta ? <ChevronDown className="w-4 h-4 text-accent shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums mt-1">{v.precio ? `$ ${v.precio}` : "Precio a definir"}</p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <InsigniaModalidad modalidad={v.modalidad} />
                        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground" /> {l.nombre || "Sin nombre"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3" /> {l.telefono || "—"}</span>
                        <span className="whitespace-nowrap tabular-nums">{soloFecha(v.fecha)} · {soloHora(v.fecha)}</span>
                      </div>
                    </button>
                    {abierta && (
                      <div className="border-t border-border bg-secondary/30 px-3 py-3">{panelRespuestas(detalles[l.sesionId])}</div>
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
        </>
      )}
    </div>
  );
}
