"use client";
import { motion } from "framer-motion";
import { MessageCircle, MapPin, Clock } from "lucide-react";
import { INFO_NEGOCIO, obtenerUrlWhatsAppPredeterminada, ENLACES_SOCIALES } from "@/lib/constantes";
import { ENLACES } from "./datos";
import { VISTA, escalonado, subida, LineaTitulo, BotonMagnetico } from "./movimiento";

const ANIO = new Date().getFullYear();

// Cierre y pie comparten la banda grafito: es la marquesina negra del cartel del local,
// el único lugar oscuro de la página y donde vive la acción principal. El botón de
// WhatsApp es magnético: se inclina hacia el cursor para pedir el último click.
function Cierre() {
  return (
    <footer id="contacto" className="bg-[var(--grafito)] text-[var(--nieve)]">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        {/* Llamada a la acción */}
        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.12)}
          className="py-20 lg:py-28 flex flex-col lg:flex-row lg:items-end justify-between gap-10"
        >
          <div>
            <h2 className="tipo-titulo text-[clamp(2.25rem,5vw,4rem)]">
              <LineaTitulo>¿Encontraste</LineaTitulo>
              <LineaTitulo>el tuyo?</LineaTitulo>
            </h2>
            <motion.p variants={subida} className="mt-5 max-w-md text-white/60 leading-relaxed">
              Escribinos por WhatsApp: te pasamos precio, cuotas y qué te tomamos por tu
              usado. Sin vueltas.
            </motion.p>
          </div>
          <motion.div variants={subida} className="shrink-0">
            <BotonMagnetico
              href={obtenerUrlWhatsAppPredeterminada()}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 h-16 px-10 rounded-full bg-[var(--rojo)] text-white text-lg font-medium hover:brightness-110 transition-[filter] duration-300"
            >
              <MessageCircle className="w-5 h-5" />
              Escribir por WhatsApp
            </BotonMagnetico>
          </motion.div>
        </motion.div>

        {/* Pie */}
        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.08)}
          className="border-t border-white/10 py-12 grid gap-10 md:grid-cols-3"
        >
          <motion.div variants={subida}>
            <span className="tipo-titulo text-xl">{INFO_NEGOCIO.name}</span>
            <p className="mt-4 flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[var(--rojo)]" />
              {INFO_NEGOCIO.address}, {INFO_NEGOCIO.city}
            </p>
          </motion.div>

          <motion.div variants={subida} className="flex items-start gap-2.5 text-sm text-white/60">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[var(--rojo)]" />
            <div className="space-y-1">
              <p>{INFO_NEGOCIO.hours.weekdays}</p>
              <p>{INFO_NEGOCIO.hours.saturday}</p>
              <p>{INFO_NEGOCIO.hours.sunday}</p>
            </div>
          </motion.div>

          <motion.nav variants={subida} className="flex flex-col gap-2.5 text-sm">
            {ENLACES.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="text-white/60 hover:text-white transition-colors duration-300 w-fit"
              >
                {enlace.nombre}
              </a>
            ))}
            <a
              href="/catalogo"
              className="text-white/60 hover:text-white transition-colors duration-300 w-fit"
            >
              Catálogo completo
            </a>
          </motion.nav>
        </motion.div>

        <div className="border-t border-white/10 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
          <p>
            © {ANIO} {INFO_NEGOCIO.name} · {INFO_NEGOCIO.city}, {INFO_NEGOCIO.province}
          </p>
          <div className="flex gap-5">
            {ENLACES_SOCIALES.filter((r) => r.href).map((red) => (
              <a
                key={red.name}
                href={red.href}
                className="hover:text-white transition-colors duration-300"
              >
                {red.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Cierre };
