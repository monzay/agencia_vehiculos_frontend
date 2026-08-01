"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { obtenerUbicacion, obtenerHorarios } from "@/lib/api";
import { INFO_NEGOCIO, obtenerUrlWhatsAppPredeterminada } from "@/lib/constantes";
import { VISTA, escalonado, subida, subidaCorta } from "./movimiento";
import { MARGENES, AIRE } from "./estructura";

// Dirección y horarios salen de la base (los edita el admin en Configuración),
// con INFO_NEGOCIO como respaldo si la API no responde. El backend expone ambos
// GET sin sesión justamente para esto.
//
// Orden de la semana: la tabla guarda 0=domingo (getDay()), pero se muestra de
// lunes a domingo, que es como lo lee una persona.
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
const NOMBRE_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Segunda banda invertida, y cierre del cuerpo de la página: la conversión vive
// sobre fondo oscuro, donde no compite con nada.
//
// El mapa entra en gris y recupera el color al apuntarlo, igual que las fotos
// de Entregas. Sin eso, el bloque blanco de Google es lo único que rompe la
// paleta en toda la portada.
function Contacto() {
  const [ubicacion, setUbicacion] = useState(null);
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    obtenerUbicacion().then(setUbicacion).catch(() => {});
    obtenerHorarios()
      .then((d) => setHorarios(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const direccion = ubicacion?.direccion || `${INFO_NEGOCIO.address}, ${INFO_NEGOCIO.city}`;
  const nombre = ubicacion?.nombre || INFO_NEGOCIO.name;
  const { latitud, longitud, mapsUrl } = ubicacion ?? {};
  const mapaEmbebido =
    latitud && longitud ? `https://www.google.com/maps?q=${latitud},${longitud}&z=16&output=embed` : null;

  const porDia = new Map(horarios.map((h) => [h.dia, h]));

  return (
    <section
      id="contacto"
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
            <span className="rotulo cifra text-[var(--piso)]/30">(09)</span>
            <p className="rotulo text-[var(--piso)]/40">Dónde estamos</p>
          </motion.div>
          <motion.h2
            variants={subida}
            className="titular mt-8 text-4xl text-balance md:text-5xl lg:text-[3.5rem]"
          >
            Vení a conocer
            <br />
            el showroom
          </motion.h2>

          <motion.div variants={subida} className="mt-10 flex flex-col items-start gap-5">
            <a
              href={obtenerUrlWhatsAppPredeterminada()}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 border-b border-[var(--piso)]/20 pb-1.5 text-sm tracking-wide text-[var(--piso)]/60 transition-colors duration-500 hover:border-[var(--piso)]/60 hover:text-[var(--piso)]"
            >
              Escribir por WhatsApp
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 border-b border-transparent pb-1.5 text-sm tracking-wide text-[var(--piso)]/60 transition-colors duration-500 hover:border-[var(--piso)]/40 hover:text-[var(--piso)]"
              >
                Cómo llegar
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={VISTA}
          variants={escalonado(0.1, 0.15)}
          className="flex flex-col gap-12"
        >
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <motion.div variants={subida}>
              <p className="rotulo text-[var(--piso)]/35">Showroom</p>
              <p className="mt-5 text-sm leading-[1.75] text-[var(--piso)]/55">{direccion}</p>
            </motion.div>

            {horarios.length > 0 && (
              <motion.div variants={subida}>
                <p className="rotulo text-[var(--piso)]/35">Horarios</p>
                <dl className="mt-5 flex flex-col gap-2">
                  {ORDEN.map((dia) => {
                    const h = porDia.get(dia);
                    return (
                      <div key={dia} className="flex justify-between gap-4 text-sm">
                        <dt className="text-[var(--piso)]/40">{NOMBRE_DIA[dia]}</dt>
                        <dd className="cifra text-[var(--piso)]/70">
                          {h?.abierto ? `${h.apertura} – ${h.cierre}` : "Cerrado"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </motion.div>
            )}
          </div>

          <motion.div
            variants={subida}
            className="group relative min-h-[18rem] overflow-hidden border border-[var(--piso)]/10 lg:min-h-[22rem]"
          >
            {mapaEmbebido ? (
              <iframe
                src={mapaEmbebido}
                title={`Ubicación de ${nombre}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0 grayscale transition-all duration-[1200ms] ease-[var(--curva)] group-hover:grayscale-0"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-[var(--piso)]/40">
                Cargá las coordenadas en Configuración → Ubicación para mostrar el mapa.
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export { Contacto };
