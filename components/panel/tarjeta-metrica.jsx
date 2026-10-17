"use client";

import { combinadorClases as cn } from "@/lib/utilidades";

// Tarjeta KPI minimalista mono: chip neutro para el ícono, número en tabular-nums,
// hover sutil. El color del ícono se reserva para métricas con significado.
export function TarjetaMetrica({ titulo, valor, subtitulo, icon: Icon, color = "text-muted-foreground", delay = 0 }) {
  return (
    <div
      className="group bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-sm)] hover:border-foreground/20 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${delay * 60}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="min-w-0 text-xs text-muted-foreground font-medium uppercase tracking-wide">{titulo}</span>
        <div className="w-8 h-8 shrink-0 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className={cn("w-4 h-4", color)} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight tabular-nums">{valor}</span>
        {subtitulo ? <span className="text-sm font-medium mb-1 text-muted-foreground">{subtitulo}</span> : null}
      </div>
    </div>
  );
}
