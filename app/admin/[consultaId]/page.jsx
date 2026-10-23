import { Panel } from "@/components/panel/panel";

const metadata = {
  title: "Consulta | Ortega Automotores",
  description: "Detalle de una consulta puntual del panel de administración.",
};

// Link directo a una consulta, usado por los avisos de lead que el bot manda al
// grupo de Telegram. Abre el panel en Consultas con esa consulta desplegada.
async function PaginaConsulta({ params }) {
  const { consultaId } = await params;

  return (
    <main className="panel-dark min-h-screen">
      <Panel consultaId={consultaId} />
    </main>
  );
}

export { PaginaConsulta as default, metadata };
