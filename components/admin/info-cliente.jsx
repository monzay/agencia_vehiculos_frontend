"use client";
import { useState } from "react";
import { obtenerConsulta } from "@/lib/api";
import { nombreCanal, formatearFecha, infoClasificacion } from "./utilidades-leads";
import {
  Phone, Car, Tag, CalendarCheck, Clock, User, ChevronDown, ChevronRight, Loader2,
} from "lucide-react";

function Fila({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-foreground font-medium">{children}</span>
    </div>
  );
}

// Título de cada consulta del historial según su tipo:
//   - compra: el vehículo del catálogo que consultó
//   - venta/consignación: la modalidad + el vehículo que ofrece
//   - cuotas: consulta de financiación
//   - resto: consulta general (solo saludo/menú)
function tituloConsulta(s) {
  if (s.auto) return `${s.auto.brand} ${s.auto.model}`;
  if (s.autoRef) return `Ref #${s.autoRef}`;
  if (s.tipoLead === "venta") {
    const vehiculo = [s.venta?.marca, s.venta?.modelo, s.venta?.anio].filter(Boolean).join(" ");
    const modalidad =
      s.modalidadVenta === "consignacion" ? "Consignación" : s.modalidadVenta === "venta" ? "Venta directa" : "Quiere vender";
    return vehiculo ? `${modalidad} — ${vehiculo}` : `${modalidad} — su vehículo`;
  }
  if ((s.pasoActual || "").startsWith("cuotas")) return "Consulta de financiación";
  return "Consulta general";
}

// Toda la info de un cliente: datos + sus consultas con la misma estructura de la
// sección Consultas (cada consulta expandible con respuestas + mensajes).
// Se usa en el panel lateral (DetalleLead) y embebido bajo la fila de Clientes.
export function InfoCliente({ lead, mostrarIdentidad = true }) {
  const [expandida, setExpandida] = useState(null);
  const [detalles, setDetalles] = useState({}); // { [sesionId]: { cargando, respuestas, mensajes, error } }

  async function alternar(s) {
    if (expandida === s.id) {
      setExpandida(null);
      return;
    }
    setExpandida(s.id);
    if (!detalles[s.id]) {
      setDetalles((d) => ({ ...d, [s.id]: { cargando: true } }));
      try {
        const res = await obtenerConsulta(s.id);
        setDetalles((d) => ({ ...d, [s.id]: { cargando: false, respuestas: res?.respuestas ?? [], mensajes: res?.mensajes ?? [] } }));
      } catch (err) {
        setDetalles((d) => ({ ...d, [s.id]: { cargando: false, error: err.message } }));
      }
    }
  }

  const consultas = lead?.sesiones ?? [];
  const fechas = consultas.map((s) => s.inicio).filter(Boolean).sort();
  const primeraConsulta = fechas[0] ?? lead?.creado ?? null;
  const ultimaConsulta = fechas[fechas.length - 1] ?? lead?.ultimaActividad ?? null;

  return (
    <div className="space-y-6">
      {mostrarIdentidad && (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-semibold">{lead.nombre}</p>
            <p className="text-sm text-muted-foreground">{nombreCanal(lead.canal)}</p>
          </div>
        </div>
      )}

      {/* Datos */}
      <section className="space-y-3">
        <Fila icon={Phone} label="Teléfono">{lead.telefono}</Fila>
        <Fila icon={User} label="Canal">{nombreCanal(lead.canal)}</Fila>
        <Fila icon={CalendarCheck} label="Primera consulta">{formatearFecha(primeraConsulta)}</Fila>
        <Fila icon={Clock} label="Última consulta">{formatearFecha(ultimaConsulta)}</Fila>
      </section>

      {/* Consultas — misma estructura que la sección Consultas */}
      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Car className="w-4 h-4" /> Consultas ({consultas.length})
        </h3>

        {consultas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay consultas registradas.</p>
        ) : (
          <div className="space-y-2">
            {consultas.map((s) => {
              const abierta = expandida === s.id;
              const det = detalles[s.id];
              const ic = infoClasificacion(s.clasificacion);
              return (
                <div key={s.id} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
                  <button
                    onClick={() => alternar(s)}
                    className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-foreground/[0.03] transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {abierta ? <ChevronDown className="w-4 h-4 text-accent shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      {s.auto ? <Car className="w-3.5 h-3.5 text-accent shrink-0" /> : <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tituloConsulta(s)}</p>
                        <p className="text-xs text-muted-foreground">{formatearFecha(s.inicio)}</p>
                      </div>
                    </div>
                    {s.clasificacion && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${ic.badge}`}>
                        <ic.icon className="w-3 h-3" /> {ic.label}
                      </span>
                    )}
                  </button>

                  {abierta && (
                    <div className="border-t border-foreground/10 p-3">
                      {det?.cargando ? (
                        <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando respuestas…</p>
                      ) : det?.error ? (
                        <p className="text-sm text-destructive">No se pudieron cargar las respuestas. ({det.error})</p>
                      ) : (
                        <div className="space-y-4">
                          {(det?.respuestas || []).length > 0 ? (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Respuestas del cliente</p>
                              <div className="flex flex-col gap-2">
                                {det.respuestas.map((r, i) => (
                                  <div key={i} className="rounded-lg border border-foreground/10 bg-background px-3 py-2">
                                    <p className="text-xs text-muted-foreground">{r.pregunta}</p>
                                    <p className="text-sm font-medium text-foreground mt-0.5">{r.respuesta}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sin datos en esta consulta.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
