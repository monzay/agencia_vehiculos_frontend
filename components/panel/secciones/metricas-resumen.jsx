"use client";

// Gráficos de métricas del Resumen (recharts). Módulo aparte para cargarlo
// diferido con next/dynamic y mantener recharts fuera del bundle inicial.
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Tarjeta, TarjetaEncabezado } from "../ui/tarjeta";

const TOOLTIP = {
  background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10,
  color: "var(--foreground)", fontSize: 12,
};
const COLORES = { CALIENTE: "var(--destructive)", TIBIO: "var(--warning)", FRIO: "var(--chart-1)" };
const PERIODOS = [{ k: "dia", l: "Día" }, { k: "semana", l: "Semana" }, { k: "mes", l: "Mes" }, { k: "anio", l: "Año" }];
const PERIODOS_TOP = [{ k: "dia", l: "Hoy" }, { k: "semana", l: "Semana" }, { k: "mes", l: "Mes" }];

function Toggle({ opciones, valor, onCambio }) {
  return (
    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-secondary border border-border">
      {opciones.map((o) => (
        <button
          key={o.k}
          onClick={() => onCambio(o.k)}
          className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
            valor === o.k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export default function MetricasResumen({ metricas }) {
  const [pFluc, setPFluc] = useState("dia");
  const [pTop, setPTop] = useState("mes");
  const flucData = metricas.fluctuacion?.[pFluc] || [];
  const top = metricas.topAutos?.[pTop] || [];

  return (
    <>
      {/* Fluctuación en líneas: clientes + consultas (total y por clasificación) */}
      <Tarjeta className="lg:col-span-3">
        <TarjetaEncabezado titulo="Clientes y consultas">
          <Toggle opciones={PERIODOS} valor={pFluc} onCambio={setPFluc} />
        </TarjetaEncabezado>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={flucData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip contentStyle={TOOLTIP} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="clientes" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 3 }} name="Clientes" />
            <Line type="monotone" dataKey="consultas" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 2 }} name="Consultas (total)" />
            <Line type="monotone" dataKey="CALIENTE" stroke={COLORES.CALIENTE} strokeWidth={2} dot={{ r: 2 }} name="Consultas calientes" />
            <Line type="monotone" dataKey="TIBIO" stroke={COLORES.TIBIO} strokeWidth={2} dot={{ r: 2 }} name="Consultas tibias" />
            <Line type="monotone" dataKey="FRIO" stroke={COLORES.FRIO} strokeWidth={2} dot={{ r: 2 }} name="Consultas frías" />
          </LineChart>
        </ResponsiveContainer>
      </Tarjeta>

      {/* Top 3 autos más consultados */}
      <Tarjeta className="lg:col-span-3">
        <TarjetaEncabezado titulo="Top 3 autos más consultados">
          <Toggle opciones={PERIODOS_TOP} valor={pTop} onCambio={setPTop} />
        </TarjetaEncabezado>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Sin consultas en este período.</p>
        ) : (
          <div className="space-y-2">
            {top.map((a, i) => (
              <div key={a.nombre} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground">{i + 1}</span>
                <span className="flex-1 text-sm text-foreground truncate">{a.nombre}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{a.total}</span>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>
    </>
  );
}
