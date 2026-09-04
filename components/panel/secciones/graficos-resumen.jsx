"use client";

// Gráficos del resumen (recharts). Se aísla en su propio módulo para poder
// cargarlo de forma diferida con next/dynamic y mantener recharts fuera del
// bundle inicial del panel.
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Tarjeta, TarjetaEncabezado } from "../ui/tarjeta";

const TOOLTIP = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--foreground)",
  fontSize: 12,
};

// Ranking de autos: lista con barra proporcional y conteo. La usan las dos
// tarjetas de abajo, que miden cosas distintas sobre el mismo formato.
function RankingAutos({ items, vacio, barra = "bg-chart-2" }) {
  const maxTotal = items.reduce((m, a) => Math.max(m, a.total), 0);
  if (items.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{vacio}</p>
      </div>
    );
  }
  return (
    <ol className="space-y-3.5">
      {items.map((a, i) => {
        const pct = maxTotal ? Math.round((a.total / maxTotal) * 100) : 0;
        return (
          <li key={a.nombre} className="flex items-center gap-3">
            <span
              className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold tabular-nums ${
                i === 0 ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-sm font-medium text-foreground truncate">{a.nombre}</span>
                <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">{a.total}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barra}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function GraficosResumen({ datosClasif, topAutos, topVistas, colores }) {
  return (
    <>
      {/* Donut clasificación — color reservado al significado (caliente/tibio/frío) */}
      <Tarjeta>
        <TarjetaEncabezado titulo="Clasificación de consultas" />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datosClasif} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                {datosClasif.map((d) => (
                  <Cell key={d.key} fill={colores[d.key]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {datosClasif.map((d) => (
            <span key={d.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: colores[d.key] }} />
              {d.name} ({d.value})
            </span>
          ))}
        </div>
      </Tarjeta>

      {/* Autos más consultados: leads que ESCRIBIERON por WhatsApp. */}
      <Tarjeta>
        <TarjetaEncabezado titulo="Autos más consultados" />
        <RankingAutos items={topAutos} vacio="Todavía no hay consultas con auto." />
      </Tarjeta>

      {/* Vehículos más vistos: visitas a la ficha del catálogo. Mide otra cosa
          que la tarjeta de al lado —mirar es gratis, escribir cuesta— y siempre
          va a dar bastante más alto. No incluye las visitas del staff. */}
      <Tarjeta>
        <TarjetaEncabezado titulo="Más vistos en la web" />
        <RankingAutos items={topVistas} vacio="Todavía no hay visitas a fichas." barra="bg-chart-4" />
      </Tarjeta>

    </>
  );
}
