import { Navegacion } from "@/components/portada/navegacion";
import { SeccionPie } from "@/components/portada/seccion-pie";
import { DetalleVehiculo } from "@/components/catalogo/detalle-vehiculo";

const metadata = {
  title: "Detalle del vehículo | Sea Automotores",
  description:
    "Ficha completa del vehículo: fotos, ficha técnica, precio y beneficios vigentes.",
};

async function PaginaDetalleVehiculo({ params }) {
  const { ref } = await params;
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navegacion />
      <DetalleVehiculo refVehiculo={ref} />
      <SeccionPie />
    </main>
  );
}

export { PaginaDetalleVehiculo as default, metadata };
