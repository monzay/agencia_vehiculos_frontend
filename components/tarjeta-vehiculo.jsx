"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgePercent, Gift } from "lucide-react";
import { obtenerNombreCompletoVehiculo, formatearPrecio } from "@/lib/vehiculos";
import { usarEnVista } from "@/hooks/usar-en-vista";
import { obtenerUrlWhatsAppBotVehiculo } from "@/lib/constantes";

// Etiqueta de dato tipo "ficha técnica" (odómetro): rótulo mono + valor.
function Dato({ rotulo, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70 uppercase">{rotulo}</span>
      <span className="font-mono text-sm text-foreground tabular-nums">{children}</span>
    </div>
  );
}

const COMBUSTIBLE = { gnc: "GNC", diesel: "Diésel", nafta: "Nafta" };

// "DD/MM" para la vigencia del beneficio (fechas vienen etiquetadas UTC).
function fechaCorta(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}
// Etiqueta del descuento directo del vehículo ({ tipo, valor }).
function etiquetaDescuento(d) {
  return d.tipo === "monto" ? `-${formatearPrecio(d.valor)}` : `-${d.valor}%`;
}
// Etiqueta del descuento de una promo ({ descuento, descuento_tipo }); "" si no lleva.
function etiquetaPromo(p) {
  if (p.descuento == null) return "";
  return p.descuento_tipo === "monto" ? `-${formatearPrecio(p.descuento)}` : `-${p.descuento}%`;
}

function TarjetaVehiculo({ vehicle, index = 0 }) {
  const { ref, estaVisible } = usarEnVista();

  const abrirBot = () =>
    window.open(obtenerUrlWhatsAppBotVehiculo(vehicle), "_blank", "noopener,noreferrer");

  const sinKm = vehicle.condicion === "usado" && vehicle.kms === 0;
  // Beneficios VIGENTES: la API ya filtra descuento/promos vencidos.
  const descuento = vehicle.ahorro > 0 ? vehicle.descuento : null;
  const promos = vehicle.promociones ?? [];
  const tieneBeneficio = Boolean(descuento) || promos.length > 0;

  return (
    <>
      <article
        ref={ref}
        style={{ transitionDelay: `${index * 90}ms` }}
        className={`reveal ${estaVisible ? "visible" : ""} group flex flex-col bg-card border border-foreground/12 hover:border-foreground/40 transition-colors duration-500`}
      >
        {/* Foto → ficha completa del vehículo */}
        <Link
          href={`/catalogo/${vehicle.ref}`}
          className="relative block aspect-4/3 overflow-hidden bg-secondary"
          aria-label={`Ver ${obtenerNombreCompletoVehiculo(vehicle)}`}
        >
          <Image
            src={vehicle.image}
            alt={obtenerNombreCompletoVehiculo(vehicle)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {vehicle.condicion === "0km" && (
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase bg-brand text-white px-2 py-1">
                0 km
              </span>
            )}
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase bg-background/85 backdrop-blur-sm text-foreground px-2 py-1">
              {vehicle.tipo === "moto" ? "Moto" : "Auto"}
            </span>
          </div>
          {tieneBeneficio && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] uppercase bg-brand text-white px-2 py-1">
              <BadgePercent className="w-3 h-3" /> Oferta
            </span>
          )}
        </Link>

        {/* Cuerpo */}
        <div className="flex flex-col flex-1 p-5 lg:p-6">
          <h3 className="text-lg lg:text-xl font-semibold uppercase tracking-tight leading-tight text-foreground">
            {vehicle.brand} <span className="text-muted-foreground">{vehicle.model}</span>
          </h3>

          {/* Ficha técnica */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-y border-foreground/10 py-4">
            <Dato rotulo="Año">{vehicle.year}</Dato>
            <Dato rotulo="Kms">{sinKm ? "—" : vehicle.kms.toLocaleString("es-AR")}</Dato>
            <Dato rotulo="Motor">{COMBUSTIBLE[vehicle.combustible] ?? "—"}</Dato>
          </div>

          {/* Beneficios vigentes: descuento del vehículo y/o promociones */}
          {tieneBeneficio && (
            <div className="mt-4 flex flex-col gap-2">
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
                    {p.descripcion && <p className="text-xs text-muted-foreground line-clamp-2">{p.descripcion}</p>}
                    {p.fecha_fin && (
                      <p className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Válido hasta {fechaCorta(p.fecha_fin)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Precio + CTA */}
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 block mb-1">Precio</span>
              {vehicle.precio > 0 ? (
                descuento ? (
                  <div>
                    <span className="block font-mono text-sm text-muted-foreground line-through tabular-nums">
                      {formatearPrecio(vehicle.precio)}
                    </span>
                    <p className="text-xl lg:text-2xl font-semibold tabular-nums text-brand">
                      {formatearPrecio(vehicle.precio_final)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xl lg:text-2xl font-semibold tabular-nums text-foreground">
                    {formatearPrecio(vehicle.precio)}
                  </p>
                )
              ) : (
                <p className="text-base font-medium text-muted-foreground">A consultar</p>
              )}
            </div>
            <button
              type="button"
              onClick={abrirBot}
              className="group/btn inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.14em] uppercase text-foreground hover:text-brand transition-colors"
            >
              Consultar
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* Filete rojo inferior que crece en hover (acento de marca) */}
        <span className="h-0.5 w-0 bg-brand transition-all duration-500 group-hover:w-full" aria-hidden="true" />
      </article>
    </>
  );
}

export { TarjetaVehiculo };
