"use client";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { INFO_NEGOCIO, obtenerUrlWhatsAppPredeterminada, ENLACES_SOCIALES } from "@/lib/constantes";
import { ENLACES } from "./datos";
import { VISTA, escalonado, subida, subidaCorta } from "./movimiento";
import { MARGENES } from "./estructura";

const ANIO = new Date().getFullYear();

// Cierre en claro, después de la banda oscura de Contacto: la página abre con
// una foto a sangre y termina en papel en blanco. La última llamada a la acción
// es un titular grande y un enlace subrayado — el mismo enlace del hero, cerrando
// el círculo — y debajo, el pie con los datos duros.
function Cierre() {
  // El ancla #contacto vive en la sección Contacto (dirección, horarios y mapa);
  // acá quedó solo el resumen del pie para no repetir el id en la misma página.
  return (
    <footer className={MARGENES}>
      <motion.div
        initial="oculto"
        whileInView="visible"
        viewport={VISTA}
        variants={escalonado(0.12)}
        className="flex flex-col justify-between gap-10 py-24 md:py-32 lg:flex-row lg:items-end"
      >
        <div>
          <motion.h2
            variants={subida}
            className="titular text-[clamp(2.25rem,5vw,4rem)] text-balance text-[var(--tinta)]"
          >
            ¿Encontraste el tuyo?
          </motion.h2>
          <motion.p
            variants={subida}
            className="mt-6 max-w-md text-sm leading-[1.75] text-[var(--humo)]"
          >
            Escribinos por WhatsApp: te pasamos precio, cuotas y qué te tomamos por tu
            usado. Sin vueltas.
          </motion.p>
        </div>
        <motion.a
          variants={subidaCorta}
          href={obtenerUrlWhatsAppPredeterminada()}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-fit shrink-0 items-center gap-3 border-b border-[var(--tinta)]/30 pb-2 text-base text-[var(--tinta)] transition-colors duration-500 hover:border-[var(--tinta)]"
        >
          Escribir por WhatsApp
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </motion.a>
      </motion.div>

      <div className="grid grid-cols-1 gap-12 border-t border-[var(--linea)] py-16 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="rotulo text-[var(--tinta)]">{INFO_NEGOCIO.name}</p>
          <p className="mt-5 max-w-xs text-sm leading-[1.75] text-[var(--humo)]">
            {INFO_NEGOCIO.address}, {INFO_NEGOCIO.city}, {INFO_NEGOCIO.province}.
          </p>
        </div>

        <nav className="md:col-span-3 md:col-start-7">
          <p className="rotulo text-[var(--humo)]/60">Navegación</p>
          <div className="mt-5 flex flex-col gap-3">
            {ENLACES.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="w-fit text-sm text-[var(--humo)] transition-colors duration-300 hover:text-[var(--tinta)]"
              >
                {enlace.nombre}
              </a>
            ))}
            <a
              href="/catalogo"
              className="w-fit text-sm text-[var(--humo)] transition-colors duration-300 hover:text-[var(--tinta)]"
            >
              Catálogo completo
            </a>
          </div>
        </nav>

        <div className="md:col-span-3 md:col-start-10">
          <p className="rotulo text-[var(--humo)]/60">Horarios</p>
          <div className="mt-5 flex flex-col gap-2 text-sm text-[var(--humo)]">
            <p>{INFO_NEGOCIO.hours.weekdays}</p>
            <p>{INFO_NEGOCIO.hours.saturday}</p>
            <p>{INFO_NEGOCIO.hours.sunday}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-[var(--linea)] py-8 md:flex-row md:items-center">
        <p className="rotulo text-[var(--humo)]/60">
          © {ANIO} {INFO_NEGOCIO.name}
        </p>
        <div className="flex gap-8">
          {ENLACES_SOCIALES.filter((r) => r.href).map((red) => (
            <a
              key={red.name}
              href={red.href}
              className="rotulo text-[var(--humo)]/60 transition-colors duration-300 hover:text-[var(--tinta)]"
            >
              {red.name}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export { Cierre };
