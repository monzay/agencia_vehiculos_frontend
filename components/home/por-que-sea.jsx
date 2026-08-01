"use client";
import { motion } from "framer-motion";
import { RAZONES } from "./datos";
import { VISTA, escalonado, subida } from "./movimiento";
import { MARGENES, AIRE, EncabezadoSeccion } from "./estructura";

// A diferencia de "Cómo comprar", acá no hay retícula cerrada: tres columnas
// abiertas que arrancan en una regla de un pelo. El cambio de tratamiento es
// intencional —grilla, columnas y lista en las tres secciones seguidas— para
// que no se lean como la misma diapositiva repetida.
function Razon({ icono: Icono, titulo, texto }) {
  return (
    <motion.article variants={subida} className="border-t border-[var(--linea)] pt-8">
      <Icono className="h-4 w-4 text-[var(--humo)]" aria-hidden="true" />
      <h3 className="titular mt-8 text-xl text-[var(--tinta)] md:text-2xl">{titulo}</h3>
      <p className="mt-5 max-w-sm text-sm leading-[1.75] text-[var(--humo)]">{texto}</p>
    </motion.article>
  );
}

function PorQueSea() {
  return (
    <section id="por-que" className={`${AIRE} ${MARGENES}`}>
      <EncabezadoSeccion
        indice="03"
        rotulo="Por qué SEA"
        titulo="Compromiso"
        bajada="Tres cosas que resolvemos antes de que preguntes, para que la única duda que te quede sea cuál elegir."
        className="mb-16 md:mb-20"
      />

      <motion.div
        initial="oculto"
        whileInView="visible"
        viewport={VISTA}
        variants={escalonado(0.11)}
        className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-16"
      >
        {RAZONES.map((razon) => (
          <Razon key={razon.titulo} {...razon} />
        ))}
      </motion.div>
    </section>
  );
}

export { PorQueSea };
