"use client";
import { motion } from "framer-motion";
import { TESTIMONIOS } from "./datos";
import { VISTA, escalonado, subida } from "./movimiento";
import { MARGENES, AIRE, EncabezadoSeccion } from "./estructura";

// ⚠️ SECCIÓN CON CONTENIDO DE EJEMPLO.
// El layout está terminado, pero los testimonios son de relleno. El aviso de
// abajo es deliberado: si esto llega a producción, se ve.
// Para publicar: reemplazar TESTIMONIOS en datos.js por reseñas reales (con
// nombre y consentimiento del cliente) y borrar el bloque <AvisoPlaceholder />.
function AvisoPlaceholder() {
  return (
    <p className="mb-12 border-l-2 border-[var(--rojo)] pl-4 text-sm text-[var(--rojo)]">
      Contenido de ejemplo — reemplazar por reseñas reales antes de publicar.
    </p>
  );
}

// La cita se sostiene sola: sin recuadro, sin comilla decorativa. Lo que separa
// una de otra es la regla superior y el aire entre columnas.
function Testimonio({ nombre, detalle, texto }) {
  return (
    <motion.figure
      variants={subida}
      className="m-0 flex flex-col border-t border-[var(--linea)] pt-8"
    >
      <blockquote className="flex-1 text-[15px] leading-[1.75] text-[var(--tinta)]">
        {texto}
      </blockquote>
      <figcaption className="mt-8">
        <span className="block text-sm text-[var(--tinta)]">{nombre}</span>
        <span className="rotulo mt-2 block text-[var(--humo)]">{detalle}</span>
      </figcaption>
    </motion.figure>
  );
}

function Testimonios() {
  return (
    <section id="testimonios" className={`bg-[var(--nieve)] ${AIRE} ${MARGENES}`}>
      <EncabezadoSeccion
        indice="07"
        rotulo="Referencias"
        titulo="Testimonios"
        bajada="Compradores que ya se llevaron las llaves. Autos, motos, 0 km y usados."
        className="mb-12 md:mb-16"
      />

      <AvisoPlaceholder />

      <motion.div
        initial="oculto"
        whileInView="visible"
        viewport={VISTA}
        variants={escalonado(0.11)}
        className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-16"
      >
        {TESTIMONIOS.map((testimonio, i) => (
          <Testimonio key={i} {...testimonio} />
        ))}
      </motion.div>
    </section>
  );
}

export { Testimonios };
