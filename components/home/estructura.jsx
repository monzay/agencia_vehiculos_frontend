"use client";
import { motion } from "framer-motion";
import { VISTA, escalonado, subida, subidaCorta } from "./movimiento";

// Piezas estructurales compartidas por la portada.
//
// El encabezado es el mismo en todas las secciones y ahí está el punto: rótulo
// chico arriba, un titular corto —una palabra cuando se puede— y la regla de un
// pelo que cierra el bloque. La repetición literal es lo que hace que la página
// se lea como un sistema y no como una sucesión de secciones distintas.

// Márgenes horizontales del sitio. Vive acá para que ninguna sección invente
// los suyos: el filo izquierdo tiene que ser el mismo de arriba a abajo.
const MARGENES = "px-6 md:px-10 lg:px-16";

// Aire vertical entre secciones. Generoso a propósito: sin cajas ni sombras,
// el espacio en blanco es lo único que separa un bloque del siguiente.
const AIRE = "py-24 md:py-32";

// El número de sección es lo que convierte una sucesión de bloques en un
// índice: el visitante sabe en todo momento cuánto lleva y cuánto falta. Es
// también el detalle que hace que la retícula se lea como un documento
// corporativo y no como una plantilla.
function EncabezadoSeccion({ indice, rotulo, titulo, bajada, contador, className = "" }) {
  return (
    <motion.header
      initial="oculto"
      whileInView="visible"
      viewport={VISTA}
      variants={escalonado(0.1)}
      className={`flex flex-col gap-8 border-b border-[var(--linea)] pb-6 md:flex-row md:items-end md:justify-between md:gap-16 ${className}`}
    >
      <div>
        <motion.div variants={subidaCorta} className="flex items-baseline gap-5">
          {indice && (
            <span className="rotulo cifra text-[var(--humo)]/45">({indice})</span>
          )}
          <p className="rotulo text-[var(--humo)]">{rotulo}</p>
        </motion.div>
        <motion.h2
          variants={subida}
          className="titular mt-4 text-4xl text-[var(--tinta)] md:text-[3.5rem]"
        >
          {titulo}
        </motion.h2>
      </div>

      {(bajada || contador) && (
        <motion.div
          variants={subidaCorta}
          className="flex flex-col gap-3 md:max-w-sm md:items-end md:text-right"
        >
          {bajada && (
            <p className="text-sm leading-[1.75] text-[var(--humo)]">{bajada}</p>
          )}
          {contador && (
            <span className="rotulo cifra text-[var(--humo)]/70">{contador}</span>
          )}
        </motion.div>
      )}
    </motion.header>
  );
}

export { MARGENES, AIRE, EncabezadoSeccion };
