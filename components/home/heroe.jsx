"use client";
import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { INFO_NEGOCIO, obtenerUrlWhatsApp } from "@/lib/constantes";
import { GARANTIAS } from "./datos";
import { escalonado, subida, subidaCorta, destapeFoto, LineaTitulo } from "./movimiento";

const CONSULTA = "Hola SEA Automotores! Quería hacer una consulta.";

// La foto del showroom ya viene difuminada a blanco por la izquierda: el hero se apoya
// en eso. Al cargar, la foto se destapa de derecha a izquierda mientras el titular
// emerge línea por línea; al scrollear, la foto queda apenas rezagada (parallax).
function Heroe() {
  const refSeccion = useRef(null);

  // Parallax: mientras el hero sale de pantalla, la foto lo sigue a menor velocidad.
  const { scrollYProgress } = useScroll({
    target: refSeccion,
    offset: ["start start", "end start"],
  });
  const yFoto = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <motion.section
      ref={refSeccion}
      initial="oculto"
      animate="visible"
      variants={escalonado(0.11, 0.15)}
      className="relative bg-[var(--nieve)] overflow-hidden"
    >
      {/* Foto de fondo (desktop): se destapa al cargar y la luz la cruza una vez */}
      <motion.div
        variants={destapeFoto}
        className="hidden lg:block absolute inset-y-0 right-0 w-[68%] pasada-luz pasada-luz-carga will-change-transform"
      >
        <motion.div style={{ y: yFoto }} className="absolute -inset-y-[10%] inset-x-0">
          <Image
            src="/images/hero.png"
            alt="Clientes recibiendo las llaves de su auto en el showroom de SEA Automotores"
            fill
            priority
            sizes="68vw"
            className="object-cover object-right"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--nieve)] via-[var(--nieve)]/40 to-transparent" />
        {/* Velo superior: la nav vive sobre la foto y necesita apoyarse en claro para leerse. */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--nieve)] via-[var(--nieve)]/70 to-transparent" />
      </motion.div>

      <div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 pt-32 pb-14 lg:pt-48 lg:pb-24">
        <div className="max-w-xl lg:max-w-3xl">
          <motion.span
            variants={subidaCorta}
            className="inline-flex items-center gap-2.5 text-sm text-[var(--humo)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--rojo)]" aria-hidden="true" />
            {INFO_NEGOCIO.name} · {INFO_NEGOCIO.city}
          </motion.span>

          {/* Titular editorial: cada línea sube desde adentro de su máscara */}
          <h1 className="tipo-titulo mt-6 text-balance text-[clamp(2.15rem,5.6vw,4.5rem)] text-[var(--tinta)]">
            <LineaTitulo>Tu próximo auto</LineaTitulo>
            <LineaTitulo>
              está a <span className="text-[var(--rojo)]">un mensaje</span>
            </LineaTitulo>
          </h1>

          <motion.p
            variants={subida}
            className="mt-7 max-w-lg text-base lg:text-lg leading-relaxed text-[var(--humo)]"
          >
            Autos y motos, 0 km y usados. Financiamos a tu medida y tomamos tu usado
            como parte de pago.
          </motion.p>

          <motion.div variants={subida} className="mt-9 flex flex-col sm:flex-row gap-3">
            <a
              href="#vehiculos"
              className="group inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-[var(--tinta)] text-[var(--nieve)] font-medium hover:bg-[var(--rojo)] transition-colors duration-300"
            >
              Ver vehículos
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href={obtenerUrlWhatsApp(CONSULTA)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full border border-[var(--linea)] bg-[var(--nieve)] text-[var(--tinta)] font-medium hover:border-[var(--tinta)] hover:shadow-[var(--sombra-baja)] transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4" />
              Escribir por WhatsApp
            </a>
          </motion.div>
        </div>

        {/* Foto (móvil): la misma escena, en tarjeta */}
        <motion.div
          variants={subida}
          className="lg:hidden mt-12 relative aspect-[16/11] rounded-2xl overflow-hidden shadow-[var(--sombra-alta)] pasada-luz pasada-luz-carga"
        >
          <Image
            src="/images/hero.png"
            alt="Clientes recibiendo las llaves de su auto en el showroom de SEA Automotores"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[65%_center]"
          />
        </motion.div>
      </div>

      {/* Franja de confianza: los cuatro datos entran en cascada propia */}
      <motion.div
        variants={escalonado(0.08)}
        className="relative border-t border-[var(--linea)] bg-[var(--nieve)]"
      >
        <dl className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-4">
          {GARANTIAS.map(([rotulo, valor], i) => (
            <motion.div
              key={rotulo}
              variants={subidaCorta}
              className={`py-6 lg:py-7 ${i > 0 ? "lg:pl-8 lg:border-l lg:border-[var(--linea)]" : ""}`}
            >
              <dt className="text-xs uppercase tracking-[0.14em] text-[var(--humo)]">{rotulo}</dt>
              <dd className="mt-1.5 text-sm lg:text-base font-medium text-[var(--tinta)]">{valor}</dd>
            </motion.div>
          ))}
        </dl>
      </motion.div>
    </motion.section>
  );
}

export { Heroe };
