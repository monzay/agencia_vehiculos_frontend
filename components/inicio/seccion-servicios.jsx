"use client";
import { ShieldCheck, BadgeCheck, CreditCard, MessagesSquare, Truck, Repeat2 } from "lucide-react";
import { usarEnVista } from "@/hooks/usar-en-vista";

// La sección va a sangre sobre el hormigón, no sobre el papel: es una banda de
// material que corta la seguidilla de bloques blancos. Las celdas quedan en
// blanco encima, y lo que las separa es el fondo asomando entre ellas
// (gap-px sobre --linea), no un borde por celda.
//
// Densidad antes que aire: ícono y título en la misma línea, padding corto y
// el índice mono al margen. La versión anterior tenía celdas altas con el
// ícono suelto arriba y media sección en blanco.
//
// TODO CONTENIDO: "Entrega en todo el país" hay que confirmarlo con la agencia
// — el resto del sitio se presenta como una agencia de barrio de Jujuy, y
// prometer envío nacional sin poder cumplirlo es un problema, no un beneficio.
const SERVICIOS = [
  {
    icono: ShieldCheck,
    titulo: "Vehículos inspeccionados",
    texto: "Cada unidad pasa por revisión mecánica antes de publicarse. Si está en el catálogo, ya la revisamos.",
  },
  {
    icono: BadgeCheck,
    titulo: "Garantía",
    texto: "Todo el stock sale con garantía, tanto los 0 km como los usados.",
  },
  {
    icono: CreditCard,
    titulo: "Financiación inmediata",
    texto: "Bancaria o directa por la casa. Sabés la cuota final antes de firmar nada.",
  },
  {
    icono: MessagesSquare,
    titulo: "Atención personalizada",
    texto: "Un asesor te acompaña desde la primera consulta hasta que te llevás las llaves.",
  },
  {
    icono: Truck,
    titulo: "Entrega en todo el país",
    texto: "Coordinamos el envío del vehículo a tu provincia si no podés venir al showroom.",
  },
  {
    icono: Repeat2,
    titulo: "Aceptamos usados",
    texto: "Tu auto o tu moto entran como parte de pago. Los tasamos en el día y sin compromiso.",
  },
];

function Servicio({ servicio, indice }) {
  const { ref, estaVisible } = usarEnVista({ threshold: 0.15 });
  const Icono = servicio.icono;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${indice * 60}ms` }}
      className={`group relative flex gap-4 bg-card px-6 py-7 transition-all duration-700 lg:px-7 ${
        estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {/* El hilo, al margen: se traza de arriba abajo en la celda que mirás. */}
      <span
        className="absolute inset-y-0 left-0 h-0 w-px bg-brand transition-[height] duration-500 ease-out group-hover:h-full"
        aria-hidden="true"
      />

      <Icono className="mt-0.5 h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} />

      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <h3 className="font-display text-lg lg:text-xl text-foreground">{servicio.titulo}</h3>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
            {String(indice + 1).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{servicio.texto}</p>
      </div>
    </div>
  );
}

function SeccionServicios() {
  const { ref, estaVisible } = usarEnVista();

  return (
    <section id="servicios" className="relative bg-[var(--hormigon)] py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Encabezado de una línea: el titular a la izquierda y la bajada a la
            derecha, sobre el mismo filo. Antes el titular ocupaba media fila y
            la otra media quedaba vacía. */}
        <div
          ref={ref}
          className={`flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:pb-10 transition-all duration-700 ${
            estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div>
            <span className="inline-flex items-center gap-3 font-mono text-xs tracking-[0.22em] uppercase text-muted-foreground mb-5">
              <span className="w-8 h-px bg-brand" />
              Servicios que ofrecemos
            </span>
            <h2 className="text-3xl lg:text-5xl font-display tracking-tight">
              Todo lo que necesitás.{" "}
              <span className="text-muted-foreground">En un solo lugar.</span>
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:text-right">
            Seis cosas que resolvemos nosotros para que vos solo elijas el vehículo.
          </p>
        </div>

        <div className="mt-px grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((servicio, i) => (
            <Servicio key={servicio.titulo} servicio={servicio} indice={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { SeccionServicios };
