"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { obtenerVehiculos } from "@/lib/api";
import { TarjetaVehiculoHome } from "./tarjeta-vehiculo";
import { VISTA, escalonado, subida, LineaTitulo } from "./movimiento";

const CANTIDAD = 6;

// La API devuelve el stock del más nuevo al más viejo: los seis primeros son,
// literalmente, los últimos que entraron al playón.
function Destacados() {
  const [vehiculos, setVehiculos] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerVehiculos()
      .then((datos) => activo && setVehiculos((datos || []).slice(0, CANTIDAD)))
      .catch(() => activo && setVehiculos([]));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <section id="vehiculos" className="py-20 lg:py-28">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <motion.header
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.12)}
          className="flex flex-wrap items-end justify-between gap-6 mb-12 lg:mb-16"
        >
          <div>
            <motion.span variants={subida} className="block text-sm text-[var(--humo)]">
              Últimos ingresos
            </motion.span>
            <h2 className="tipo-titulo mt-3 text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--tinta)]">
              <LineaTitulo>Lo que acaba</LineaTitulo>
              <LineaTitulo>de entrar</LineaTitulo>
            </h2>
          </div>
          <motion.a
            variants={subida}
            href="/catalogo"
            className="group inline-flex items-center gap-2 h-12 px-6 rounded-full border border-[var(--linea)] bg-[var(--nieve)] text-sm font-medium text-[var(--tinta)] hover:border-[var(--tinta)] hover:shadow-[var(--sombra-baja)] transition-all duration-300"
          >
            Ver todo el catálogo
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.a>
        </motion.header>

        {vehiculos === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: CANTIDAD }).map((_, i) => (
              <div
                key={i}
                className="h-[26rem] rounded-2xl border border-[var(--linea)] bg-[var(--nieve)] animate-pulse"
              />
            ))}
          </div>
        ) : vehiculos.length === 0 ? (
          <p className="py-16 text-center text-[var(--humo)]">
            El catálogo no está disponible en este momento. Escribinos por WhatsApp y te
            contamos qué tenemos.
          </p>
        ) : (
          <motion.div
            initial="oculto"
            whileInView="visible"
            viewport={VISTA}
            variants={escalonado(0.08)}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {vehiculos.map((v) => (
              <TarjetaVehiculoHome key={v.ref ?? v.id} vehiculo={v} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export { Destacados };
