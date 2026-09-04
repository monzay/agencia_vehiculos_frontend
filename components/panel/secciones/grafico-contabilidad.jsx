"use client";

// Gráfico de la sección Contabilidad (recharts). Módulo aparte para cargarlo
// diferido y no meter recharts en el bundle inicial del panel.
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Tarjeta, TarjetaEncabezado } from "../ui/tarjeta";

const TOOLTIP = {
  background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10,
  color: "var(--foreground)", fontSize: 12,
};
const PERIODOS = [
  { k: "dia", l: "Día" }, { k: "semana", l: "Semana" }, { k: "mes", l: "Mes" }, { k: "anio", l: "Año" },
];

const ars = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n ?? 0);

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

export default function GraficoContabilidad({ serie }) {
  const [periodo, setPeriodo] = useState("mes");
  const datos = serie?.[periodo] ?? [];

  return (
    <>
      {/* Unidades y plata en gráficos separados: comparten el eje temporal pero
          no la escala. Con un solo eje, "3 autos" contra "4.500.000 pesos"
          aplana la línea de unidades hasta volverla ilegible. */}
      <Tarjeta>
        <TarjetaEncabezado titulo="Ingresos y ventas (unidades)">
          <Toggle opciones={PERIODOS} valor={periodo} onCambio={setPeriodo} />
        </TarjetaEncabezado>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip contentStyle={TOOLTIP} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="ingresados" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 3 }} name="Ingresaron" />
            <Line type="monotone" dataKey="vendidos" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} name="Vendidos" />
          </LineChart>
        </ResponsiveContainer>
      </Tarjeta>

      <Tarjeta className="mt-6">
        <TarjetaEncabezado titulo="Facturación y ganancia" />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={ars} width={90} />
            <Tooltip contentStyle={TOOLTIP} formatter={ars} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="facturado" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 3 }} name="Facturado" />
            <Line type="monotone" dataKey="ganancia" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} name="Ganancia neta" />
          </LineChart>
        </ResponsiveContainer>
      </Tarjeta>
    </>
  );
}
