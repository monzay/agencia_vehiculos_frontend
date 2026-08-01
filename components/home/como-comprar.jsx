"use client";
import { motion } from "framer-motion";
import { PASOS_COMPRA } from "./datos";
import { VISTA, escalonado, subida } from "./movimiento";
import { MARGENES, AIRE, EncabezadoSeccion } from "./estructura";

// Los cuatro pasos del proceso, en una retícula de filos. El número entre
// paréntesis y la regla corta debajo del título son los dos únicos adornos: en
// esta dirección el orden lo comunica la numeración, no una línea que se dibuja
// al scrollear.
function Paso({ numero, titulo, texto }) {
  return (
    <motion.li variants={subida} className="group bg-[var(--nieve)] p-8 md:p-10">
      <span className="rotulo cifra text-[var(--humo)]/60">({numero})</span>
      <h3 className="titular mt-10 text-xl text-[var(--tinta)] md:text-2xl">{titulo}</h3>
      <span
        className="mt-5 block h-px w-8 bg-[var(--linea)] transition-all duration-500 group-hover:w-14"
        aria-hidden="true"
      />
      <p className="mt-5 max-w-sm text-sm leading-[1.75] text-[var(--humo)]">{texto}</p>
    </motion.li>
  );
}

function ComoComprar() {
  return (
    <section id="como-comprar" className={`bg-[var(--nieve)] ${AIRE} ${MARGENES}`}>
      <EncabezadoSeccion
        indice="02"
        rotulo="El proceso"
        titulo="Cómo comprar"
        bajada="Cuatro pasos, sin letra chica: sabés qué sigue en cada momento y cuánto vas a pagar antes de firmar."
        className="mb-16 md:mb-20"
      />

      <motion.ol
        initial="oculto"
        whileInView="visible"
        viewport={VISTA}
        variants={escalonado(0.11)}
        className="grid grid-cols-1 gap-px bg-[var(--linea)] md:grid-cols-2 lg:grid-cols-4"
      >
        {PASOS_COMPRA.map((paso, i) => (
          <Paso key={paso.titulo} numero={String(i + 1).padStart(2, "0")} {...paso} />
        ))}
      </motion.ol>
    </section>
  );
}

export { ComoComprar };
