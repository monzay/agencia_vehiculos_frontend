"use client";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Boton } from "@/components/interfaz/boton";
import { SelectorAsesor } from "@/components/inicio/selector-asesor";
import { usarEnVista } from "@/hooks/usar-en-vista";

// Dos columnas: la foto del showroom acompaña el recorrido —va sticky, así se
// mantiene al lado del paso que estás leyendo— y hace de masa negra contra el
// hormigón.
//
// Los pasos SÍ están numerados: son una secuencia real y el orden es
// información que el cliente necesita. Es lo único numerado de la portada,
// justamente para que numerar signifique algo.
//
// TODO CONTENIDO: el paso 04 lo completamos nosotros — en el flujo que pasó el
// cliente ese casillero venía vacío. Confirmar con la agencia qué pasa entre
// que responde el asesor y que se retira el vehículo.
const PASOS = [
  {
    titulo: "Elegís el vehículo",
    texto: "Mirá el catálogo y quedate con el que te cierra. Cada ficha tiene fotos reales, kilómetros y precio.",
  },
  {
    titulo: "Consultás por WhatsApp",
    texto: "Tocás «Consultar» en la ficha y se abre el chat con la referencia del vehículo ya cargada.",
  },
  {
    titulo: "Te atiende un asesor",
    texto: "Alguien del equipo te responde, te saca las dudas y coordinan el día para verlo en el showroom.",
  },
  {
    titulo: "Acordás la forma de pago",
    texto: "Definís si financiás, si entregás tu usado o si pagás de contado. De los papeles nos ocupamos nosotros.",
  },
  {
    titulo: "Retirás tu vehículo",
    texto: "Te avisamos cuando la documentación está lista y venís a buscar las llaves.",
  },
];

// El punto numerado y, colgando de él, el tramo de línea hasta el paso
// siguiente. El último no lleva tramo: quedaría colgando fuera del recorrido.
function Paso({ paso, indice, ultimo }) {
  const { ref, estaVisible } = usarEnVista({ threshold: 0.2 });

  return (
    <li
      ref={ref}
      style={{ transitionDelay: `${indice * 80}ms` }}
      className={`flex gap-5 transition-all duration-700 ${
        estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="flex flex-col items-center">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand font-mono text-[11px] text-white tabular-nums">
          {String(indice + 1).padStart(2, "0")}
        </span>
        {!ultimo && <span className="w-px flex-1 bg-brand/25" aria-hidden="true" />}
      </div>

      <div className={ultimo ? "pb-10" : "pb-9"}>
        <h3 className="font-display text-xl lg:text-2xl text-foreground">{paso.titulo}</h3>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{paso.texto}</p>
      </div>
    </li>
  );
}

function SeccionComoComprar() {
  const { ref, estaVisible } = usarEnVista();

  return (
    <section id="como-comprar" className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="relative aspect-4/3 lg:aspect-[3/4] overflow-hidden bg-secondary lg:sticky lg:top-28">
              <Image
                src="/images/showroom-camioneta.png"
                alt="Camioneta en exhibición en el showroom de SEA Automotores"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-brand" />
              Cómo comprar
            </span>

            <h2
              ref={ref}
              className={`text-4xl lg:text-5xl font-display tracking-tight transition-all duration-700 ${
                estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              De la ficha a las llaves,
              <br />
              <span className="text-muted-foreground">en cinco pasos.</span>
            </h2>

            <ol className="mt-12 lg:mt-16">
              {PASOS.map((paso, i) => (
                <Paso key={paso.titulo} paso={paso} indice={i} ultimo={i === PASOS.length - 1} />
              ))}
            </ol>

            <SelectorAsesor cuerpo="Quería consultar por un vehículo.">
              <Boton
                size="lg"
                className="bg-brand hover:bg-brand-light text-white h-12 lg:h-14 px-8 rounded-full text-sm lg:text-base group"
              >
                Empezar por WhatsApp
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Boton>
            </SelectorAsesor>
          </div>
        </div>
      </div>
    </section>
  );
}

export { SeccionComoComprar };
