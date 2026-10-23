import { Panel } from "@/components/panel/panel";

const metadata = {
  title: "Panel de administración | Ortega Automotores",
  description:
    "Dashboard de leads: clientes que consultaron, ventas (quieren vender su vehículo) y clasificación.",
};

function PaginaAdmin() {
  return (
    <main className="panel-dark min-h-screen">
      <Panel />
    </main>
  );
}

export { PaginaAdmin as default, metadata };
