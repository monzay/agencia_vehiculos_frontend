"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { INFO_NEGOCIO, obtenerUrlWhatsApp } from "@/lib/constantes";
import { ENLACES } from "./datos";
import { MARGENES } from "./estructura";

const SALUDO = "Hola SEA Automotores! Quería hacer una consulta.";

// Navegación de la portada. Nace transparente sobre el hero —que siempre es
// oscuro, así que la tinta arranca en claro— y al scrollear se resuelve en una
// barra blanca separada por una regla de un pelo. Nada de pastillas flotantes:
// en esta dirección la barra es una franja del documento, no un objeto encima.
//
// Además se esconde al bajar y vuelve al subir: mientras se lee el catálogo la
// barra no aporta, y al primer gesto de volver está de nuevo disponible.
function NavegacionHome() {
  const [scrolleada, setScrolleada] = useState(false);
  const [oculta, setOculta] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    let anterior = window.scrollY;
    const alScrollear = () => {
      const actual = window.scrollY;
      setScrolleada(actual > 60);
      setOculta(actual > anterior && actual > 400);
      anterior = actual;
    };
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  const wa = obtenerUrlWhatsApp(SALUDO);
  const cerrar = () => setMenuAbierto(false);
  // Sobre el hero la barra es transparente y la tinta va en claro; apoyada
  // sobre el documento se da vuelta.
  const enClaro = !scrolleada && !menuAbierto;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ${
        oculta && !menuAbierto ? "-translate-y-full" : "translate-y-0"
      } ${
        enClaro
          ? "bg-transparent"
          : "border-b border-[var(--linea)] bg-[var(--piso)]/95 backdrop-blur-md"
      }`}
    >
      <nav className={`flex items-center justify-between gap-6 py-5 ${MARGENES}`}>
        <a
          href="#"
          onClick={cerrar}
          className={`rotulo font-medium transition-colors duration-500 ${
            enClaro ? "text-[var(--piso)]" : "text-[var(--tinta)]"
          }`}
        >
          {INFO_NEGOCIO.name}
        </a>

        <div className="hidden items-center gap-10 md:flex">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className={`rotulo tracking-[0.15em] transition-colors duration-500 ${
                enClaro
                  ? "text-[var(--piso)]/60 hover:text-[var(--piso)]"
                  : "text-[var(--humo)] hover:text-[var(--tinta)]"
              }`}
            >
              {enlace.nombre}
            </a>
          ))}
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={`rotulo tracking-[0.15em] border-b pb-1 transition-colors duration-500 ${
              enClaro
                ? "border-[var(--piso)]/40 text-[var(--piso)] hover:border-[var(--piso)]"
                : "border-[var(--tinta)]/30 text-[var(--tinta)] hover:border-[var(--tinta)]"
            }`}
          >
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          className={`-mr-2 p-2 transition-colors duration-500 md:hidden ${
            enClaro ? "text-[var(--piso)]" : "text-[var(--tinta)]"
          }`}
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Menú móvil: despliegue vertical sobre fondo plano. Sin velo circular
          ni cascada — el gesto tiene que ser el de abrir un índice. */}
      <div
        className={`overflow-hidden bg-[var(--piso)] transition-all duration-500 ease-in-out md:hidden ${
          menuAbierto ? "max-h-[30rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`flex flex-col gap-6 py-10 ${MARGENES}`}>
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              onClick={cerrar}
              className="titular text-2xl text-[var(--tinta)]"
            >
              {enlace.nombre}
            </a>
          ))}
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={cerrar}
            className="rotulo mt-2 w-fit border-b border-[var(--tinta)]/30 pb-1 text-[var(--tinta)]"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}

export { NavegacionHome };
