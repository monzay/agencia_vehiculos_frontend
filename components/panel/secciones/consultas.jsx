"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Phone, Car, Tag, User, UserCheck, Loader2, ChevronRight, CheckCircle2, Circle, MapPin, BellRing, Landmark, ArrowRight,
} from "lucide-react";
import { obtenerConsultas, marcarConsultaAtendida } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../ui/boton";
import { Tabla, FILA, CELDA } from "../ui/tabla";
import { Insignia } from "../ui/insignia";
import { PanelLateral } from "../ui/panel-lateral";
import { ChatConsulta } from "./chat-consulta";

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

// Semáforo del BCRA del cliente: SOLO INFORMATIVO para el asesor (no cambia la
// temperatura). Rojo no descarta la consulta: sugiere cómo armarle la operación.
const SEMAFORO = {
  verde: { variante: "exito", texto: "BCRA al día", sugerencia: "Financiación normal." },
  amarillo: { variante: "alerta", texto: "BCRA atraso leve", sugerencia: "Proponé más anticipo o consultá con la prendaria." },
  rojo: { variante: "peligro", texto: "BCRA con atrasos", sugerencia: "Ofrecé contado, más anticipo, garante o financiación propia. No lo descartes." },
  sin_datos: { variante: "neutral", texto: "BCRA sin historial", sugerencia: "No es mala señal: pedí recibo o garante." },
};
const SIN_VERIFICAR = { variante: "neutral", texto: "BCRA sin verificar", sugerencia: "No se pudo consultar al BCRA." };

function SemaforoCredito({ credito }) {
  if (!credito) return null;
  const info = credito.estado === "ok" ? SEMAFORO[credito.semaforo] : SIN_VERIFICAR;
  if (!info) return null;
  const consultado = new Date(credito.fecha).toLocaleDateString("es-AR");
  // Se consulta aunque la ficha no tenga DNI: el asesor verifica en persona que el nombre sea el de quien escribió.
  const aNombre = credito.nombre ? ` A nombre de ${credito.nombre}: verificá que sea quien escribió.` : "";
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Insignia variante={info.variante} title={`${info.sugerencia}${aNombre} Consultado el ${consultado}. Solo informativo.`}>
        <Landmark className="w-3 h-3" /> {info.texto}
      </Insignia>
      {credito.nombre && <span className="text-[10px] text-muted-foreground">a nombre de {credito.nombre}</span>}
    </span>
  );
}

// Qué pasó con la consulta después de Avanzar. Una seña convertida sin trámite es la
// de un auto en consignación que ya se vendió.
function estadoDeAvance({ tipo, estado }) {
  if (estado === "vendido" || (tipo === "sena" && estado === "convertida")) return { variante: "exito", texto: "Vendido" };
  if (tipo === "tramite") return { variante: "info", texto: "En trámite" };
  if (estado === "vencida") return { variante: "alerta", texto: "Seña vencida" };
  return { variante: "info", texto: "Señado" };
}

function InsigniaAvance({ avance }) {
  if (!avance) return null;
  const { variante, texto } = estadoDeAvance(avance);
  return <Insignia variante={variante}>{texto}</Insignia>;
}

// Aviso del agente con IA para el vendedor: lo derivó o acordó una visita.
function AvisoVendedor({ aviso }) {
  if (!aviso) return null;
  return (
    <span className="mt-1 inline-flex items-start gap-1.5 text-xs font-medium text-amber-600">
      <BellRing className="w-3.5 h-3.5 shrink-0 mt-px" />
      <span className="break-words">{aviso.motivo || "Requiere un vendedor"}</span>
    </span>
  );
}

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

function datosDelCliente(c) {
  return [c.nombre || "Sin nombre", c.telefonoLocal, c.provincia, fechaHora(c.hora)].filter(Boolean).join(" · ");
}

