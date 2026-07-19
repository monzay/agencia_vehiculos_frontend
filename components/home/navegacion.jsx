"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { INFO_NEGOCIO, obtenerUrlWhatsApp } from "@/lib/constantes";
import { ENLACES } from "./datos";
import { CURVA, escalonado } from "./movimiento";

const SALUDO = "Hola SEA Automotores! Quería hacer una consulta.";
const TRANSICION = { duration: 0.55, ease: CURVA };

// Nav propia de la portada: nace transparente sobre el hero blanco y, al scrollear,
// se recoge en una pastilla flotante. Framer interpola tamaño, fondo y sombra en un
// solo gesto. (La nav compartida con /catalogo no se toca.)
const ESTADOS_NAV = {
  plena: {
    maxWidth: "1320px",
    height: 80,
    borderRadius: 0,
    backgroundColor: "rgba(255, 255, 255, 0)",
    borderColor: "rgba(226, 229, 234, 0)",
    boxShadow: "0 10px 30px -18px rgba(28, 30, 38, 0)",
  },
  pastilla: {
    maxWidth: "1024px",
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderColor: "rgba(226, 229, 234, 1)",
    boxShadow: "0 10px 30px -18px rgba(28, 30, 38, 0.35)",
  },
};

// El velo del menú móvil se abre en círculo desde el botón hamburguesa.
const VELO = {
  cerrado: { clipPath: "circle(0% at calc(100% - 44px) 40px)" },
  abierto: {
    clipPath: "circle(150% at calc(100% - 44px) 40px)",
    transition: { duration: 0.7, ease: CURVA },
  },
  salida: {
    clipPath: "circle(0% at calc(100% - 44px) 40px)",
    transition: { duration: 0.45, ease: CURVA },
  },
};

const ENLACE_MENU = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: CURVA } },
};

function NavegacionHome() {
  const [encogida, setEncogida] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const alScrollear = () => setEncogida(window.scrollY > 24);
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  const wa = obtenerUrlWhatsApp(SALUDO);
  const enPastilla = encogida || menuAbierto;
  const cerrar = () => setMenuAbierto(false);

  return (
    <motion.header
      initial={false}
      animate={{ padding: enPastilla ? "12px 16px 0" : "0px 0px 0" }}
      transition={TRANSICION}
      className="fixed inset-x-0 top-0 z-50"
    >
      <motion.nav
        initial={false}
        animate={enPastilla ? "pastilla" : "plena"}
        variants={ESTADOS_NAV}
        transition={TRANSICION}
        className={`mx-auto flex items-center justify-between gap-6 border backdrop-blur-xl ${
          enPastilla ? "px-5" : "px-6 lg:px-10"
        }`}
      >
        <a href="#" className="flex items-center gap-2" onClick={cerrar}>
          <span className="tipo-titulo text-lg sm:text-xl text-[var(--tinta)]">
            {INFO_NEGOCIO.name}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--rojo)]" aria-hidden="true" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="relative text-sm font-medium text-[var(--tinta)]/80 hover:text-[var(--tinta)] transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[var(--rojo)] after:transition-all after:duration-300 hover:after:w-full"
            >
              {enlace.nombre}
            </a>
          ))}
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-10 px-5 rounded-full bg-[var(--tinta)] text-[var(--nieve)] text-sm font-medium hover:bg-[var(--rojo)] transition-colors duration-300"
          >
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          className="md:hidden p-2 -mr-2 text-[var(--tinta)]"
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.nav>

      {/* Menú móvil: el velo se abre desde la hamburguesa y los enlaces caen en cascada */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial="cerrado"
            animate="abierto"
            exit="salida"
            variants={VELO}
            className="md:hidden fixed inset-0 -z-10 bg-[var(--nieve)]"
          >
            <motion.div
              initial="oculto"
              animate="visible"
              variants={escalonado(0.07, 0.25)}
              className="flex flex-col justify-center h-full px-8 gap-7"
            >
              {ENLACES.map((enlace) => (
                <motion.a
                  key={enlace.href}
                  variants={ENLACE_MENU}
                  href={enlace.href}
                  onClick={cerrar}
                  className="tipo-titulo text-4xl text-[var(--tinta)]"
                >
                  {enlace.nombre}
                </motion.a>
              ))}
              <motion.a
                variants={ENLACE_MENU}
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={cerrar}
                className="mt-4 inline-flex items-center justify-center h-14 rounded-full bg-[var(--rojo)] text-white font-medium"
              >
                Escribir por WhatsApp
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export { NavegacionHome };
