"use client";

import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown, Flame, Thermometer, Snowflake, Repeat, Sparkles, Loader2, Tag } from "lucide-react";
import { infoClasificacion, partesFecha } from "@/components/admin/utilidades-leads";
import { combinadorClases as cn } from "@/lib/utilidades";
import { obtenerLead, obtenerLeadsPagina } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { InfoCliente } from "@/components/admin/info-cliente";
import { Boton } from "../ui/boton";
import { Tabla, FILA, CELDA } from "../ui/tabla";

const PAGINA = 10;

const ICON = { CALIENTE: Flame, TIBIO: Thermometer, FRIO: Snowflake };
const COL = {
  CALIENTE: "text-red-400 border-red-500/30 bg-red-500/10",
  TIBIO: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  FRIO: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};
// Sin clasificación (consulta general): badge neutro, no se muestra como fría.
const COL_NEUTRO = "text-muted-foreground border-foreground/15 bg-foreground/5";
// Última consulta = venta/consignación: no lleva clasificación, lleva su etiqueta.
const COL_VENTA = "text-violet-400 border-violet-500/30 bg-violet-500/10";

function Badge({ clasif, tipoLead }) {
  if (tipoLead === "venta") {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", COL_VENTA)}>
        <Tag className="w-3 h-3" /> Vende / Consigna
      </span>
    );
  }
  const info = infoClasificacion(clasif);
  const Icon = ICON[clasif] ?? info.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", COL[clasif] ?? COL_NEUTRO)}>
      <Icon className="w-3 h-3" /> {info?.label ?? clasif}
    </span>
  );
}

const COLUMNAS = [
  { label: "Cliente" },
  { label: "Volvió" },
  { label: "Última consulta" },
  { label: "Consultó" },
  { label: "", className: "w-10" },
];

const esRecurrente = (l) => (l.totalSesiones ?? 1) > 1;

export function SeccionClientes({ busqueda, refrescar, nuevoDesde = null }) {
  const [filtro, setFiltro] = useState("TODOS");
  const [expandidoId, setExpandidoId] = useState(null);
  const [detalles, setDetalles] = useState({}); // { [id]: { cargando, lead, error } }

  // Cliente "nuevo de esta visita": llegó después de la última revisión del
  // usuario (misma marca que enciende el badge del sidebar).
  const esNuevoDeVisita = (l) => nuevoDesde && l.creado && new Date(l.creado) > new Date(nuevoDesde);

  // Chip Volvió/Nuevo. "Nuevo" se resalta en verde si llegó desde la última visita.
  const chipVisita = (l) =>
    esRecurrente(l) ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <Repeat className="w-2.5 h-2.5" /> Volvió · {l.totalSesiones}
      </span>
    ) : (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border",
          esNuevoDeVisita(l)
            ? "font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "font-medium border-border text-muted-foreground"
        )}
      >
        <Sparkles className="w-2.5 h-2.5" /> Nuevo
      </span>
    );

  // Datos paginados del server: cambian filtro/búsqueda/refresco → recarga página 1.
  const { items, total, hayMas, cargandoInicial, cargandoMas, error, cargarMas } = usarListaPaginada(
    // Sin filtro de tipo: se muestran TODOS los clientes, incluidos los que solo
    // hicieron una consulta de venta/consignación.
    ({ offset, limite }) => obtenerLeadsPagina({ clasif: filtro, q: busqueda, offset, limite }),
    [filtro, busqueda, refrescar],
    { limite: PAGINA }
  );

  async function alternar(l) {
    if (expandidoId === l.id) {
      setExpandidoId(null);
      return;
    }
    setExpandidoId(l.id);
    if (!detalles[l.id]) {
      setDetalles((d) => ({ ...d, [l.id]: { cargando: true } }));
      try {
        const lead = await obtenerLead(l.id);
        setDetalles((d) => ({ ...d, [l.id]: { cargando: false, lead } }));
      } catch (err) {
        setDetalles((d) => ({ ...d, [l.id]: { cargando: false, error: err.message } }));
      }
    }
  }

  // Detalle expandido (ficha del cliente). Compartido por tabla (desktop) y tarjetas (móvil).
  const detalleLead = (det) =>
    det?.cargando ? (
      <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando información…</p>
    ) : det?.error ? (
      <p className="text-sm text-destructive">No se pudo cargar la info. ({det.error})</p>
    ) : det?.lead ? (
      <InfoCliente lead={det.lead} mostrarIdentidad={false} />
    ) : null;

  return (
    <div className="space-y-4">
      {/* Filtros por clasificación (van al server) */}
      <div className="flex flex-wrap items-center gap-2">
        {["TODOS", "CALIENTE", "TIBIO", "FRIO"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              filtro === f
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {f === "TODOS" ? "Todos" : infoClasificacion(f)?.label ?? f}
          </button>
        ))}
        {!cargandoInicial && (
          <span className="text-sm text-muted-foreground ml-auto">Mostrando {items.length} de {total}</span>
        )}
      </div>

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
            <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio="No hay clientes que coincidan.">
              {items.map((l) => {
                const abierto = expandidoId === l.id;
                const det = detalles[l.id];
                // Clasificación y fecha/hora de la ÚLTIMA consulta (no la de mayor score).
                const ultima = l.ultimaConsulta;
                const { fecha, hora } = partesFecha(ultima?.fecha ?? l.ultimaActividad);
                return (
                  <Fragment key={l.id}>
                    <tr onClick={() => alternar(l)} className={cn(FILA, "cursor-pointer")}>
                      <td className={CELDA}>
                        <p className="font-medium text-foreground">{l.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{l.telefono}</p>
                      </td>
                      <td className={CELDA}>{chipVisita(l)}</td>
                      <td className={CELDA}><Badge clasif={ultima?.clasificacion ?? l.clasificacion} tipoLead={ultima?.tipoLead} /></td>
                      <td className={`${CELDA} text-muted-foreground`}>
                        <p className="text-foreground/80">{fecha}</p>
                        <p className="text-xs">{hora}</p>
                      </td>
                      <td className={`${CELDA} text-right`}>
                        {abierto ? (
                          <ChevronDown className="w-4 h-4 text-accent inline" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground inline" />
                        )}
                      </td>
                    </tr>

                    {abierto && (
                      <tr className="border-t border-border bg-secondary/30">
                        <td colSpan={5} className="px-5 py-4">{detalleLead(det)}</td>
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
              <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">No hay clientes que coincidan.</p>
            ) : (
              items.map((l) => {
                const abierto = expandidoId === l.id;
                const det = detalles[l.id];
                const ultima = l.ultimaConsulta;
                const { fecha, hora } = partesFecha(ultima?.fecha ?? l.ultimaActividad);
                return (
                  <div key={l.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button type="button" onClick={() => alternar(l)} className="w-full text-left p-3 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{l.nombre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{l.telefono}</p>
                        </div>
                        {abierto ? <ChevronDown className="w-4 h-4 text-accent shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Badge clasif={ultima?.clasificacion ?? l.clasificacion} tipoLead={ultima?.tipoLead} />
                        {chipVisita(l)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Consultó: {fecha}{hora ? ` · ${hora}` : ""}</p>
                    </button>
                    {abierto && (
                      <div className="border-t border-border bg-secondary/30 px-3 py-3">{detalleLead(det)}</div>
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
