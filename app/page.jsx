import { NavegacionHome } from "@/components/home/navegacion";
import { Heroe } from "@/components/home/heroe";
import { Destacados } from "@/components/home/destacados";
import { PorQueSea } from "@/components/home/por-que-sea";
import { Cierre } from "@/components/home/cierre";
import { Escena } from "@/components/home/movimiento";

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
