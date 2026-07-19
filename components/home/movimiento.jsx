"use client";
import { useRef } from "react";
import {
  MotionConfig,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";

// Lenguaje de movimiento de la portada. Toda la coreografía sale de acá:
// una sola curva, un solo resorte y tres gestos (subida, máscara, escalonado)
// para que cada sección se mueva con el mismo acento.

// La curva de la casa: la misma que --curva en globals.css.
const CURVA = [0.22, 1, 0.36, 1];

// Resorte para hovers y micro-interacciones (tarjetas, botones).
const RESORTE = { type: "spring", stiffness: 320, damping: 26, mass: 0.8 };

// Viewport por defecto: dispara una vez, un poco antes de que el bloque asome.
const VISTA = { once: true, margin: "0px 0px -12% 0px" };

// Contenedor que escalona a sus hijos. No anima nada propio: solo dirige.
const escalonado = (paso = 0.09, retardo = 0) => ({
  oculto: {},
  visible: { transition: { staggerChildren: paso, delayChildren: retardo } },
});

// Gesto base: sube y aparece con la curva de la casa.
const subida = {
  oculto: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: CURVA } },
};

// Variante corta para piezas chicas (datos, enlaces).
const subidaCorta = {
  oculto: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: CURVA } },
};

// Línea de titular que emerge desde adentro de una máscara.
const lineaEmergente = {
  oculto: { y: "112%" },
  visible: { y: "0%", transition: { duration: 1.05, ease: CURVA } },
};

// La foto del hero se destapa de derecha a izquierda mientras suelta el zoom.
const destapeFoto = {
  oculto: { opacity: 0, clipPath: "inset(0 0 0 24%)", scale: 1.12 },
  visible: {
    opacity: 1,
    clipPath: "inset(0 0 0 0%)",
    scale: 1,
    transition: { duration: 1.4, ease: CURVA },
  },
};

// Una línea de titular dentro de su máscara. Cada <LineaTitulo> es un verso:
// el texto sube desde abajo del recorte, estilo editorial.
function LineaTitulo({ children, className = "" }) {
  return (
    <span className={`block overflow-hidden pb-[0.08em] -mb-[0.08em] ${className}`}>
      <motion.span variants={lineaEmergente} className="block will-change-transform">
        {children}
      </motion.span>
    </span>
  );
}

// Botón que se inclina hacia el cursor y vuelve con resorte al soltarlo.
// El imán es sutil (un cuarto del desplazamiento) para que se sienta, no se vea.
function BotonMagnetico({ children, className = "", ...props }) {
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 16, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 16, mass: 0.4 });

  const alMover = (e) => {
    const caja = ref.current.getBoundingClientRect();
    x.set((e.clientX - caja.left - caja.width / 2) * 0.25);
    y.set((e.clientY - caja.top - caja.height / 2) * 0.35);
  };
  const alSalir = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      style={{ x, y }}
      onPointerMove={alMover}
      onPointerLeave={alSalir}
      whileTap={{ scale: 0.96 }}
      transition={RESORTE}
      className={className}
      {...props}
    >
      {children}
    </motion.a>
  );
}

// Envuelve la portada: respeta prefers-reduced-motion en todo lo que anime framer.
function Escena({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export {
  CURVA,
  RESORTE,
  VISTA,
  escalonado,
  subida,
  subidaCorta,
  lineaEmergente,
  destapeFoto,
  LineaTitulo,
  BotonMagnetico,
  Escena,
};
