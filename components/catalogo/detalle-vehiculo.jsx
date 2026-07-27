"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, BadgePercent, Gift,
  Calendar, Gauge, Fuel, Car, Bike, Package,
} from "lucide-react";
import { obtenerNombreCompletoVehiculo, formatearPrecio } from "@/lib/vehiculos";
import { obtenerUrlWhatsAppBotVehiculo } from "@/lib/constantes";
import { useNombreAgencia } from "@/lib/negocio";
import { obtenerVehiculo } from "@/lib/api";

const COMBUSTIBLE = { gnc: "GNC", diesel: "Diésel", nafta: "Nafta" };

function fechaCorta(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}
function etiquetaDescuento(d) {
  return d.tipo === "monto" ? `-${formatearPrecio(d.valor)}` : `-${d.valor}%`;
}
function etiquetaPromo(p) {
  if (p.descuento == null) return "";
  return p.descuento_tipo === "monto" ? `-${formatearPrecio(p.descuento)}` : `-${p.descuento}%`;
}

// Rótulo mono + valor, estilo "ficha técnica".
function Especificacion({ icon: Icon, rotulo, children }) {
  return (
    <div className="flex items-start gap-3 border border-foreground/10 bg-card px-4 py-3">
      <Icon className="w-4 h-4 text-brand shrink-0 mt-1" aria-hidden="true" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70 uppercase">{rotulo}</span>
        <span className="text-sm font-medium text-foreground tabular-nums truncate">{children}</span>
      </div>
    </div>
  );
}

function DetalleVehiculo({ refVehiculo }) {
  const [vehiculo, setVehiculo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [fotoActiva, setFotoActiva] = useState(0);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    obtenerVehiculo(refVehiculo)
      .then((data) => { if (activo) setVehiculo(data); })
      .catch((e) => { if (activo) setError(e.message); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [refVehiculo]);

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] uppercase text-muted-foreground hover:text-brand transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>

        {cargando && (
          <div className="py-32 text-center">
            <p className="font-mono text-sm tracking-wider uppercase text-muted-foreground animate-pulse">Cargando vehículo…</p>
          </div>
        )}

        {!cargando && (error || !vehiculo) && (
          <div className="py-24 text-center">
            <p className="text-2xl font-semibold text-foreground mb-2">Vehículo no encontrado</p>
            <p className="text-sm text-muted-foreground mb-8">
              Puede que ya se haya vendido o que el enlace no sea válido.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] uppercase bg-brand text-white px-5 py-3 hover:opacity-90 transition-opacity"
            >
              Ver catálogo <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!cargando && !error && vehiculo && (
          <DetalleContenido
            vehiculo={vehiculo}
            fotoActiva={fotoActiva}
            setFotoActiva={setFotoActiva}
          />
        )}
      </div>
    </section>
  );
}

