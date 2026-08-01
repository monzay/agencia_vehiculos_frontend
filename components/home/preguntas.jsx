"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { PREGUNTAS } from "./datos";
import { CURVA, VISTA, escalonado, subida, subidaCorta } from "./movimiento";
import { MARGENES, AIRE } from "./estructura";

// Preguntas frecuentes. Acordeón de una abierta por vez: en una lista corta,
// permitir varias abiertas hace que la página salte de alto sin motivo.
// La altura se anima con `height: auto` de framer, que mide el contenido real.
//
// El encabezado queda pegado (sticky) mientras se recorren las respuestas: es
// la única sección donde el título tiene que seguir presente, porque la lectura
// es de ida y vuelta entre preguntas.
function Pregunta({ pregunta, respuesta, abierta, alAbrir, id }) {
  return (
    <motion.div variants={subida} className="border-b border-[var(--linea)]">
      <h3>
        <button
          type="button"
          onClick={alAbrir}
          aria-expanded={abierta}
          aria-controls={`respuesta-${id}`}
          className="group flex w-full items-center justify-between gap-8 py-7 text-left"
        >
          <span className="text-base text-[var(--tinta)] md:text-lg">{pregunta}</span>
          <motion.span
            animate={{ rotate: abierta ? 45 : 0 }}
            transition={{ duration: 0.4, ease: CURVA }}
            className="shrink-0 text-[var(--humo)] transition-colors duration-300 group-hover:text-[var(--tinta)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </motion.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            id={`respuesta-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: CURVA }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-8 pr-10 text-sm leading-[1.75] text-[var(--humo)]">
              {respuesta}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Preguntas() {
  const [abierta, setAbierta] = useState(0);

  return (
    <section id="preguntas" className={`${AIRE} ${MARGENES}`}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-24">
        <motion.header
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.1)}
          className="lg:sticky lg:top-32 lg:self-start"
        >
          <motion.div variants={subidaCorta} className="flex items-baseline gap-5">
            <span className="rotulo cifra text-[var(--humo)]/45">(08)</span>
            <p className="rotulo text-[var(--humo)]">Dudas frecuentes</p>
          </motion.div>
          <motion.h2
            variants={subida}
            className="titular mt-4 text-4xl text-[var(--tinta)] md:text-[3.5rem]"
          >
            Preguntas
          </motion.h2>
        </motion.header>

        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.07)}
          className="border-t border-[var(--linea)]"
        >
          {PREGUNTAS.map((item, i) => (
            <Pregunta
              key={item.pregunta}
              id={i}
              {...item}
              abierta={abierta === i}
              alAbrir={() => setAbierta(abierta === i ? -1 : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export { Preguntas };
