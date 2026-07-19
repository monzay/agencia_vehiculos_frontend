"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgePercent, Gift } from "lucide-react";
import { obtenerNombreCompletoVehiculo, formatearPrecio } from "@/lib/vehiculos";
import { obtenerUrlWhatsAppBotVehiculo } from "@/lib/constantes";
import { RESORTE, subida } from "./movimiento";

const COMBUSTIBLE = { nafta: "Nafta", gnc: "GNC", diesel: "Diésel" };

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

function Dato({ rotulo, children }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--humo)]">{rotulo}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums text-[var(--tinta)]">{children}</dd>
    </div>
  );
}

// Tarjeta de la portada: entra en la cascada del grid y, al apuntarla, se eleva con
// resorte mientras la luz del showroom le pasa por encima. Consultar abre WhatsApp
// con la REF ya cargada, que es como el bot ata la conversación.
function TarjetaVehiculoHome({ vehiculo }) {
  const sinKms = vehiculo.condicion === "usado" && vehiculo.kms === 0;
  // Beneficios VIGENTES (la API ya filtra los vencidos).
  const descuento = vehiculo.ahorro > 0 ? vehiculo.descuento : null;
  const promos = vehiculo.promociones ?? [];
  const tieneBeneficio = Boolean(descuento) || promos.length > 0;

  return (
    <motion.article
      variants={subida}
      whileHover={{ y: -8, transition: RESORTE }}
      className="group flex flex-col rounded-2xl bg-[var(--nieve)] border border-[var(--linea)] shadow-[var(--sombra-baja)] hover:shadow-[var(--sombra-alta)] transition-shadow duration-500 ease-[var(--curva)]"
    >
      <div className="relative aspect-[4/3] rounded-t-2xl overflow-hidden bg-[var(--piso)] pasada-luz pasada-luz-hover">
        <Image
          src={vehiculo.image}
          alt={obtenerNombreCompletoVehiculo(vehiculo)}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1200ms] ease-[var(--curva)] group-hover:scale-[1.04]"
        />
        <div className="absolute top-3 left-3 z-[3] flex gap-1.5">
          {vehiculo.condicion === "0km" && (
            <span className="rounded-full bg-[var(--rojo)] text-white text-[11px] font-medium px-2.5 py-1">
              0 km
            </span>
          )}
          <span className="rounded-full bg-[var(--nieve)]/90 backdrop-blur-sm text-[var(--tinta)] text-[11px] font-medium px-2.5 py-1">
            {vehiculo.tipo === "moto" ? "Moto" : "Auto"}
          </span>
        </div>
        {tieneBeneficio && (
          <span className="absolute top-3 right-3 z-[3] inline-flex items-center gap-1 rounded-full bg-[var(--rojo)] text-white text-[11px] font-medium px-2.5 py-1">
            <BadgePercent className="w-3 h-3" /> Oferta
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 lg:p-6">
        <h3 className="tipo-titulo text-xl text-[var(--tinta)]">
          {vehiculo.brand} <span className="text-[var(--humo)]">{vehiculo.model}</span>
        </h3>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-[var(--linea)] py-4">
          <Dato rotulo="Año">{vehiculo.year}</Dato>
          <Dato rotulo="Kms">{sinKms ? "—" : vehiculo.kms.toLocaleString("es-AR")}</Dato>
          <Dato rotulo="Motor">{COMBUSTIBLE[vehiculo.combustible] ?? "—"}</Dato>
        </dl>

        {/* Beneficios vigentes: descuento del vehículo y/o promociones */}
        {tieneBeneficio && (
          <div className="mt-4 flex flex-col gap-1.5">
            {descuento && (
              <p className="inline-flex items-center gap-1.5 text-sm text-[var(--tinta)]">
                <BadgePercent className="w-4 h-4 text-[var(--rojo)] shrink-0" />
                <span className="font-medium">{descuento.nombre}</span>
                <span className="text-[var(--rojo)] font-semibold">{etiquetaDescuento(descuento)}</span>
                {descuento.fecha_fin && <span className="text-[var(--humo)] text-xs">· hasta {fechaCorta(descuento.fecha_fin)}</span>}
              </p>
            )}
            {promos.map((p) => (
              <p key={p.id} className="inline-flex items-center gap-1.5 text-sm text-[var(--tinta)]">
                <Gift className="w-4 h-4 text-[var(--rojo)] shrink-0" />
                <span className="font-medium">{p.nombre}</span>
                {etiquetaPromo(p) && <span className="text-[var(--rojo)] font-semibold">{etiquetaPromo(p)}</span>}
                {p.fecha_fin && <span className="text-[var(--humo)] text-xs">· hasta {fechaCorta(p.fecha_fin)}</span>}
              </p>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between gap-3">
          {vehiculo.precio > 0 ? (
            descuento ? (
              <div>
                <span className="block text-sm text-[var(--humo)] line-through tabular-nums">{formatearPrecio(vehiculo.precio)}</span>
                <p className="tipo-titulo text-2xl tabular-nums text-[var(--rojo)]">{formatearPrecio(vehiculo.precio_final)}</p>
              </div>
            ) : (
              <p className="tipo-titulo text-2xl tabular-nums text-[var(--tinta)]">{formatearPrecio(vehiculo.precio)}</p>
            )
          ) : (
            <p className="tipo-titulo text-2xl tabular-nums text-[var(--tinta)]">A consultar</p>
          )}
          <a
            href={obtenerUrlWhatsAppBotVehiculo(vehiculo)}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cta inline-flex items-center gap-1 text-sm font-medium text-[var(--tinta)] hover:text-[var(--rojo)] transition-colors duration-300"
          >
            Consultar
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export { TarjetaVehiculoHome };
