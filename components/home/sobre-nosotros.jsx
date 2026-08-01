"use client";
import { motion } from "framer-motion";
import { SOBRE } from "./datos";
import { VISTA, escalonado, subida, subidaCorta } from "./movimiento";
import { MARGENES, AIRE } from "./estructura";

// Primera de las dos bandas invertidas de la portada (la otra es Contacto).
// Sobre blanco continuo, dar vuelta el canvas es lo que marca que empieza otro
// registro: hasta acá se habló del stock, de acá en más de quiénes lo venden.
//
// No usa EncabezadoSeccion: ese componente está escrito con los tokens claros
// (--tinta, --humo) y acá la tinta es al revés. Son quince líneas de encabezado
// propio contra parametrizar el compartido con un modo oscuro que solo usarían
// dos secciones.
function SobreNosotros() {
  return (
    <section
      id="nosotros"
      className={`bg-[var(--grafito)] text-[var(--piso)] ${AIRE} ${MARGENES}`}
    >
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-28">
        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.1)}
        >
          <motion.div variants={subidaCorta} className="flex items-baseline gap-5">
            <span className="rotulo cifra text-[var(--piso)]/30">(06)</span>
            <p className="rotulo text-[var(--piso)]/40">La agencia</p>
          </motion.div>
          <motion.h2
            variants={subida}
            className="titular mt-8 text-4xl text-balance md:text-5xl lg:text-[3.5rem]"
          >
            {SOBRE.titulo.join(" ")}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.1, 0.15)}
          className="flex flex-col justify-end gap-10"
        >
          <div className="flex max-w-lg flex-col gap-6">
            {SOBRE.parrafos.map((parrafo) => (
              <motion.p
                key={parrafo}
                variants={subida}
                className="text-sm leading-[1.75] text-[var(--piso)]/55"
              >
                {parrafo}
              </motion.p>
            ))}
          </div>

          <motion.dl
            variants={escalonado(0.08)}
            className="grid grid-cols-3 gap-8 border-t border-[var(--piso)]/10 pt-10"
          >
            {SOBRE.datos.map(([valor, rotulo]) => (
              <motion.div key={rotulo} variants={subidaCorta}>
                <dt className="titular cifra text-3xl md:text-4xl">{valor}</dt>
                <dd className="rotulo mt-3 text-[var(--piso)]/35">{rotulo}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>
      </div>
    </section>
  );
}

export { SobreNosotros };
