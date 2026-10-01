import { fechaSinHora } from "../formato";
import { Hoja, Encabezado, Firmas } from "./hoja";
import { TENENCIA, nombreCompleto } from "./etiquetas";

// Qué papeles dejó el cliente y dónde quedan. Es el respaldo de la cláusula 11
// del contrato: acá va el detalle completo, uno por uno.

export function ReciboDocumentacion({ datos }) {
  return (
    <Hoja>
      <Encabezado agencia={datos.agencia} titulo="Recibo de documentación entregada" generado={datos.firmado ?? datos.generado} />
      <p className="text-[13px] mb-3">
        Se deja constancia de que <strong>{nombreCompleto(datos.titular)}</strong> (DNI {datos.titular?.dni ?? "—"}) entregó a la agencia la
        siguiente documentación correspondiente al vehículo <strong>{datos.vehiculo.dominio}</strong>.
      </p>

      {datos.papelesEntregados.length ? (
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="border-b border-current/40 text-left">
              <th className="py-1.5 font-semibold">Documento</th>
              <th className="py-1.5 font-semibold">Se recibió</th>
              <th className="py-1.5 font-semibold">Dónde queda</th>
              <th className="py-1.5 font-semibold">Vence</th>
            </tr>
          </thead>
          <tbody>
            {datos.papelesEntregados.map((p) => (
              <tr key={p.tipo} className="border-b border-current/15">
                <td className="py-1.5">{p.label}</td>
                <td className="py-1.5">{TENENCIA[p.tenencia] ?? "—"}</td>
                <td className="py-1.5">{p.ubicacionFisica ?? "—"}</td>
                <td className="py-1.5">{p.fechaVencimiento ? fechaSinHora(p.fechaVencimiento) : "No vence"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[13px] italic">El titular no entregó documentación física en este acto.</p>
      )}

      {datos.papelesPendientes?.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wide opacity-60 mb-1">Pendiente de entrega</p>
          <p className="text-[12px]">
            El titular se compromete a entregar: {datos.papelesPendientes.map((p) => p.label).join(", ")}.
          </p>
        </div>
      )}

      <p className="text-[11px] opacity-70 mt-3">
        Lo listado arriba es lo que la agencia recibió físicamente y conserva hasta la transferencia o el retiro de la unidad. Los documentos
        que solo fueron digitalizados no figuran en este recibo.
      </p>

      <Firmas titular={datos.titular} />
    </Hoja>
  );
}
