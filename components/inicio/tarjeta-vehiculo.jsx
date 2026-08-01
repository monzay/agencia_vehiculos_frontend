"use client";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Gauge, ArrowRight, Car, Bike, Flame, Zap } from "lucide-react";
import { Boton } from "@/components/interfaz/boton";
import { usarEnVista } from "@/hooks/usar-en-vista";
import {
  obtenerNombreCompletoVehiculo,
  formatearPrecio,
  fechaCorta,
  etiquetaDescuento,
  etiquetaPromo,
} from "@/lib/vehiculos";
import { obtenerUrlWhatsAppBotVehiculo } from "@/lib/constantes";
import { useNombreAgencia } from "@/lib/negocio";

// Tarjeta de vehículo del sitio público: con caja —borde, foto a sangre arriba,
// cuerpo con padding y CTA al pie—. La usan la portada y el catálogo, así que
// cualquier cambio se ve en los dos lados.
//
// El "Consultar" abre el BOT de WhatsApp con la REF del vehículo: es lo que
// permite que n8n ate la consulta a este auto. Ojo con cambiarlo por un chat
// directo a un asesor — se pierde el seguimiento del lead.

const COMBUSTIBLE = { gnc: "GNC", diesel: "Diésel", nafta: "Nafta" };

function TarjetaVehiculo({ vehicle, index = 0 }) {
  const { ref, estaVisible } = usarEnVista();
  const nombreAgencia = useNombreAgencia();

  const nombre = obtenerNombreCompletoVehiculo(vehicle);
  const sinKms = vehicle.condicion === "usado" && vehicle.kms === 0;
  // La API ya descarta los descuentos y promos vencidos: lo que llega, rige.
  const descuento = vehicle.ahorro > 0 ? vehicle.descuento : null;
  const promos = vehicle.promociones ?? [];
  const tieneBeneficio = Boolean(descuento) || promos.length > 0;

  const abrirBot = () =>
    window.open(obtenerUrlWhatsAppBotVehiculo(vehicle, nombreAgencia), "_blank", "noopener,noreferrer");

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      className={`group relative transition-all duration-700 ${
        estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      <div className="relative flex h-full flex-col border border-foreground/10 bg-card overflow-hidden hover:border-foreground/30 transition-all duration-500">
        <Link
          href={`/catalogo/${vehicle.ref}`}
          className="relative block aspect-4/3 overflow-hidden"
          aria-label={`Ver ${nombre}`}
        >
          <Image
            src={vehicle.image}
            alt={nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            {vehicle.condicion === "0km" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand text-white tracking-wide">
                0 km
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-background/80 backdrop-blur-sm text-foreground">
              {vehicle.tipo === "moto" ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
              {vehicle.tipo === "moto" ? "Moto" : "Auto"}
            </span>
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-display mb-3 sm:mb-4 group-hover:translate-x-1 transition-transform duration-300">
            {nombre}
          </h3>

          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            {!sinKms && (
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {vehicle.kms.toLocaleString("es-AR")} km
              </span>
            )}
            <span className="flex items-center gap-1 sm:gap-1.5">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {vehicle.year}
            </span>
            {vehicle.combustible && (
              <span
                className={`flex items-center gap-1 sm:gap-1.5 font-medium ${
                  vehicle.combustible === "gnc" ? "text-brand" : ""
                }`}
              >
                {vehicle.combustible === "gnc" ? (
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                {COMBUSTIBLE[vehicle.combustible]}
              </span>
            )}
          </div>

          {/* Beneficios vigentes: una línea por beneficio, marcada por el filete
              rojo al margen —el mismo hilo que recorre la portada—. Sin caja
              propia: adentro de la tarjeta ya hay una. */}
          {tieneBeneficio && (
            <ul className="mb-5 flex flex-col gap-2.5 border-l border-brand pl-3">
              {descuento && (
                <li>
                  <p className="text-sm text-foreground">
                    {descuento.nombre}{" "}
                    <span className="font-medium text-brand">{etiquetaDescuento(descuento)}</span>
                  </p>
                  {descuento.fecha_fin && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      hasta {fechaCorta(descuento.fecha_fin)}
                    </p>
                  )}
                </li>
              )}
              {promos.map((promo) => (
                <li key={promo.id}>
                  <p className="text-sm text-foreground">
                    {promo.nombre}
                    {etiquetaPromo(promo) && (
                      <span className="font-medium text-brand"> {etiquetaPromo(promo)}</span>
                    )}
                  </p>
                  {promo.descripcion && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {promo.descripcion}
                    </p>
                  )}
                  {promo.fecha_fin && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      hasta {fechaCorta(promo.fecha_fin)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Precio: el tachado solo aparece si hay descuento vigente. */}
          <div className="mt-auto mb-4 sm:mb-5">
            {vehicle.precio > 0 ? (
              descuento ? (
                <>
                  <span className="block text-xs text-muted-foreground line-through">
                    {formatearPrecio(vehicle.precio)}
                  </span>
                  <p className="text-xl sm:text-2xl font-display text-brand">
                    {formatearPrecio(vehicle.precio_final)}
                  </p>
                </>
              ) : (
                <p className="text-xl sm:text-2xl font-display text-foreground">
                  {formatearPrecio(vehicle.precio)}
                </p>
              )
            ) : (
              <p className="text-xl sm:text-2xl font-display text-muted-foreground">A consultar</p>
            )}
          </div>

          <Boton
            onClick={abrirBot}
            className="w-full rounded-full text-xs sm:text-sm h-9 sm:h-10 bg-brand text-white hover:bg-white hover:text-brand transition-all duration-300 group/btn border-0 hover:border hover:border-brand"
          >
            Consultar
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transition-transform group-hover/btn:translate-x-1" />
          </Boton>
        </div>
      </div>
    </div>
  );
}

export { TarjetaVehiculo };
