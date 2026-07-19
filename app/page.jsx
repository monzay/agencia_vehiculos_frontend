import { NavegacionHome } from "@/components/home/navegacion";
import { Heroe } from "@/components/home/heroe";
import { Destacados } from "@/components/home/destacados";
import { PorQueSea } from "@/components/home/por-que-sea";
import { Cierre } from "@/components/home/cierre";
import { Escena } from "@/components/home/movimiento";

// Portada de SEA Automotores. Cada sección es su propio componente en
// components/home/ (nav flotante, hero, últimos ingresos desde la API, motivos
// y cierre/pie). Server component: solo ensambla; la interactividad vive en cada
// pieza ("use client"). La coreografía (framer-motion) sale de components/home/
// movimiento.jsx y Escena respeta prefers-reduced-motion en toda la escena.
//
// El wrapper `.home` es obligatorio: los tokens de la portada (--tinta, --rojo,
// --nieve…) y las clases .tipo-titulo/.pasada-luz están scopeados a `.home` en
// globals.css. Sin él, los colores de marca no resuelven.
export default function Portada() {
  return (
    <Escena>
      <div className="home">
        <NavegacionHome />
        <main>
          <Heroe />
          <Destacados />
          <PorQueSea />
        </main>
        <Cierre />
      </div>
    </Escena>
  );
}
