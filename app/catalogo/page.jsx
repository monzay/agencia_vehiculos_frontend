import { Navegacion } from "@/components/inicio/navegacion";
import { SeccionPie } from "@/components/inicio/seccion-pie";
import { BotonWhatsApp } from "@/components/inicio/boton-whatsapp";
import { ContenidoCatalogo } from "@/components/catalogo/contenido-catalogo";

const metadata = {
  title: "Catálogo de Vehículos | Sea Automotores",
  description:
    "Explorá nuestro catálogo completo de vehículos nuevos y usados. Todos verificados y con garantía.",
};

function PaginaCatalogo() {
  return (
    // `inicio` es el esquema de la portada: el catálogo comparte dirección con
    // `/` para que pasar de una a otra no se sienta como cambiar de sitio.
    <main className="inicio relative min-h-screen overflow-x-clip noise-overlay">
      <Navegacion />
      <ContenidoCatalogo />
      <SeccionPie />
      <BotonWhatsApp />
    </main>
  );
}

export { PaginaCatalogo as default, metadata };
