"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { obtenerNombreCompletoVehiculo, formatearPrecio } from "@/lib/vehiculos";
import { obtenerUrlWhatsAppBotVehiculo } from "@/lib/constantes";
import { useNombreAgencia } from "@/lib/negocio";
import { etiquetaCombustible } from "@/lib/combustibles";
import { subida } from "./movimiento";

// "DD/MM" para la vigencia del beneficio (fechas etiquetadas UTC).
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

// La ficha técnica entra como una sola línea de rótulo —"2021 / 48.000 km /
// Nafta"— y no como tres columnas rotuladas. En una grilla de seis unidades,
// tres micro-tablas por tarjeta compiten con el nombre del vehículo, que es lo
// que la persona está buscando.
function lineaTecnica(vehiculo) {
  const sinKms = vehiculo.condicion === "usado" && vehiculo.kms === 0;
  return [
    vehiculo.year,
    sinKms ? null : `${vehiculo.kms.toLocaleString("es-AR")} km`,
    etiquetaCombustible(vehiculo.combustible),
  ]
    .filter(Boolean)
    .join(" / ");
}

// Tarjeta de la portada. Vive dentro de una grilla de filos (gap-px sobre el
// color de línea), así que no lleva borde ni sombra propios: la separación la
// pone la grilla. Lo único que se mueve al apuntarla es la foto.
//
// El rojo aparece únicamente si hay un beneficio vigente. Es la regla de color
// de toda la portada: si algo está en rojo, cuesta menos.
function TarjetaVehiculoHome({ vehiculo, indice }) {
  const nombreAgencia = useNombreAgencia();
  // Beneficios VIGENTES (la API ya filtra los vencidos).
  const descuento = vehiculo.ahorro > 0 ? vehiculo.descuento : null;
  const promos = vehiculo.promociones ?? [];

  return (
    <motion.article variants={subida} className="group flex flex-col bg-[var(--piso)]">
      <Link
        href={`/catalogo/${vehiculo.ref}`}
        aria-label={`Ver ${obtenerNombreCompletoVehiculo(vehiculo)}`}
        className="relative block aspect-[4/3] overflow-hidden bg-[var(--nieve)]"
      >
        <Image
          src={vehiculo.image}
          alt={obtenerNombreCompletoVehiculo(vehiculo)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1200ms] ease-[var(--curva)] group-hover:scale-[1.04]"
        />
        {vehiculo.condicion === "0km" && (
          <span className="rotulo absolute left-4 top-4 bg-[var(--piso)] px-2.5 py-1.5 text-[var(--tinta)]">
            0 km
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex items-start gap-4">
          <span className="rotulo cifra mt-1.5 shrink-0 text-[var(--humo)]/50 transition-colors duration-500 group-hover:text-[var(--tinta)]">
            {String(indice + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="titular text-lg text-[var(--tinta)] md:text-xl">
              {vehiculo.brand} {vehiculo.model}
            </h3>
            {/* La regla crece al apuntar la tarjeta: es el único movimiento
                además del zoom de la foto, y alcanza para señalar el foco. */}
            <span
              className="mt-4 block h-px w-8 bg-[var(--linea)] transition-all duration-700 ease-[var(--curva)] group-hover:w-16"
              aria-hidden="true"
            />
            <p className="rotulo mt-4 text-[var(--humo)]">{lineaTecnica(vehiculo)}</p>
          </div>
        </div>

        {/* Beneficios vigentes: descuento del vehículo y/o promociones. */}
        {(descuento || promos.length > 0) && (
          <ul className="mt-5 flex flex-col gap-1.5 pl-10">
            {descuento && (
              <li className="text-sm text-[var(--humo)]">
                {descuento.nombre}{" "}
                <span className="text-[var(--rojo)]">{etiquetaDescuento(descuento)}</span>
                {descuento.fecha_fin && ` · hasta ${fechaCorta(descuento.fecha_fin)}`}
              </li>
            )}
            {promos.map((p) => (
              <li key={p.id} className="text-sm text-[var(--humo)]">
                {p.nombre}{" "}
                {etiquetaPromo(p) && (
                  <span className="text-[var(--rojo)]">{etiquetaPromo(p)}</span>
                )}
                {p.fecha_fin && ` · hasta ${fechaCorta(p.fecha_fin)}`}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-8 pl-10">
          {vehiculo.precio > 0 ? (
            descuento ? (
              <div>
                <span className="cifra block text-xs text-[var(--humo)] line-through">
                  {formatearPrecio(vehiculo.precio)}
                </span>
                <p className="cifra mt-1 text-xl text-[var(--rojo)]">
                  {formatearPrecio(vehiculo.precio_final)}
                </p>
              </div>
            ) : (
              <p className="cifra text-xl text-[var(--tinta)]">
                {formatearPrecio(vehiculo.precio)}
              </p>
            )
          ) : (
            <p className="cifra text-xl text-[var(--humo)]">A consultar</p>
          )}

          <a
            href={obtenerUrlWhatsAppBotVehiculo(vehiculo, nombreAgencia)}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cta inline-flex items-center gap-2 border-b border-[var(--linea)] pb-1 text-sm text-[var(--tinta)] transition-colors duration-500 hover:border-[var(--tinta)]"
          >
            Consultar
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export { TarjetaVehiculoHome };
