"use client";
import { motion } from "framer-motion";
import { SERVICIOS } from "./datos";
import { VISTA, escalonado, subida } from "./movimiento";
import { MARGENES, AIRE, EncabezadoSeccion } from "./estructura";

// Servicios: lo que la agencia hace además de vender. Va como LISTA y no como
// grilla —el tercer tratamiento seguido— porque son prestaciones enumerables:
// el nombre a la izquierda y qué incluye a la derecha se escanea en una pasada,
// que es como se lee un listado de servicios.
function Servicio({ icono: Icono, titulo, texto }) {
  return (
    <motion.li
      variants={subida}
      className="grid grid-cols-1 gap-4 border-b border-[var(--linea)] py-8 md:grid-cols-[1fr_1.4fr] md:items-start md:gap-16"
    >
      <div className="flex items-center gap-4">
        <Icono className="h-4 w-4 shrink-0 text-[var(--humo)]" aria-hidden="true" />
        <h3 className="titular text-lg text-[var(--tinta)] md:text-xl">{titulo}</h3>
      </div>
      <p className="text-sm leading-[1.75] text-[var(--humo)] md:max-w-md">{texto}</p>
    </motion.li>
  );
}

function Servicios() {
  return (
    <section id="servicios" className={`${AIRE} ${MARGENES}`}>
      <EncabezadoSeccion
        indice="04"
        rotulo="Lo que hacemos"
        titulo="Servicios"
        bajada="Lo que rodea a la venta, que suele ser lo que más tiempo te ahorra."
        className="mb-10 md:mb-14"
      />

      <motion.ul
        initial="oculto"
        whileInView="visible"
        viewport={VISTA}
        variants={escalonado(0.09)}
      >
        {SERVICIOS.map((servicio) => (
          <Servicio key={servicio.titulo} {...servicio} />
        ))}
      </motion.ul>
    </section>
  );
}

export { Servicios };
