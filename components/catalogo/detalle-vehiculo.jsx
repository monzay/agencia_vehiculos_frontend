"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Gauge, Fuel, Car, Bike, Package } from "lucide-react";
import { Boton } from "@/components/interfaz/boton";
import {
  obtenerNombreCompletoVehiculo,
  formatearPrecio,
  fechaCorta,
  etiquetaDescuento,
  etiquetaPromo,
} from "@/lib/vehiculos";
import { obtenerUrlWhatsAppBotVehiculo } from "@/lib/constantes";
import { useNombreAgencia } from "@/lib/negocio";
import { obtenerVehiculo } from "@/lib/api";

const COMBUSTIBLE = { gnc: "GNC", diesel: "Diésel", nafta: "Nafta" };

// Fila de ficha técnica: regla superior, icono rojo, rótulo mono y valor. Es la
// misma pieza que usa la sección de contacto de la portada.
function Especificacion({ icon: Icon, rotulo, children }) {
  return (
    <div className="flex items-start gap-3 border-t border-border pt-4">
      <Icon className="mt-0.5 w-4 h-4 text-brand shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
          {rotulo}
        </span>
        <span className="text-sm text-foreground truncate">{children}</span>
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
          className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>

        {/* Mientras carga se reservan los dos huecos del layout, como en la
            grilla de la portada: la página no salta cuando llegan los datos. */}
        {cargando && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
            <div className="aspect-4/3 animate-pulse bg-secondary" />
            <div className="h-96 animate-pulse bg-secondary" />
          </div>
        )}

        {!cargando && (error || !vehiculo) && (
          <div className="py-24 text-center">
            <p className="text-3xl lg:text-4xl font-display tracking-tight mb-3">
              Vehículo no encontrado
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Puede que ya se haya vendido o que el enlace no sea válido.
            </p>
            <Boton
              size="lg"
              className="rounded-full px-8 h-12 text-sm bg-brand text-white hover:bg-white hover:text-brand border-0 hover:border hover:border-brand transition-all duration-300"
              asChild
            >
              <Link href="/catalogo">
                Ver catálogo <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Boton>
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
        <div className="relative aspect-4/3 overflow-hidden bg-secondary border border-foreground/10">
          <Image
            src={fotos[fotoActiva] ?? "/placeholder.svg"}
            alt={obtenerNombreCompletoVehiculo(vehiculo)}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          {/* Mismas pastillas que la tarjeta del catálogo. */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {vehiculo.condicion === "0km" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand text-white tracking-wide">
                0 km
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-background/80 backdrop-blur-sm text-foreground">
              {vehiculo.tipo === "moto" ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
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
                  i === fotoActiva ? "border-brand" : "border-foreground/10 hover:border-foreground/30"
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
        <h1 className="text-4xl lg:text-5xl font-display tracking-tight text-foreground">
          {vehiculo.brand} <span className="text-muted-foreground">{vehiculo.model}</span>
        </h1>

        {/* Ficha técnica */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
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

        {/* Beneficios vigentes: filete rojo al margen, una línea por beneficio.
            Es el mismo gesto que en la tarjeta del catálogo. */}
        {(descuento || promos.length > 0) && (
          <ul className="mt-8 flex flex-col gap-3 border-l border-brand pl-4">
            {descuento && (
              <li>
                <p className="text-sm text-foreground">
                  {descuento.nombre}{" "}
                  <span className="font-medium text-brand">{etiquetaDescuento(descuento)}</span>
                </p>
                {descuento.fecha_fin && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    válido hasta {fechaCorta(descuento.fecha_fin)}
                  </p>
                )}
              </li>
            )}
            {promos.map((p) => (
              <li key={p.id}>
                <p className="text-sm text-foreground">
                  {p.nombre}
                  {etiquetaPromo(p) && <span className="font-medium text-brand"> {etiquetaPromo(p)}</span>}
                </p>
                {p.descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{p.descripcion}</p>}
                {p.fecha_fin && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    válido hasta {fechaCorta(p.fecha_fin)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Descripción */}
        {vehiculo.descripcion && (
          <div className="mt-8 border-t border-border pt-5">
            <span className="block mb-2 font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
              Descripción
            </span>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{vehiculo.descripcion}</p>
          </div>
        )}

        {/* Precio + CTA */}
        <div className="mt-auto pt-10">
          <span className="block mb-2 font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
            Precio
          </span>
          {vehiculo.precio > 0 ? (
            descuento ? (
              <div className="mb-6">
                <span className="block text-sm text-muted-foreground line-through">
                  {formatearPrecio(vehiculo.precio)}
                </span>
                <p className="text-4xl lg:text-5xl font-display tracking-tight text-brand">
                  {formatearPrecio(vehiculo.precio_final)}
                </p>
                <p className="mt-1 text-xs text-brand">Ahorrás {formatearPrecio(vehiculo.ahorro)}</p>
              </div>
            ) : (
              <p className="mb-6 text-4xl lg:text-5xl font-display tracking-tight text-foreground">
                {formatearPrecio(vehiculo.precio)}
              </p>
            )
          ) : (
            <p className="mb-6 text-2xl font-display text-muted-foreground">A consultar</p>
          )}

          <Boton
            size="lg"
            onClick={abrirBot}
            className="w-full sm:w-auto rounded-full px-10 h-14 text-sm sm:text-base bg-brand text-white hover:bg-white hover:text-brand border-0 hover:border hover:border-brand transition-all duration-300 group/btn"
          >
            Consultar por WhatsApp
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
          </Boton>
        </div>
      </div>
    </div>
  );
}

export { DetalleVehiculo };
