import { Navegacion } from "@/components/inicio/navegacion";
import { SeccionPie } from "@/components/inicio/seccion-pie";
import { BotonWhatsApp } from "@/components/inicio/boton-whatsapp";
import { DetalleVehiculo } from "@/components/catalogo/detalle-vehiculo";

const metadata = {
  title: "Detalle del vehículo | Sea Automotores",
  description:
    "Ficha completa del vehículo: fotos, ficha técnica, precio y beneficios vigentes.",
};

async function PaginaDetalleVehiculo({ params }) {
  const { ref } = await params;
  return (
    // `inicio`: misma dirección visual que la portada y que el listado.
    <main className="inicio relative min-h-screen overflow-x-clip noise-overlay">
      <Navegacion />
      <DetalleVehiculo refVehiculo={ref} />
      <SeccionPie />
      <BotonWhatsApp />
    </main>
  );
}

export { PaginaDetalleVehiculo as default, metadata };
