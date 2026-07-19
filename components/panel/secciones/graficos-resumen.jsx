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

export default function GraficosResumen({ datosClasif, topAutos, colores }) {
  const maxTotal = topAutos.reduce((m, a) => Math.max(m, a.total), 0);
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

      {/* Ranking top autos — lista con barra proporcional y conteo visible */}
      <Tarjeta className="lg:col-span-2">
        <TarjetaEncabezado titulo="Autos más consultados" />
        {topAutos.length === 0 ? (
          <div className="h-56 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Todavía no hay consultas con auto.</p>
          </div>
        ) : (
          <ol className="space-y-3.5">
            {topAutos.map((a, i) => {
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
                        className="h-full rounded-full bg-chart-2 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Tarjeta>
    </>
  );
}
