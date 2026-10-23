"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Boton } from "@/components/interfaz/boton";
import { ArrowRight, Car } from "lucide-react";

// La palabra rota cada 2.5s y cada letra entra con su propio retardo: el
// movimiento está en una sola palabra para que el resto del titular quede quieto.
const PALABRAS = ["soñaste", "buscabas", "merecés", "esperabas"];
const ROTACION_MS = 2500;

// Parallax: la foto baja al 35% de la velocidad del scroll, así que "se queda
// atrás" mientras el titular se va. La capa mide 120% del alto y arranca 10%
// más arriba —con ese factor, el desplazamiento nunca llega a descubrir un
// borde mientras la sección está a la vista.
const FACTOR_PARALLAX = 0.35;

function useParallax() {
  const [desplazamiento, setDesplazamiento] = useState(0);

  useEffect(() => {
    // Sin movimiento si el sistema lo pide: acá no alcanza con acortar la
    // transición, hay que no mover la foto en absoluto.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pedido = null;
    const alScrollear = () => {
      if (pedido !== null) return;
      // rAF: el scroll dispara mucho más seguido de lo que el navegador pinta.
      pedido = requestAnimationFrame(() => {
        setDesplazamiento(window.scrollY * FACTOR_PARALLAX);
        pedido = null;
      });
    };

    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScrollear);
      if (pedido !== null) cancelAnimationFrame(pedido);
    };
  }, []);

  return desplazamiento;
}

function SeccionHeroe() {
  const [estaVisible, setEstaVisible] = useState(false);
  const [indice, setIndice] = useState(0);
  const desplazamiento = useParallax();

  useEffect(() => {
    setEstaVisible(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setIndice((prev) => (prev + 1) % PALABRAS.length), ROTACION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* El showroom, con los vehículos a la derecha: el titular entra sobre el
          piso vacío de la izquierda, que es donde la foto tiene aire. El velo
          asegura el contraste del texto cuando la foto se recorta en mobile. */}
      <div
        className="absolute inset-x-0 -top-[10%] h-[120%] will-change-transform"
        style={{ transform: `translate3d(0, ${desplazamiento}px, 0)` }}
      >
        <Image
          src="/images/showroom.png"
          alt="Showroom de Ortega Automotores con vehículos en exhibición"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center]"
        />
      </div>

      {/* Dos velos en una sola capa: el de arriba despeja la franja de la
          navegación —el cielorraso de la foto es oscuro justo ahí— y el
          lateral despeja la columna del titular. Van como un solo
          background-image en vez de dos divs con utilidades de degradado
          apiladas, que se pisaban las custom properties entre sí.
          Fuera de la capa del parallax: los velos se anclan a la sección, no
          viajan con la foto. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(to bottom, var(--piso) 3%, transparent 14%)",
            "linear-gradient(to right, var(--piso) 22%, transparent 62%)",
          ].join(", "),
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-28 lg:py-0 lg:min-h-screen flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 items-center">
          <div className="flex flex-col justify-center lg:pr-12">
            <div
              className={`mb-6 lg:mb-8 transition-all duration-700 ${
                estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="inline-flex items-center gap-3 text-sm lg:text-base font-mono">
                <span className="w-6 h-px bg-brand" />
                <span className="w-2 h-2 rounded-full bg-brand" />
                Encontrá tu vehículo perfecto
              </span>
            </div>

            <div className="mb-8 lg:mb-10">
              <h1
                className={`text-[clamp(3rem,8vw,7rem)] font-display font-black leading-[0.85] tracking-tighter transition-all duration-1000 ${
                  estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <span className="block text-foreground">El auto que</span>
                <span className="relative block text-brand overflow-hidden h-[1.1em]">
                  <span key={indice} className="absolute inset-0 flex items-center animate-word-in">
                    {PALABRAS[indice].split("").map((char, i) => (
                      <span
                        key={`${indice}-${i}`}
                        className="inline-block animate-char-in"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                </span>
              </h1>
            </div>

            <p
              className={`text-base lg:text-lg text-foreground/80 leading-relaxed mb-8 lg:mb-10 max-w-lg transition-all duration-700 delay-200 ${
                estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Autos y motos nuevos y usados. Financiamiento flexible, aceptamos tu vehículo como
              parte de pago.
            </p>

            <div
              className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${
                estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Boton
                size="lg"
                className="bg-brand text-white hover:bg-white hover:text-brand hover:border hover:border-brand px-8 h-14 text-base rounded-full group transition-all duration-300"
                asChild
              >
                <a href="#catalogo">
                  Ver catálogo
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </a>
              </Boton>
              <Boton
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base rounded-full border-foreground/20 hover:bg-foreground/5"
                asChild
              >
                <a href="#contacto">
                  <Car className="w-4 h-4 mr-2" />
                  Contacto
                </a>
              </Boton>
            </div>
          </div>

          {/* Columna vacía: deja ver el vehículo de la foto de fondo en desktop. */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

export { SeccionHeroe };