function DetalleContenido({ vehiculo, fotoActiva, setFotoActiva }) {
  const fotos = vehiculo.imagenes?.length ? vehiculo.imagenes : [vehiculo.image];
  const sinKm = vehiculo.condicion === "usado" && vehiculo.kms === 0;
  const descuento = vehiculo.ahorro > 0 ? vehiculo.descuento : null;
  const promos = vehiculo.promociones ?? [];
  const nombreAgencia = useNombreAgencia();

  const abrirBot = () =>
    window.open(obtenerUrlWhatsAppBotVehiculo(vehiculo, nombreAgencia), "_blank", "noopener,noreferrer");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
      {/* ── Galería ── */}
      <div className="flex flex-col gap-3">
        <div className="relative aspect-4/3 overflow-hidden bg-secondary border border-foreground/12">
          <Image
            src={fotos[fotoActiva] ?? "/placeholder.svg"}
            alt={obtenerNombreCompletoVehiculo(vehiculo)}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {vehiculo.condicion === "0km" && (
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase bg-brand text-white px-2 py-1">0 km</span>
            )}
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase bg-background/85 backdrop-blur-sm text-foreground px-2 py-1">
              {vehiculo.tipo === "moto" ? "Moto" : "Auto"}
            </span>
          </div>
        </div>

        {fotos.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {fotos.map((foto, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFotoActiva(i)}
                className={`relative aspect-4/3 overflow-hidden bg-secondary border transition-colors ${
                  i === fotoActiva ? "border-brand" : "border-foreground/12 hover:border-foreground/40"
                }`}
                aria-label={`Ver foto ${i + 1}`}
              >
                <Image src={foto} alt="" fill sizes="15vw" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col">
        <h1 className="text-3xl lg:text-4xl font-semibold uppercase tracking-tight leading-tight text-foreground">
          {vehiculo.brand} <span className="text-muted-foreground">{vehiculo.model}</span>
        </h1>

        {/* Ficha técnica */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Especificacion icon={Calendar} rotulo="Año">{vehiculo.year}</Especificacion>
          <Especificacion icon={Gauge} rotulo="Kilómetros">
            {sinKm ? "0 km" : `${vehiculo.kms.toLocaleString("es-AR")} km`}
          </Especificacion>
          <Especificacion icon={Fuel} rotulo="Combustible">{COMBUSTIBLE[vehiculo.combustible] ?? "—"}</Especificacion>
          <Especificacion icon={vehiculo.tipo === "moto" ? Bike : Car} rotulo="Condición">
            {vehiculo.condicion === "0km" ? "0 km" : "Usado"}
          </Especificacion>
          {vehiculo.color && (
            <Especificacion icon={Package} rotulo="Color">{vehiculo.color}</Especificacion>
          )}
          <Especificacion icon={Package} rotulo="Stock">
            {vehiculo.stock > 0 ? `${vehiculo.stock} unidad${vehiculo.stock > 1 ? "es" : ""}` : "Consultar"}
          </Especificacion>
        </div>

        {/* Beneficios vigentes */}
        {(descuento || promos.length > 0) && (
          <div className="mt-5 flex flex-col gap-2">
            {descuento && (
              <div className="flex items-start gap-2 rounded-md border border-brand/30 bg-brand/5 px-3 py-2">
                <BadgePercent className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {descuento.nombre} <span className="text-brand font-semibold">{etiquetaDescuento(descuento)}</span>
                  </p>
                  {descuento.fecha_fin && (
                    <p className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Válido hasta {fechaCorta(descuento.fecha_fin)}</p>
                  )}
                </div>
              </div>
            )}
            {promos.map((p) => (
              <div key={p.id} className="flex items-start gap-2 rounded-md border border-foreground/12 bg-secondary/40 px-3 py-2">
                <Gift className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {p.nombre}
                    {etiquetaPromo(p) && <span className="text-brand font-semibold"> {etiquetaPromo(p)}</span>}
                  </p>
                  {p.descripcion && <p className="text-xs text-muted-foreground">{p.descripcion}</p>}
                  {p.fecha_fin && (
                    <p className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Válido hasta {fechaCorta(p.fecha_fin)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Descripción */}
        {vehiculo.descripcion && (
          <div className="mt-6 border-t border-foreground/10 pt-5">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 block mb-2">Descripción</span>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{vehiculo.descripcion}</p>
          </div>
        )}

        {/* Precio + CTA */}
        <div className="mt-auto pt-8">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 block mb-1">Precio</span>
          {vehiculo.precio > 0 ? (
            descuento ? (
              <div className="mb-5">
                <span className="block font-mono text-sm text-muted-foreground line-through tabular-nums">{formatearPrecio(vehiculo.precio)}</span>
                <p className="text-3xl lg:text-4xl font-semibold tabular-nums text-brand">{formatearPrecio(vehiculo.precio_final)}</p>
                <p className="font-mono text-[10px] tracking-wider uppercase text-brand mt-1">Ahorrás {formatearPrecio(vehiculo.ahorro)}</p>
              </div>
            ) : (
              <p className="text-3xl lg:text-4xl font-semibold tabular-nums text-foreground mb-5">{formatearPrecio(vehiculo.precio)}</p>
            )
          ) : (
            <p className="text-xl font-medium text-muted-foreground mb-5">A consultar</p>
          )}

          <button
            type="button"
            onClick={abrirBot}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono text-sm tracking-[0.14em] uppercase bg-brand text-white px-8 py-4 hover:opacity-90 transition-opacity"
          >
            Consultar por WhatsApp
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { DetalleVehiculo };
