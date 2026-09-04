"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Car, CircleDollarSign, TrendingUp, Wallet, PackageOpen, Loader2 } from "lucide-react";
import { TarjetaMetrica } from "../tarjeta-metrica";
import { obtenerContabilidad } from "@/lib/api";

// recharts solo se usa en el gráfico: se carga diferido, igual que en Resumen.
const GraficoContabilidad = dynamic(() => import("./grafico-contabilidad"), {
  ssr: false,
  loading: () => (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="h-72 animate-pulse rounded-lg bg-secondary" />
    </div>
  ),
});

function precioARS(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

// Variación contra el mes anterior. `null` = el mes previo fue 0, así que no hay
// porcentaje que mostrar (dividir por cero no es "subió 100%").
function Variacion({ valor }) {
  if (valor == null) return <span className="text-xs text-muted-foreground">sin base previa</span>;
  const sube = valor >= 0;
  return (
    <span className={`text-xs font-medium ${sube ? "text-emerald-500" : "text-destructive"}`}>
      {sube ? "▲" : "▼"} {Math.abs(valor).toFixed(0)}% vs. mes anterior
    </span>
  );
}

export function SeccionContabilidad() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerContabilidad().then(setDatos).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!datos) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando contabilidad…
      </div>
    );
  }

  const { mes, comparacion, historico } = datos;

  return (
    <div className="space-y-6">
      {/* Aviso, no adorno: una venta sin costo cargado aporta 0 a la ganancia,
          así que el número de abajo estaría corto y hay que poder explicarlo. */}
      {mes.sinCosto > 0 && (
        <p className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
          {mes.sinCosto}{" "}
          {mes.sinCosto === 1
            ? "vehículo vendido este mes no tiene costo de compra cargado: suma"
            : "vehículos vendidos este mes no tienen costo de compra cargado: suman"}{" "}
          facturación pero 0 de ganancia.
        </p>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Este mes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <TarjetaMetrica titulo="Ingresaron" valor={mes.ingresados} icon={PackageOpen} color="text-foreground" delay={0} />
          <TarjetaMetrica titulo="Vendidos" valor={mes.vendidos} icon={CircleDollarSign} color="text-emerald-500" delay={1} />
          <TarjetaMetrica titulo="Facturado" valor={precioARS(mes.facturado)} icon={Wallet} color="text-foreground" delay={2} />
          <TarjetaMetrica titulo="Ganancia neta" valor={precioARS(mes.ganancia)} icon={TrendingUp} color="text-chart-2" delay={3} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2 px-1">
          <Variacion valor={comparacion.ingresados} />
          <Variacion valor={comparacion.vendidos} />
          <Variacion valor={comparacion.facturado} />
          <Variacion valor={comparacion.ganancia} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Histórico</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <TarjetaMetrica titulo="Ingresaron" valor={historico.ingresados} icon={PackageOpen} color="text-foreground" delay={0} />
          <TarjetaMetrica titulo="En stock" valor={historico.enStock} icon={Car} color="text-foreground" delay={1} />
          <TarjetaMetrica titulo="Vendidos" valor={historico.vendidos} icon={CircleDollarSign} color="text-emerald-500" delay={2} />
          <TarjetaMetrica titulo="Ganancia total" valor={precioARS(historico.ganancia)} icon={TrendingUp} color="text-chart-2" delay={3} />
        </div>
      </div>

      <GraficoContabilidad serie={datos.serie} />
    </div>
  );
}
