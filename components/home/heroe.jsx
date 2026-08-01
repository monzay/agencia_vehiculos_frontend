"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { formatearPrecio } from "@/lib/vehiculos";
import { INFO_NEGOCIO, obtenerUrlWhatsApp } from "@/lib/constantes";
import { GARANTIAS } from "./datos";
import { escalonado, subida, subidaCorta } from "./movimiento";
import { MARGENES } from "./estructura";
import { useStock } from "./stock";

const CONSULTA = "Hola SEA Automotores! Quería hacer una consulta.";
const PAUSA = 6000;

// Tres unidades y no una: el hero tiene que mostrar la AMPLITUD del stock, así
// que se elige una por marca antes de repetir. Si no alcanzan las marcas,
// completa con lo que haya. Solo entran las que tienen foto — el hero es una
// imagen a sangre y una tarjeta sin foto lo deja en negro.
function elegirPortadas(vehiculos = []) {
  const conFoto = vehiculos.filter((v) => v.image);
  const marcas = new Set();
  const unaPorMarca = [];
  const resto = [];
  for (const v of conFoto) {
    if (marcas.has(v.brand)) resto.push(v);
    else {
      marcas.add(v.brand);
      unaPorMarca.push(v);
    }
  }
  return [...unaPorMarca, ...resto].slice(0, 3);
}

// Filos de la franja de garantías. En dos columnas el corte es la segunda
// celda de cada fila más la línea entre filas; en cuatro, una sola fila con
// tres cortes verticales. Se calcula acá para no ensuciar el JSX con cinco
// condicionales encadenados.
function celdaGarantia(i) {
  const filo = "border-[var(--linea)]";
  return [
    "py-8",
    i % 2 === 1 ? `border-l pl-6 ${filo}` : "",
    i >= 2 ? `border-t ${filo}` : "",
    i > 0 ? `lg:border-l lg:pl-8 ${filo}` : "lg:border-l-0",
    "lg:border-t-0",
  ]
    .filter(Boolean)
    .join(" ");
}