// `onAvanzar(sesionId)`: abre el menú de operaciones. `onVerAvance(avance)`: lleva a
// lo que nació de la consulta. Los dos llegan solo si es admin.
export function SeccionConsultas({ busqueda, nuevoDesde = null, abrirId = null, onAvanzar, onVerAvance }) {
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

  // El id se conserva al cerrar: el panel sigue mostrando la consulta mientras sale deslizándose.
  const [consultaAbiertaId, setConsultaAbiertaId] = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [atendidoOverride, setAtendidoOverride] = useState({}); // { [sesionId]: {at,por}|null }
  const [marcando, setMarcando] = useState(null);

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

  // Abre el panel lateral; el chat y las respuestas se cargan dentro de <ChatConsulta>.
  const abrir = useCallback((sesionId) => {
    setConsultaAbiertaId(sesionId);
    setPanelAbierto(true);
  }, []);

  const estaAbierta = (c) => panelAbierto && consultaAbiertaId === c.sesionId;

  // Puede no estar en la lista si llegó por link y todavía no se cargó esa página.
  const consultaAbierta = items.find((c) => c.sesionId === consultaAbiertaId);

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
        <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio="No hay consultas que coincidan.">
          {items.map((c) => (
                <tr key={c.sesionId} className={cn(FILA, "cursor-pointer", estaAbierta(c) && "bg-secondary/60")} onClick={() => abrir(c.sesionId)}>
                  <td className={CELDA}>
                    <span className="font-medium text-foreground inline-flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      {c.vehiculo ? <Car className="w-3.5 h-3.5 text-accent shrink-0" /> : <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      {tituloConsulta(c)}
                      {esNueva(c) && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Nuevo</span>
                      )}
                    </span>
                    <div className="pl-6"><AvisoVendedor aviso={getAtendido(c) ? null : c.requiereVendedor} /></div>
                  </td>
                  <td className={CELDA}>
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> {c.nombre || "Sin nombre"}
                    </span>
                  </td>
                  <td className={CELDA}>
                    {c.asesor ? (
                      <Insignia variante="info"><UserCheck className="w-3 h-3" /> {c.asesor}</Insignia>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin asignar</span>
                    )}
                  </td>
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
                    <div className="flex flex-col items-start gap-1">
                      {c.clasificacion ? (
                        <Insignia variante={CLASIF_VARIANTE[c.clasificacion] || "neutral"}>{c.clasificacion}</Insignia>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      <SemaforoCredito credito={c.credito} />
                      <InsigniaAvance avance={c.avance} />
                    </div>
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>{botonAtendido(c)}</td>
                </tr>
          ))}
        </Tabla>
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">No hay consultas que coincidan.</p>
        ) : (
          items.map((c) => (
              <div key={c.sesionId} className="rounded-xl border border-border bg-card overflow-hidden">
                <button type="button" onClick={() => abrir(c.sesionId)} className="w-full text-left p-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground inline-flex items-center gap-1.5 min-w-0">
                      {c.vehiculo ? <Car className="w-3.5 h-3.5 text-accent shrink-0" /> : <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <span className="truncate">{tituloConsulta(c)}</span>
                      {esNueva(c) && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">Nuevo</span>
                      )}
                    </p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {c.nombre || "Sin nombre"}
                  </p>
                  <AvisoVendedor aviso={getAtendido(c) ? null : c.requiereVendedor} />

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {c.clasificacion && <Insignia variante={CLASIF_VARIANTE[c.clasificacion] || "neutral"}>{c.clasificacion}</Insignia>}
                    <SemaforoCredito credito={c.credito} />
                    <InsigniaAvance avance={c.avance} />
                    {c.asesor
                      ? <Insignia variante="info"><UserCheck className="w-3 h-3" /> {c.asesor}</Insignia>
                      : <span className="text-xs text-muted-foreground">Sin asignar</span>}
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
              </div>
          ))
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

      <PanelLateral
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        titulo={consultaAbierta ? tituloConsulta(consultaAbierta) : "Consulta"}
        descripcion={consultaAbierta ? datosDelCliente(consultaAbierta) : "Conversación con el cliente"}
        cabecera={consultaAbierta && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {consultaAbierta.clasificacion && (
              <Insignia variante={CLASIF_VARIANTE[consultaAbierta.clasificacion] || "neutral"}>{consultaAbierta.clasificacion}</Insignia>
            )}
            <SemaforoCredito credito={consultaAbierta.credito} />
            <InsigniaAvance avance={consultaAbierta.avance} />
            {consultaAbierta.asesor && (
              <Insignia variante="info"><UserCheck className="w-3 h-3" /> {consultaAbierta.asesor}</Insignia>
            )}
            {botonAtendido(consultaAbierta)}
            {consultaAbierta.avance
              ? onVerAvance && (
                  <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => onVerAvance(consultaAbierta.avance)}>
                    {consultaAbierta.avance.tipo === "tramite" ? "Ver trámite" : "Ver seña"} <ArrowRight className="w-3.5 h-3.5" />
                  </Boton>
                )
              : onAvanzar && (
                  <Boton
                    variante="primario"
                    tamano="sm"
                    className="gap-1.5"
                    onClick={() => {
                      // El panel lateral bloquea los clics de todo lo que quede fuera de él.
                      setPanelAbierto(false);
                      onAvanzar(consultaAbierta.sesionId);
                    }}
                  >
                    Avanzar <ArrowRight className="w-3.5 h-3.5" />
                  </Boton>
                )}
            <AvisoVendedor aviso={getAtendido(consultaAbierta) ? null : consultaAbierta.requiereVendedor} />
          </div>
        )}
      >
        {consultaAbiertaId && <ChatConsulta key={consultaAbiertaId} sesionId={consultaAbiertaId} />}
      </PanelLateral>
    </div>
  );
}
