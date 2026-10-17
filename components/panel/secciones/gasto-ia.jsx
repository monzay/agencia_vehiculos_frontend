"use client";

import { Bot, MessageCircle } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";

const dolares = (n) =>
  `US$ ${Number(n ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;

const ESTADOS = {
  normal: { barra: "bg-success", texto: null },
  aviso: { barra: "bg-warning", texto: "Se usó más del {pct}% del tope del mes." },
  tope: {
    barra: "bg-destructive",
    texto: "Se alcanzó el tope del mes: los clientes nuevos reciben un mensaje fijo y quedan marcados para un vendedor.",
  },
};

// Contador del gasto de IA del mes (Claude + Groq) contra el tope que fija el
// proveedor. El admin lo ve pero no lo puede cambiar.
export function GastoIa({ datos }) {
  if (!datos) return null;
  const estado = ESTADOS[datos.estado] ?? ESTADOS.normal;
  const aviso = estado.texto?.replace("{pct}", datos.avisoPorcentaje);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
          <Bot className="w-4 h-4 text-muted-foreground" /> Gasto de IA este mes
        </h3>
        <p className="text-sm tabular-nums text-foreground">
          <span className="font-semibold">{dolares(datos.gastoUsd)}</span>
          <span className="text-muted-foreground"> / {dolares(datos.topeUsd)}</span>
        </p>
      </div>
      <div
        className="h-2 rounded-full bg-secondary overflow-hidden"
        role="progressbar"
        aria-label="Gasto de IA del mes"
        aria-valuenow={Math.min(100, datos.porcentaje)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-[width]", estado.barra)} style={{ width: `${Math.min(100, datos.porcentaje)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {aviso ?? `Quedan ${dolares(datos.restanteUsd)} este mes.`} El contador vuelve a cero el día 1.
      </p>
      <MensajesWhatsApp datos={datos.whatsapp} />
    </div>
  );
}

const numero = (n) => Number(n ?? 0).toLocaleString("es-AR");

// Meta cobra cada mensaje que manda el bot, salvo los primeros 1.000 del mes.
// Es una estimación hecha con lo que guardó el bot; el monto final está en la factura de Meta.
function MensajesWhatsApp({ datos }) {
  if (!datos) return null;
  const pasado = datos.cobrados > 0;
  return (
    <div className="pt-3 border-t border-border space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground" /> WhatsApp este mes
        </h4>
        <p className="text-sm tabular-nums text-foreground">
          <span className="font-semibold">{numero(datos.gratisUsados)}</span>
          <span className="text-muted-foreground"> de {numero(datos.gratisMes)} mensajes gratis usados</span>
        </p>
      </div>
      <div
        className="h-2 rounded-full bg-secondary overflow-hidden"
        role="progressbar"
        aria-label="Mensajes gratis de WhatsApp usados este mes"
        aria-valuenow={datos.porcentajeGratis}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", pasado ? "bg-warning" : "bg-success")}
          style={{ width: `${datos.porcentajeGratis}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {pasado
          ? `Se pasaron los gratis: ${numero(datos.cobrados)} mensajes cobrados ≈ ${dolares(datos.costoEstimadoUsd)} (estimado).`
          : `Quedan ${numero(datos.gratisRestantes)} gratis; después, cada mensaje cuesta ${dolares(datos.precioUsd)}.`}{" "}
        Las reacciones 👍 no cuentan.
      </p>
    </div>
  );
}