// Hero. La única imagen grande de la portada son unidades REALES del stock: no
// hay foto de archivo en ninguna parte del sitio, y es deliberado — el titular
// dice que lo que se ve está en el showroom, así que la foto tiene que salir
// del mismo catálogo que el visitante puede abrir.
//
// Las tres unidades pasan solas, salvo que las estés mirando. La ficha de datos
// y los índices numerados de la derecha son lo que convierte el fondo en
// contenido: el hero deja de ser una foto con un titular encima y pasa a ser la
// primera pieza de catálogo de la página.
//
// Si la API no responde, el velo queda sobre el canvas grafito y el hero sigue
// funcionando: el texto nunca depende de que la foto cargue.
function Heroe() {
  const stock = useStock();
  const [indice, setIndice] = useState(0);
  const [detenido, setDetenido] = useState(false);
  const menosMovimiento = useReducedMotion();

  const portadas = elegirPortadas(stock ?? []);
  const activa = portadas[indice] ?? null;
  const total = stock?.length ?? null;

  useEffect(() => {
    if (portadas.length < 2 || detenido || menosMovimiento) return;
    const reloj = setInterval(
      () => setIndice((i) => (i + 1) % portadas.length),
      PAUSA,
    );
    return () => clearInterval(reloj);
  }, [portadas.length, detenido, menosMovimiento]);

  return (
    <>
      <section
        onPointerEnter={() => setDetenido(true)}
        onPointerLeave={() => setDetenido(false)}
        className="relative flex h-svh min-h-[36rem] flex-col justify-end overflow-hidden bg-[var(--grafito)]"
      >
        <AnimatePresence>
          {activa && (
            <motion.div
              key={activa.ref ?? activa.id}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.2 }, scale: { duration: 7, ease: "linear" } }}
              className="absolute inset-0"
            >
              <Image
                src={activa.image}
                alt={`${activa.brand} ${activa.model} en el showroom de ${INFO_NEGOCIO.name}`}
                fill
                priority={indice === 0}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Doble velo: uno plano que baja el contraste general de la chapa y
            otro en degradado que carga el pie, que es donde vive el texto. */}
        <div className="absolute inset-0 bg-[var(--grafito)]/55" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--grafito)] via-[var(--grafito)]/25 to-transparent"
          aria-hidden="true"
        />

        <motion.div
          initial="oculto"
          animate="visible"
          variants={escalonado(0.12, 0.25)}
          className={`relative z-10 pb-14 md:pb-16 ${MARGENES}`}
        >
          <motion.p variants={subidaCorta} className="rotulo text-[var(--piso)]/50">
            {total ? `${total} unidades en stock` : INFO_NEGOCIO.name} ·{" "}
            {INFO_NEGOCIO.province}
          </motion.p>

          <motion.h1
            variants={subida}
            className="titular mt-6 max-w-6xl text-[clamp(2.5rem,7.5vw,6.5rem)] text-balance text-[var(--piso)]"
          >
            Todo lo que ves
            <br className="hidden md:block" /> está en el showroom
          </motion.h1>

          <div className="mt-12 flex flex-col justify-between gap-10 md:mt-16 lg:flex-row lg:items-end">
            <motion.div
              variants={subida}
              className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10"
            >
              <a
                href="#vehiculos"
                className="group inline-flex w-fit items-center gap-3 border-b border-[var(--piso)]/30 pb-1.5 text-sm tracking-wide text-[var(--piso)] transition-colors duration-500 hover:border-[var(--piso)]"
              >
                Ver vehículos
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href={obtenerUrlWhatsApp(CONSULTA)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex w-fit items-center gap-3 border-b border-transparent pb-1.5 text-sm tracking-wide text-[var(--piso)]/60 transition-colors duration-500 hover:border-[var(--piso)]/40 hover:text-[var(--piso)]"
              >
                Escribir por WhatsApp
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </motion.div>

            {/* Ficha de la unidad en pantalla + índices. Es lo que hace que la
                foto sea catálogo y no decoración. */}
            {activa && (
              <motion.div variants={subidaCorta} className="hidden shrink-0 md:block">
                <Link href={`/catalogo/${activa.ref}`} className="group block text-right">
                  <p className="rotulo text-[var(--piso)]/40">
                    {activa.year}
                    {activa.condicion === "0km"
                      ? " · 0 km"
                      : activa.kms > 0
                        ? ` · ${activa.kms.toLocaleString("es-AR")} km`
                        : ""}
                  </p>
                  <p className="titular mt-3 text-2xl text-[var(--piso)]">
                    {activa.brand} {activa.model}
                  </p>
                  <p className="cifra mt-2 text-sm text-[var(--piso)]/60 transition-colors duration-500 group-hover:text-[var(--piso)]">
                    {activa.precio > 0 ? formatearPrecio(activa.precio) : "Precio a consultar"}
                  </p>
                </Link>

                {portadas.length > 1 && (
                  <div className="mt-6 flex justify-end gap-4">
                    {portadas.map((v, i) => (
                      <button
                        key={v.ref ?? v.id}
                        type="button"
                        onClick={() => setIndice(i)}
                        aria-label={`Ver ${v.brand} ${v.model}`}
                        aria-current={i === indice}
                        className="group/i w-10 pt-2"
                      >
                        <span className="relative block h-px w-full bg-[var(--piso)]/25">
                          {i === indice && (
                            // La barra corre los 6 s de la pausa. Al apuntar el
                            // hero la rotación se detiene pero la barra ya no
                            // se reinicia: se queda llena hasta que soltás.
                            <motion.span
                              key={indice}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{
                                duration: menosMovimiento ? 0 : PAUSA / 1000,
                                ease: "linear",
                              }}
                              className="absolute inset-0 origin-left bg-[var(--piso)]"
                            />
                          )}
                        </span>
                        <span
                          className={`rotulo cifra mt-2 block transition-colors duration-300 ${
                            i === indice
                              ? "text-[var(--piso)]"
                              : "text-[var(--piso)]/35 group-hover/i:text-[var(--piso)]/70"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Franja de confianza: cuatro datos duros separados por un filo. Es el
          primer bloque en blanco y marca el cambio de registro tras la foto. */}
      <motion.dl
        initial="oculto"
        animate="visible"
        variants={escalonado(0.07, 0.6)}
        className={`grid grid-cols-2 border-b border-[var(--linea)] lg:grid-cols-4 ${MARGENES}`}
      >
        {GARANTIAS.map(([rotulo, valor], i) => (
          <motion.div key={rotulo} variants={subidaCorta} className={celdaGarantia(i)}>
            <dt className="rotulo text-[var(--humo)]">{rotulo}</dt>
            <dd className="mt-3 text-sm text-[var(--tinta)] md:text-base">{valor}</dd>
          </motion.div>
        ))}
      </motion.dl>
    </>
  );
}

export { Heroe };
