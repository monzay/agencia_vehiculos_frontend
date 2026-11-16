"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, Bot, User, Headset, RotateCcw, AlertTriangle } from "lucide-react";
import { obtenerConsulta, enviarMensajeConsulta, devolverABot } from "@/lib/api";
import { Boton } from "../ui/boton";

// Cada cuánto se repregunta el chat mientras está abierto, para ver llegar al cliente en vivo.
const POLL_MS = 4000;
const MAX_TEXTO = 4096;

// Estilo de la burbuja según quién escribió: el cliente a la izquierda; el bot y el asesor a la
// derecha (los dos "nuestros"), distinguidos por color e ícono.
const AUTOR = {
  cliente: { etiqueta: "Cliente", icono: User, derecha: false, clase: "bg-card border-border" },
  bot: { etiqueta: "José (bot)", icono: Bot, derecha: true, clase: "bg-primary/10 border-primary/30" },
  humano: { etiqueta: "Asesor", icono: Headset, derecha: true, clase: "bg-emerald-500/10 border-emerald-500/30" },
};

function hora(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Burbuja({ m }) {
  const info = AUTOR[m.autor] ?? AUTOR.cliente;
  const Icono = info.icono;
  return (
    <div className={`flex ${info.derecha ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl border px-3 py-2 ${info.clase}`}>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
          <Icono className="w-3 h-3" /> {info.etiqueta}
        </span>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{m.mensaje}</p>
        <span className="block text-[10px] text-muted-foreground mt-1 text-right">{hora(m.fecha)}</span>
      </div>
    </div>
  );
}

// Chat completo de una consulta + panel para intervenir: responder desde acá pausa el bot
// (toma la conversación); "Devolver al bot" lo reactiva. Se refresca solo por polling.
export function ChatConsulta({ sesionId }) {
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [accionError, setAccionError] = useState(null);
  const finRef = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const d = await obtenerConsulta(sesionId);
      setDetalle(d);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [sesionId]);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, POLL_MS);
    return () => clearInterval(id);
  }, [cargar]);

  // Baja al último mensaje cuando llegan nuevos.
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "nearest" });
  }, [detalle?.chat?.length]);

  async function enviar(e) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setAccionError(null);
    try {
      await enviarMensajeConsulta(sesionId, limpio);
      setTexto("");
      await cargar();
    } catch (err) {
      setAccionError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function devolver() {
    setAccionError(null);
    try {
      await devolverABot(sesionId);
      await cargar();
    } catch (err) {
      setAccionError(err.message);
    }
  }

  if (!detalle) {
    return error ? (
      <p className="text-sm text-destructive">No se pudo cargar la conversación. ({error})</p>
    ) : (
      <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando conversación…
      </p>
    );
  }

  const { chat = [], respuestas = [], botPausado, ventanaAbierta } = detalle;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Lo que el bot ya averiguó (respuestas estructuradas). Con scroll propio: el chat es lo principal. */}
      {respuestas.length > 0 && (
        <details open className="shrink-0 rounded-lg border border-border bg-card/50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Datos de la consulta ({respuestas.length})
          </summary>
          <div className="max-h-36 overflow-y-auto px-3 pb-3 flex flex-col gap-1.5">
            {respuestas.map((r, i) => (
              <p key={i} className="text-xs">
                <span className="text-muted-foreground">{r.pregunta}: </span>
                <span className="text-foreground font-medium">{r.respuesta}</span>
              </p>
            ))}
          </div>
        </details>
      )}

      {/* Hilo del chat */}
      <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-3">
        {chat.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin mensajes en esta conversación.</p>
        ) : (
          chat.map((m) => <Burbuja key={m.id} m={m} />)
        )}
        <div ref={finRef} />
      </div>

      {/* Quién maneja la conversación + botón para devolvérsela al bot */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${botPausado ? "text-emerald-600" : "text-muted-foreground"}`}>
          {botPausado ? (
            <><Headset className="w-3.5 h-3.5" /> La estás atendiendo vos (el bot está en pausa)</>
          ) : (
            <><Bot className="w-3.5 h-3.5" /> La atiende el bot</>
          )}
        </span>
        {botPausado && (
          <Boton variante="secundario" tamano="sm" onClick={devolver}>
            <RotateCcw className="w-3.5 h-3.5" /> Devolver al bot
          </Boton>
        )}
      </div>

      {/* Aviso de la ventana de 24 h de WhatsApp */}
      {!ventanaAbierta && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          La ventana de 24 h de WhatsApp está cerrada: no se puede escribir hasta que el cliente vuelva a mandar un mensaje.
        </p>
      )}

      {/* Composer */}
      <form onSubmit={enviar} className="flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(e);
            }
          }}
          rows={2}
          maxLength={MAX_TEXTO}
          disabled={!ventanaAbierta || enviando}
          placeholder={ventanaAbierta ? "Escribí tu respuesta… (Enter envía, Shift+Enter nueva línea)" : "Ventana cerrada"}
          className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        />
        <Boton type="submit" disabled={!ventanaAbierta || !texto.trim()} cargando={enviando}>
          <Send className="w-4 h-4" /> Enviar
        </Boton>
      </form>
      {accionError && <p className="text-xs text-destructive">{accionError}</p>}
    </div>
  );
}
