import { LimitesCostos } from "@/components/panel/limites-costos";

const metadata = {
  title: "Límites de costos | Ortega Automotores",
  description: "Gasto de IA y mensajes de WhatsApp del mes contra sus topes. Solo admin.",
};

// Ruta fija: Next la resuelve antes que /admin/[consultaId].
function PaginaLimites() {
  return (
    <main className="panel-dark min-h-screen">
      <LimitesCostos />
    </main>
  );
}

export { PaginaLimites as default, metadata };
