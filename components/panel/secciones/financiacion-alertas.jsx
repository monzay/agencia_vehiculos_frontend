"use client";

import { useState } from "react";
import { ArrowLeftRight, BadgeCheck, BellOff, BellRing, Check, CircleAlert, MessageCircle, PhoneOff, Store } from "lucide-react";
import { marcarAlertaAtendida } from "@/lib/api";
import { Boton } from "../ui/boton";
import { Insignia } from "../ui/insignia";

// Lo que respondió el cliente a un recordatorio de cuota (lo deja Agustina).
const TIPOS = {
  pagara_en_agencia: { texto: "Paga en la agencia", variante: "info", Icono: Store },
  transferencia: { texto: "Paga por transferencia", variante: "alerta", Icono: ArrowLeftRight },
  ya_pago: { texto: "Dice que ya pagó", variante: "exito", Icono: BadgeCheck },
  no_puede_pagar: { texto: "No puede pagar", variante: "peligro", Icono: CircleAlert },
  // Mientras no se atienda, a esa financiación no le salen más avisos.
  numero_equivocado: { texto: "Número equivocado: revisar el teléfono", variante: "peligro", Icono: PhoneOff },
  baja: { texto: "No quiere más avisos", variante: "neutral", Icono: BellOff },
  otro: { texto: "Otra respuesta", variante: "neutral", Icono: MessageCircle },
};

const tipoDe = (respuesta) => TIPOS[respuesta.tipo] ?? TIPOS.otro;

const fechaHora = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const cuandoVence = (dias) => (dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días`);

// Etiqueta de la fila: la cuota está en la ventana de avisos (3 días o menos).
export function EtiquetaAviso({ aviso }) {
  if (!aviso) return null;
  return (
    <Insignia variante={aviso.dias === 0 ? "peligro" : "alerta"} title={`Cuota ${aviso.numero}: se le está avisando por WhatsApp`}>
      <BellRing className="w-3 h-3" />
      {cuandoVence(aviso.dias)} · cuota {aviso.numero}
    </Insignia>
  );
}

// En la fila: un ícono por cada respuesta del cliente sin atender.
export function IconosRespuestas({ respuestas }) {
  if (!respuestas?.length) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {respuestas.map((r) => {
        const { texto, variante, Icono } = tipoDe(r);
        return (
          <Insignia key={r.id} variante={variante} title={`${texto}${r.detalle ? `: “${r.detalle}”` : ""}`} aria-label={texto}>
            <Icono className="w-3 h-3" />
          </Insignia>
        );
      })}
    </span>
  );
}

// En el panel expandido: el detalle de cada respuesta y el botón para darla por atendida.
export function RespuestasCliente({ respuestas, onAtendida }) {
  const [atendiendoId, setAtendiendoId] = useState(null);
  const [error, setError] = useState(null);
  if (!respuestas?.length) return null;

  async function atender(respuesta) {
    setAtendiendoId(respuesta.id);
    setError(null);
    try {
      await marcarAlertaAtendida(respuesta.id);
      onAtendida?.();
    } catch (err) {
      setError(err.message || "No se pudo marcar como atendido.");
    } finally {
      setAtendiendoId(null);
    }
  }

  return (
    <section aria-label="Respuestas del cliente" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Respuestas del cliente a los recordatorios</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="space-y-2">
        {respuestas.map((r) => {
          const { texto, variante, Icono } = tipoDe(r);
          return (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Insignia variante={variante}>
                    <Icono className="w-3 h-3" /> {texto}
                  </Insignia>
                  {r.cuota && <span className="text-xs text-muted-foreground">Cuota {r.cuota}</span>}
                  <span className="text-xs text-muted-foreground tabular-nums">{fechaHora(r.creada)}</span>
                </div>
                {r.detalle && <p className="text-sm text-muted-foreground wrap-break-word">“{r.detalle}”</p>}
              </div>
              <Boton variante="secundario" tamano="sm" onClick={() => atender(r)} cargando={atendiendoId === r.id} title="Marcar como atendido">
                <Check className="w-3.5 h-3.5" /> Atendido
              </Boton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
