"use client";
import { Plus } from "lucide-react";
import { usarEnVista } from "@/hooks/usar-en-vista";

// Acordeón con <details>/<summary>: se abre y se cierra sin JavaScript, ya
// viene navegable por teclado y lo lee un lector de pantalla sin que haya que
// cablear roles ni aria-expanded a mano.
//
// TODO CONTENIDO: las tres últimas respuestas las redactamos con lo que dice el
// resto del sitio (financiación bancaria o propia, trámites por cuenta de la
// agencia, consultas por WhatsApp). Confirmarlas con la agencia antes de
// publicar — sobre todo la documentación exacta que piden para financiar.
const PREGUNTAS = [
  {
    pregunta: "¿Aceptan usados?",
    respuesta:
      "Sí. Lo tasamos y descontamos ese valor del precio del vehículo que elijas. Podés traerlo al showroom o mandarnos fotos por WhatsApp para una estimación previa.",
  },
  {
    pregunta: "¿Financian?",
    respuesta:
      "Sí. Armamos las cuotas según lo que podés pagar por mes y sabés el total antes de firmar. La aprobación demora hasta 24 horas.",
  },
  {
    pregunta: "¿Qué documentación necesito?",
    respuesta:
      "Para comprar, DNI. Si vas a financiar, sumamos recibo de sueldo o garante. Si entregás un usado, traé el título y la cédula verde a tu nombre.",
  },
  {
    pregunta: "¿Trabajan con bancos?",
    respuesta:
      "Sí, y también financiamos de forma directa por la casa. Comparamos las dos opciones con vos y te quedás con la cuota que te sirva.",
  },
  {
    pregunta: "¿Puedo reservar online?",
    respuesta:
      "La reserva no se hace desde la web: escribinos por WhatsApp desde la ficha del vehículo y un asesor te dice si sigue disponible y cómo dejarlo reservado.",
  },
];

function Pregunta({ item, indice }) {
  const { ref, estaVisible } = usarEnVista({ threshold: 0.15 });

  return (
    <details
      ref={ref}
      style={{ transitionDelay: `${indice * 60}ms` }}
      className={`group border-b border-border transition-all duration-700 ${
        estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 lg:py-7 [&::-webkit-details-marker]:hidden">
        <h3 className="font-display text-xl lg:text-2xl text-foreground transition-colors group-open:text-brand">
          {item.pregunta}
        </h3>
        <Plus
          className="w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45 group-open:text-brand"
          strokeWidth={1.5}
        />
      </summary>

      <p className="max-w-2xl pb-7 text-base leading-relaxed text-muted-foreground">
        {item.respuesta}
      </p>
    </details>
  );
}

function SeccionPreguntas() {
  const { ref, estaVisible } = usarEnVista();

  return (
    <section id="preguntas" className="relative py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          <div className="lg:col-span-4">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-brand" />
              Preguntas frecuentes
            </span>
            <h2
              ref={ref}
              className={`text-4xl lg:text-5xl font-display tracking-tight transition-all duration-700 ${
                estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Lo que casi
              <br />
              <span className="text-muted-foreground">siempre nos preguntan.</span>
            </h2>
          </div>

          <div className="lg:col-span-8 border-t border-border">
            {PREGUNTAS.map((item, i) => (
              <Pregunta key={item.pregunta} item={item} indice={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { SeccionPreguntas };
