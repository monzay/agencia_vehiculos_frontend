"use client";
import { motion } from "framer-motion";
import { RAZONES } from "./datos";
import { VISTA, RESORTE, escalonado, subida, LineaTitulo } from "./movimiento";

function Razon({ icono: Icono, titulo, texto }) {
  return (
    <motion.article
      variants={subida}
      whileHover={{ y: -6, transition: RESORTE }}
      className="group rounded-2xl bg-[var(--nieve)] border border-[var(--linea)] p-8 hover:shadow-[var(--sombra-baja)] transition-shadow duration-500"
    >
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--rojo)]/8 text-[var(--rojo)] transition-transform duration-500 ease-[var(--curva)] group-hover:scale-110">
        <Icono className="w-5 h-5" />
      </span>
      <h3 className="tipo-titulo mt-6 text-xl text-[var(--tinta)]">{titulo}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--humo)]">{texto}</p>
    </motion.article>
  );
}

function PorQueSea() {
  return (
    <section id="por-que" className="py-20 lg:py-28">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <motion.header
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.12)}
          className="max-w-2xl mb-12 lg:mb-16"
        >
          <motion.span variants={subida} className="block text-sm text-[var(--humo)]">
            Por qué SEA
          </motion.span>
          <h2 className="tipo-titulo mt-3 text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--tinta)]">
            <LineaTitulo>Comprar un auto</LineaTitulo>
            <LineaTitulo>sin sorpresas</LineaTitulo>
          </h2>
        </motion.header>

        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.11)}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {RAZONES.map((razon) => (
            <Razon key={razon.titulo} {...razon} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export { PorQueSea };
