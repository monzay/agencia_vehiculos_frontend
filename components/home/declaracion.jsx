"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { INFO_NEGOCIO } from "@/lib/constantes";
import { VISTA, subida } from "./movimiento";
import { MARGENES } from "./estructura";
import { useStock } from "./stock";

// Ruptura editorial a mitad de página. Después de tres secciones de texto
// —pasos, razones, servicios— la lectura necesita un respiro visual antes de la
// galería de entregas: una imagen grande y una sola frase.
//
// La frase no es un eslogan inventado: es la promesa que ya hace el texto
// institucional ("si está publicado, está acá"), puesta en el cuerpo que
// merece. Y la foto es, otra vez, una unidad del stock — la que está más al
// fondo de la lista, para no repetir una de las seis de arriba.
function Declaracion() {
  const stock = useStock();
  const conFoto = (stock ?? []).filter((v) => v.image);
  const unidad = conFoto[6] ?? conFoto.at(-1) ?? null;

  if (!unidad) return null;

  return (
    <section className={`py-16 md:py-24 ${MARGENES}`}>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-6">
        <motion.figure
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={subida}
          className="group m-0 lg:col-span-7"
        >
          <Link
            href={`/catalogo/${unidad.ref}`}
            className="relative block aspect-[16/10] overflow-hidden bg-[var(--nieve)]"
          >
            <Image
              src={unidad.image}
              alt={`${unidad.brand} ${unidad.model} en el showroom de ${INFO_NEGOCIO.name}`}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover grayscale transition-all duration-[1400ms] ease-[var(--curva)] group-hover:grayscale-0"
            />
          </Link>
          <figcaption className="rotulo mt-4 text-[var(--humo)]">
            {unidad.brand} {unidad.model} — en el showroom
          </figcaption>
        </motion.figure>

        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={subida}
          className="lg:col-span-4 lg:col-start-9"
        >
          <span className="mb-8 block h-px w-10 bg-[var(--linea)]" aria-hidden="true" />
          <blockquote className="titular text-xl text-balance text-[var(--tinta)] md:text-2xl lg:text-[1.65rem]">
            Trabajamos con lo que tenemos en el showroom. Nada de fotos de catálogo ni
            vehículos que no podés ver: si está publicado, está acá.
          </blockquote>
          <p className="rotulo mt-8 text-[var(--humo)]">
            {INFO_NEGOCIO.name} · {INFO_NEGOCIO.city}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export { Declaracion };
