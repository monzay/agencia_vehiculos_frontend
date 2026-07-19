"use client";

import { useState } from "react";
import {
  Search, Loader2, HandCoins, CalendarClock, CalendarCheck, Wallet,
  CheckCircle2, Circle, ListChecks, AlertCircle,
} from "lucide-react";
import { consultarFinanciacionPorDni } from "@/lib/api";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

function fechaCorta(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PaginaConsultaFinanciacion() {
  const [dni, setDni] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null); // null = sin buscar; [] = sin resultados

  async function consultar(e) {
    e.preventDefault();
    const valor = dni.trim();
    if (!valor) {
      setError("Ingresá tu número de DNI.");
      return;
    }
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const data = await consultarFinanciacionPorDni(valor);
      setResultado(data || []);
    } catch (err) {
      setError(err.message || "No se pudo consultar la financiación.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="panel-dark min-h-screen bg-background text-foreground px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <HandCoins className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Consultá tu financiación</h1>
          <p className="text-sm text-muted-foreground">Ingresá tu DNI para ver tus cuotas y próximos pagos</p>
        </div>

        {/* Buscador */}
        <form onSubmit={consultar} className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xl">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Número de DNI</label>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              autoFocus
              placeholder="Ej: 30111222"
              className="flex-1 h-11 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent"
            />
            <button
              type="submit"
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Consultar
            </button>
          </div>

          {error && (
            <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </form>

        {/* Sin resultados */}
        {resultado?.length === 0 && (
          <div className="mt-6 bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No encontramos financiaciones asociadas a ese DNI. Verificá el número o consultá con tu asesor.
          </div>
        )}

        {/* Resultados */}
        {resultado?.length > 0 && (
          <div className="mt-6 space-y-6">
            {resultado.map((f, i) => (
              <FinanciacionCard key={i} f={f} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function FinanciacionCard({ f }) {
  return (
    <section className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
      {/* Cabecera de la financiación */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-foreground">{f.nombre || "Cliente"}</p>
          <p className="text-xs text-muted-foreground">Alta: {fechaCorta(f.creado)}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            f.completada
              ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
              : "text-sky-500 border-sky-500/30 bg-sky-500/10"
          }`}
        >
          {f.completada ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ListChecks className="w-3.5 h-3.5" />}
          {f.completada ? "Plan completado" : `${f.cuotasPagadas}/${f.cantidadCuotas} cuotas pagas`}
        </span>
      </div>

      {/* Datos destacados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
        <Dato icono={Wallet} etiqueta="Valor por cuota" valor={money.format(f.precioCuota)} />
        <Dato
          icono={CalendarClock}
          etiqueta="Próxima cuota"
          valor={f.proximaCuota ? fechaCorta(f.proximaCuota.vencimiento) : "Sin pendientes"}
          sub={f.proximaCuota ? `Cuota ${f.proximaCuota.numero}` : null}
        />
        <Dato icono={CalendarCheck} etiqueta="Finaliza" valor={fechaCorta(f.fechaFin)} />
        <Dato icono={HandCoins} etiqueta="Saldo restante" valor={money.format(f.saldo)} />
      </div>

      {/* Cronograma de cuotas */}
      <div className="p-5">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Detalle de cuotas · Día {f.diaPago} de cada mes
        </p>
        <ul className="space-y-1.5">
          {f.cronograma?.map((cuota) => (
            <li
              key={cuota.numero}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                cuota.pagado ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-secondary/40"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {cuota.pagado ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-foreground">Cuota {cuota.numero}</span>
                <span
                  className={`text-[11px] font-semibold ${
                    cuota.pagado ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                >
                  {cuota.pagado ? "Pagada" : "Pendiente"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{fechaCorta(cuota.vencimiento)}</span>
                <span className="tabular-nums text-foreground">{money.format(f.precioCuota)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Dato({ icono: Icono, etiqueta, valor, sub }) {
  return (
    <div className="p-4">
      <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5 mb-1">
        <Icono className="w-3.5 h-3.5" /> {etiqueta}
      </p>
      <p className="text-sm font-semibold text-foreground">{valor}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
