import { Navegacion } from "@/components/inicio/navegacion";
import { SeccionHeroe } from "@/components/inicio/seccion-heroe";
import { SeccionCatalogo } from "@/components/inicio/seccion-catalogo";
import { SeccionServicios } from "@/components/inicio/seccion-servicios";
import { SeccionEntregas } from "@/components/inicio/seccion-entregas";
import { SeccionNosotros } from "@/components/inicio/seccion-nosotros";
import { SeccionComoComprar } from "@/components/inicio/seccion-como-comprar";
import { SeccionPreguntas } from "@/components/inicio/seccion-preguntas";
import { SeccionContacto } from "@/components/inicio/seccion-contacto";
import { SeccionPie } from "@/components/inicio/seccion-pie";
import { BotonWhatsApp } from "@/components/inicio/boton-whatsapp";

// Orden de lectura: qué vendemos (hero, catálogo) → qué ofrecemos (servicios)
// → prueba social (entregas) → quiénes somos → cómo se compra → objeciones
// (preguntas) → dónde encontrarnos (contacto, pie).
//
// Nosotros va en banda invertida, más o menos a la mitad: corta la seguidilla
// de bloques claros.
//
// El stock, las fotos de entregas, la dirección y los horarios salen de la API:
// esas secciones se actualizan solas desde el panel, sin tocar código.
export default function Inicio() {
  // overflow-x-clip y no -hidden: `hidden` convierte al main en contenedor de
  // scroll y rompe el `position: sticky` de la foto de Servicios. `clip`
  // recorta igual, sin crear ese contexto.
  return (
    <main className="inicio relative min-h-screen overflow-x-clip noise-overlay">
      <Navegacion />
      <SeccionHeroe />
      <SeccionCatalogo />
      <SeccionServicios />
      <SeccionEntregas />
      <SeccionNosotros />
      <SeccionComoComprar />
      <SeccionPreguntas />
      <SeccionContacto />
      <SeccionPie />
      <BotonWhatsApp />
    </main>
  );
}
