"use client";
import { MotionConfig } from "framer-motion";

// Lenguaje de movimiento de la portada. En esta dirección el movimiento no es
// un recurso expresivo: solo evita que cada bloque aparezca de golpe. Una curva,
// un gesto (subir y aparecer) y dos amplitudes según el peso de la pieza.

// La curva de la casa: la misma que --curva en globals.css.
const CURVA = [0.22, 1, 0.36, 1];

// Viewport por defecto: dispara una vez, un poco antes de que el bloque asome.
const VISTA = { once: true, margin: "0px 0px -12% 0px" };

// Contenedor que escalona a sus hijos. No anima nada propio: solo dirige.
const escalonado = (paso = 0.09, retardo = 0) => ({
  oculto: {},
  visible: { transition: { staggerChildren: paso, delayChildren: retardo } },
});

// Gesto base: sube y aparece.
const subida = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: CURVA } },
};

// Variante corta para piezas chicas (rótulos, datos, enlaces).
const subidaCorta = {
  oculto: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: CURVA } },
};

// Envuelve la portada: respeta prefers-reduced-motion en todo lo que anime framer.
function Escena({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export { CURVA, VISTA, escalonado, subida, subidaCorta, Escena };
