"use client";
import { useStock } from "./stock";

// Tira de marcas. Sale del stock real, no de una lista escrita a mano: si mañana
// entra un Peugeot, aparece solo; si se vende el último Honda, desaparece.
//
// Cumple dos funciones a la vez. Una es informativa —qué marcas maneja la
// agencia se responde de un vistazo, sin abrir el catálogo—. La otra es de
// ritmo: entre la grilla de vehículos y los cuatro pasos hay dos bloques de
// retícula seguidos, y una banda de tipografía grande en movimiento los separa
// mejor que cualquier cantidad de aire.
//
// La lista va DUPLICADA en el DOM porque la animación desplaza el 50% del
// ancho: al llegar al final, la segunda copia ya está donde estaba la primera y
// el ciclo no tiene costura. La copia va oculta a lectores de pantalla.
function Marcas() {
  const stock = useStock();
  const marcas = [...new Set((stock ?? []).map((v) => v.brand).filter(Boolean))].sort();

  // Con menos de cuatro marcas la tira no llena el ancho y el bucle se ve.
  if (marcas.length < 4) return null;

  return (
    <section
      aria-label="Marcas disponibles en el showroom"
      className="overflow-hidden border-y border-[var(--linea)] py-10 md:py-14 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
    >
      <div className="marquee flex w-max">
        {[false, true].map((copia) => (
          <ul
            key={String(copia)}
            aria-hidden={copia || undefined}
            className="flex shrink-0 items-center"
          >
            {marcas.map((marca) => (
              <li key={marca} className="flex items-center">
                <span className="titular px-8 text-3xl whitespace-nowrap text-[var(--tinta)] md:px-12 md:text-5xl">
                  {marca}
                </span>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--linea)]"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

export { Marcas };
