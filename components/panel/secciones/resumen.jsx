"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Users, Flame, Thermometer, Snowflake, Tag, MessageSquare } from "lucide-react";
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

  // Todo sale del resumen (agregados calculados en el server), sin la lista completa.
  const datosClasif = [
    { name: "Calientes", key: "CALIENTE", value: resumen?.calientes ?? 0 },
    { name: "Tibios", key: "TIBIO", value: resumen?.tibios ?? 0 },
    { name: "Fríos", key: "FRIO", value: resumen?.frios ?? 0 },
  ];
  const topAutos = resumen?.topAutos ?? [];

  return (
    <div className="space-y-6">
      {/* KPIs generales */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Resumen general</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <TarjetaMetrica titulo="Total clientes" valor={resumen?.total ?? 0} icon={Users} color="text-foreground" delay={0} />
        <TarjetaMetrica titulo="Calientes" valor={resumen?.calientes ?? 0} icon={Flame} color="text-destructive" delay={1} />
        <TarjetaMetrica titulo="Tibios" valor={resumen?.tibios ?? 0} icon={Thermometer} color="text-warning" delay={2} />
        <TarjetaMetrica titulo="Fríos" valor={resumen?.frios ?? 0} icon={Snowflake} color="text-chart-1" delay={3} />
        <TarjetaMetrica titulo="Quieren vender" valor={metricas?.ventasTotal ?? resumen?.ventas ?? 0} icon={Tag} color="text-chart-5" delay={4} />
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
        <GraficosResumen datosClasif={datosClasif} topAutos={topAutos} colores={COLORES} />
      </div>
    </div>
  );
}
