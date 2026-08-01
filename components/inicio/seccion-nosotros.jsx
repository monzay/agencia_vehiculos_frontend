"use client";
import { usarEnVista } from "@/hooks/usar-en-vista";

// Única banda invertida de la portada: el canvas se da vuelta al negro de la
// plataforma de exhibición. Hasta acá se habló del stock; de acá en más, de
// quiénes lo venden. Cortar tres bloques claros seguidos es también lo que
// evita que la página se lea como un solo plano.
//
// En fondo oscuro el rojo de marca no llega a contraste para texto, así que
// acá el hilo aparece solo como línea —el filo superior de la banda—, que es
// justamente como se ve en las fotos del showroom.

// Registro institucional: quiénes somos, qué hacemos y con qué objetivo. Nada
// acá afirma más de lo que ya declara la sección de Servicios —revisión previa,
// garantía, financiación, toma de usados—; si algo de eso cambia, cambia acá.
const PARRAFOS = [
  "Somos una agencia familiar radicada en San Salvador de Jujuy, con showroom propio. Comercializamos autos y motos, 0 km y usados.",
  "Cada unidad se revisa antes de publicarse y se entrega con garantía. Trabajamos con financiación bancaria o directa de la casa, y tomamos vehículos usados como parte de pago.",
  "Nuestro objetivo es que cada cliente decida con la información completa: el estado real de la unidad, el precio final y las condiciones de pago, desde la primera consulta hasta la entrega.",
];

function SeccionNosotros() {
  const { ref, estaVisible } = usarEnVista();

  return (
    <section id="nosotros" className="relative bg-[var(--tinta)] text-[var(--piso)]">
      {/* El filo de la plataforma */}
      <span className="absolute inset-x-0 top-0 h-px bg-brand" aria-hidden="true" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <div
          ref={ref}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 transition-all duration-1000 ${
            estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-3 font-mono text-xs tracking-[0.22em] uppercase text-[var(--piso)]/45">
              <span className="w-8 h-px bg-brand" />
              Quiénes somos
            </span>

            <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-balance">
              Una agencia familiar
              <br />
              de Jujuy.
            </h2>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-end">
            <div className="flex max-w-lg flex-col gap-6">
              {PARRAFOS.map((parrafo) => (
                <p key={parrafo} className="text-base leading-[1.75] text-[var(--piso)]/65">
                  {parrafo}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { SeccionNosotros };
