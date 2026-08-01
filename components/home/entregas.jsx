"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { obtenerEntregas } from "@/lib/api";
import { VISTA, escalonado, subida } from "./movimiento";
import { MARGENES, AIRE, EncabezadoSeccion } from "./estructura";

// Galería de entregas reales. Las fotos las sube el admin desde el panel
// (Configuración → Entregas), así que la sección se actualiza sola. Si todavía
// no hay ninguna, no se renderiza: mejor eso que una grilla vacía.
//
// Las fotos entran en blanco y negro y recuperan el color al apuntarlas. Es el
// único efecto de imagen de la portada y cumple una función: son fotos tomadas
// con celular, en condiciones de luz distintas, y el gris las unifica en una
// sola pieza. El color vuelve cuando la persona decide mirar una.
//
// Vienen de Vercel Blob (dominio externo), por eso <img> y no next/image:
// evitar tocar remotePatterns por una galería.
const FOTO = "h-full w-full object-cover grayscale transition-all duration-[1200ms] ease-[var(--curva)] hover:grayscale-0";

function Entregas() {
  const [entregas, setEntregas] = useState(null); // null = cargando

  useEffect(() => {
    obtenerEntregas()
      .then((data) => setEntregas(Array.isArray(data) ? data : []))
      .catch(() => setEntregas([]));
  }, []);

  if (entregas !== null && entregas.length === 0) return null;

  const [primera, ...resto] = entregas ?? [];

  return (
    <section id="entregas" className={`${AIRE} ${MARGENES}`}>
      <EncabezadoSeccion
        indice="05"
        rotulo="Clientes"
        titulo="Entregas"
        bajada="Cada foto es una entrega real en el showroom. No hay imágenes de catálogo en este sitio."
        className="mb-16 md:mb-20"
      />

      {entregas === null ? (
        <div className="grid grid-cols-2 gap-px bg-[var(--linea)] md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[4/3] animate-pulse bg-[var(--nieve)]" />
          ))}
        </div>
      ) : (
        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.07)}
        >
          <motion.figure variants={subida} className="m-0 aspect-[16/9] overflow-hidden">
            <img
              src={primera.url}
              alt="Entrega de un vehículo en el showroom de SEA Automotores"
              loading="lazy"
              className={FOTO}
            />
          </motion.figure>

          {resto.length > 0 && (
            <ul className="mt-px grid grid-cols-2 gap-px bg-[var(--linea)] md:grid-cols-3">
              {resto.map((entrega) => (
                <motion.li
                  key={entrega.id}
                  variants={subida}
                  className="aspect-[4/3] overflow-hidden bg-[var(--nieve)]"
                >
                  <img
                    src={entrega.url}
                    alt="Entrega de un vehículo en el showroom de SEA Automotores"
                    loading="lazy"
                    className={FOTO}
                  />
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </section>
  );
}

export { Entregas };
