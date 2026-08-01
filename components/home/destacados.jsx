"use client";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { TarjetaVehiculoHome } from "./tarjeta-vehiculo";
import { VISTA, escalonado } from "./movimiento";
import { MARGENES, AIRE, EncabezadoSeccion } from "./estructura";
import { useStock } from "./stock";

const CANTIDAD = 6;

// La API devuelve el stock del más nuevo al más viejo: los seis primeros son,
// literalmente, los últimos que entraron al showroom.
//
// La grilla se arma con `gap-px` sobre el color de línea: el fondo asoma entre
// las celdas y dibuja los filos sin que ninguna tarjeta lleve borde propio. Es
// el mismo recurso que ordena "Cómo comprar", y lo que hace que la página se
// lea como una sola retícula.
function Destacados() {
  const stock = useStock();
  const vehiculos = stock === null ? null : stock.slice(0, CANTIDAD);

  return (
    <section id="vehiculos" className={`${AIRE} ${MARGENES}`}>
      <EncabezadoSeccion
        indice="01"
        rotulo="Últimos ingresos"
        titulo="Vehículos"
        contador={
          vehiculos?.length
            ? `${String(vehiculos.length).padStart(2, "0")} de ${stock.length} unidades`
            : null
        }
        className="mb-16 md:mb-20"
      />

      {vehiculos === null ? (
        <div className="grid grid-cols-1 gap-px bg-[var(--linea)] md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: CANTIDAD }).map((_, i) => (
            <div key={i} className="h-[26rem] animate-pulse bg-[var(--nieve)]" />
          ))}
        </div>
      ) : vehiculos.length === 0 ? (
        <p className="max-w-md py-16 text-sm leading-[1.75] text-[var(--humo)]">
          El catálogo no está disponible en este momento. Escribinos por WhatsApp y te
          contamos qué tenemos.
        </p>
      ) : (
        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.08)}
          className="grid grid-cols-1 gap-px bg-[var(--linea)] md:grid-cols-2 lg:grid-cols-3"
        >
          {vehiculos.map((v, i) => (
            <TarjetaVehiculoHome key={v.ref ?? v.id} vehiculo={v} indice={i} />
          ))}
        </motion.div>
      )}

      <a
        href="/catalogo"
        className="group mt-12 inline-flex items-center gap-3 border-b border-[var(--linea)] pb-1.5 text-sm text-[var(--tinta)] transition-colors duration-500 hover:border-[var(--tinta)]"
      >
        Ver todo el catálogo
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </section>
  );
}

export { Destacados };
