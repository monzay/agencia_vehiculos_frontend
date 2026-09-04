"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Users, Flame, Thermometer, Snowflake, Tag, MessageSquare, Eye } from "lucide-react";
import { TarjetaMetrica } from "../tarjeta-metrica";
import { obtenerMetricas } from "@/lib/api";

const COLORES = { CALIENTE: "var(--destructive)", TIBIO: "var(--warning)", FRIO: "var(--chart-1)" };

// recharts es pesado y solo se usa acá: lo cargamos diferido (fuera del bundle
// inicial del panel). ssr:false porque los gráficos se renderizan en cliente.
const GraficosResumen = dynamic(() => import("./graficos-resumen"), {
  ssr: false,
  loading: () => (
    <>
      <div className="bg-card border border-border rounded-xl p-5"><div className="h-56 animate-pulse rounded-lg bg-secondary" /></div>
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5"><div className="h-56 animate-pulse rounded-lg bg-secondary" /></div>
    </>
  ),
});

const MetricasResumen = dynamic(() => import("./metricas-resumen"), { ssr: false });

export function SeccionResumen({ resumen }) {
  const [metricas, setMetricas] = useState(null);

  useEffect(() => {
    obtenerMetricas().then(setMetricas).catch(() => setMetricas(null));
  }, []);

  // Consultas acumuladas: la serie anual de `fluctuacion` no tiene recorte
  // temporal, así que sumarla da el histórico completo sin pedir nada más.
  const consultas = (metricas?.fluctuacion?.anio ?? []).reduce(
    (a, p) => ({
      total: a.total + (p.consultas ?? 0),
      CALIENTE: a.CALIENTE + (p.CALIENTE ?? 0),
      TIBIO: a.TIBIO + (p.TIBIO ?? 0),
      FRIO: a.FRIO + (p.FRIO ?? 0),
    }),
    { total: 0, CALIENTE: 0, TIBIO: 0, FRIO: 0 }
  );

  const datosClasif = [
    { name: "Calientes", key: "CALIENTE", value: consultas.CALIENTE },
    { name: "Tibias", key: "TIBIO", value: consultas.TIBIO },
    { name: "Frías", key: "FRIO", value: consultas.FRIO },
  ];
  const topAutos = resumen?.topAutos ?? [];

  return (
    <div className="space-y-6">
      {/* KPIs generales */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Resumen general</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <TarjetaMetrica titulo="Total clientes" valor={resumen?.total ?? 0} icon={Users} color="text-foreground" delay={0} />
        <TarjetaMetrica titulo="Consultas calientes" valor={consultas.CALIENTE} icon={Flame} color="text-destructive" delay={1} />
        <TarjetaMetrica titulo="Consultas tibias" valor={consultas.TIBIO} icon={Thermometer} color="text-warning" delay={2} />
        <TarjetaMetrica titulo="Consultas frías" valor={consultas.FRIO} icon={Snowflake} color="text-chart-1" delay={3} />
        <TarjetaMetrica titulo="Quieren vender" valor={metricas?.ventasTotal ?? resumen?.ventas ?? 0} icon={Tag} color="text-chart-5" delay={4} />
        <TarjetaMetrica titulo="Consultas totales" valor={consultas.total} icon={MessageSquare} color="text-foreground" delay={5} />
        <TarjetaMetrica titulo="Visitas totales" valor={metricas?.vistasTotal ?? 0} icon={Eye} color="text-success" delay={6} />
        </div>
      </div>

      {/* Métricas del día */}
      {metricas && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Hoy</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <TarjetaMetrica titulo="Clientes hoy" valor={metricas.hoy.clientes} icon={Users} color="text-foreground" delay={0} />
            <TarjetaMetrica titulo="Consultas hoy" valor={metricas.hoy.consultas} icon={MessageSquare} color="text-foreground" delay={1} />
            <TarjetaMetrica titulo="Calientes hoy" valor={metricas.hoy.calientes} icon={Flame} color="text-destructive" delay={2} />
            <TarjetaMetrica titulo="Tibios hoy" valor={metricas.hoy.tibios} icon={Thermometer} color="text-warning" delay={3} />
            <TarjetaMetrica titulo="Fríos hoy" valor={metricas.hoy.frios} icon={Snowflake} color="text-chart-1" delay={4} />
            <TarjetaMetrica titulo="Quieren vender hoy" valor={metricas.hoy.ventas} icon={Tag} color="text-chart-5" delay={5} />
            <TarjetaMetrica titulo="Visitas hoy" valor={metricas.hoy.vistas ?? 0} icon={Eye} color="text-success" delay={6} />
          </div>
        </div>
      )}

      {/* Tendencias temporales (recharts cargado de forma diferida) */}
      {metricas && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricasResumen metricas={metricas} />
        </div>
      )}

      {/* Distribución y ranking (recharts cargado de forma diferida) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GraficosResumen
          datosClasif={datosClasif}
          topAutos={topAutos}
          topVistas={metricas?.topVistas ?? []}
          colores={COLORES}
        />
      </div>
    </div>
  );
}
