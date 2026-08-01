"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { obtenerNombreCompletoVehiculo, formatearPrecio } from "@/lib/vehiculos";
import { usarEnVista } from "@/hooks/usar-en-vista";
import { obtenerUrlWhatsAppBotVehiculo } from "@/lib/constantes";
import { useNombreAgencia } from "@/lib/negocio";

// Dato de ficha técnica: rótulo mono espaciado + valor en mono tabular. Las
// cifras tabulares hacen que año, kms y precio alineen entre tarjetas, así la
// grilla del catálogo se lee en columnas y no como bloques sueltos.
function Dato({ rotulo, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="tipo-rotulo text-muted-foreground">{rotulo}</span>
      <span className="tipo-dato text-sm text-foreground">{children}</span>
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
  const nombreAgencia = useNombreAgencia();

  const abrirBot = () =>
    window.open(obtenerUrlWhatsAppBotVehiculo(vehicle, nombreAgencia), "_blank", "noopener,noreferrer");

  const sinKm = vehicle.condicion === "usado" && vehicle.kms === 0;
  // Beneficios VIGENTES: la API ya filtra descuento/promos vencidos.
  const descuento = vehicle.ahorro > 0 ? vehicle.descuento : null;
  const promos = vehicle.promociones ?? [];
  const tieneBeneficio = Boolean(descuento) || promos.length > 0;

  return (
    <>
      {/* Sin caja: la tarjeta es foto + una regla de un pelo + columna abierta.
          El recuadro con borde, las tres pastillas sobre la foto y los recuadros
          de beneficios sumaban demasiado marco para el contenido que sostienen. */}
      <article
        ref={ref}
        style={{ transitionDelay: `${index * 90}ms` }}
        className={`reveal ${estaVisible ? "visible" : ""} group flex flex-col`}
      >
        {/* Foto → ficha completa del vehículo */}
        <Link
          href={`/catalogo/${vehicle.ref}`}
          className="relative block aspect-4/3 overflow-hidden rounded-lg bg-secondary"
          aria-label={`Ver ${obtenerNombreCompletoVehiculo(vehicle)}`}
        >
          <Image
            src={vehicle.image}
            alt={obtenerNombreCompletoVehiculo(vehicle)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
          {/* Una sola marca: el tipo se ve en la foto y la oferta ya se lee en
              el precio tachado. */}
          {vehicle.condicion === "0km" && (
            <span className="tipo-rotulo absolute left-3 top-3 bg-brand px-2 py-1 text-white">
              0 km
            </span>
          )}
        </Link>

        {/* Regla superior: se pinta de rojo al apuntar la tarjeta. */}
        <span className="relative mt-6 h-px w-full bg-foreground/12" aria-hidden="true">
          <span className="block h-full w-0 bg-brand transition-[width] duration-700 ease-out group-hover:w-full" />
        </span>

        {/* Cuerpo */}
        <div className="flex flex-col flex-1 pt-5">
          <h3 className="tipo-titulo text-lg text-foreground">
            {vehicle.brand} <span className="text-muted-foreground">{vehicle.model}</span>
          </h3>

          {/* Ficha técnica */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Dato rotulo="Año">{vehicle.year}</Dato>
            <Dato rotulo="Kms">{sinKm ? "—" : vehicle.kms.toLocaleString("es-AR")}</Dato>
            <Dato rotulo="Motor">{COMBUSTIBLE[vehicle.combustible] ?? "—"}</Dato>
          </div>

          {/* Beneficios vigentes: descuento del vehículo y/o promociones */}
          {/* Beneficios: una línea por beneficio, marcada por un filete rojo al
              margen. Antes cada uno era un recuadro con borde y relleno propio,
              lo que ponía cajas adentro de una caja. */}
          {tieneBeneficio && (
            <ul className="mt-5 flex flex-col gap-3 border-l-2 border-brand pl-3.5">
              {descuento && (
                <li>
                  <p className="text-sm text-foreground">
                    {descuento.nombre}{" "}
                    <span className="tipo-dato text-brand">{etiquetaDescuento(descuento)}</span>
                  </p>
                  {descuento.fecha_fin && (
                    <p className="tipo-rotulo mt-1 text-muted-foreground">
                      hasta {fechaCorta(descuento.fecha_fin)}
                    </p>
                  )}
                </li>
              )}
              {promos.map((p) => (
                <li key={p.id}>
                  <p className="text-sm text-foreground">
                    {p.nombre}
                    {etiquetaPromo(p) && (
                      <span className="tipo-dato text-brand"> {etiquetaPromo(p)}</span>
                    )}
                  </p>
                  {p.descripcion && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{p.descripcion}</p>
                  )}
                  {p.fecha_fin && (
                    <p className="tipo-rotulo mt-1 text-muted-foreground">
                      hasta {fechaCorta(p.fecha_fin)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Precio + CTA */}
          {/* Precio: se le sacó el rótulo "PRECIO". Una cifra grande con signo
              de peso no necesita que le expliquen qué es. */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            {vehicle.precio > 0 ? (
              descuento ? (
                <div>
                  <span className="tipo-dato block text-xs text-muted-foreground line-through">
                    {formatearPrecio(vehicle.precio)}
                  </span>
                  <p className="tipo-dato mt-1 text-[1.375rem] text-brand">
                    {formatearPrecio(vehicle.precio_final)}
                  </p>
                </div>
              ) : (
                <p className="tipo-dato text-[1.375rem] text-foreground">
                  {formatearPrecio(vehicle.precio)}
                </p>
              )
            ) : (
              <p className="tipo-dato text-[1.375rem] text-muted-foreground">A consultar</p>
            )}
            <button
              type="button"
              onClick={abrirBot}
              className="group/btn inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand transition-colors"
            >
              Consultar
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </article>
    </>
  );
}

export { TarjetaVehiculo };
