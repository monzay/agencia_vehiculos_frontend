import { Hoja, Encabezado, Dato, Firmas } from "./hoja";
import { DE_QUIEN, fecha, fechaLarga, hora, nombreCompleto } from "./etiquetas";
import { dni } from "../formato";

// El compromiso de transferencia que la agencia le da al vendedor. Es el papel
// que el vendedor guarda para protegerse: mientras el auto siga a su nombre, las
// multas y un eventual choque le llegan a él. Con esto tiene la fecha límite y
// el respaldo para hacer la denuncia de venta si la agencia no transfiere.

export function CompromisoTransferencia({ datos }) {
  const { vehiculo, condiciones: c, titular, agencia } = datos;
  const auto = [
    `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})`,
    `dominio ${vehiculo.dominio}`,
    vehiculo.motor && `motor ${vehiculo.motor}`,
    vehiculo.chasis && `chasis ${vehiculo.chasis}`,
  ]
    .filter(Boolean)
    .join(", ");

  const obligaciones = [
    `Inscribir la transferencia del dominio a su nombre o de un tercero dentro de los ${c.transferencia.dias} días corridos desde la entrega, es decir, hasta el ${fecha(c.transferencia.vence)} inclusive.`,
    "Hacerse cargo, desde el momento de la entrega, de patentes, multas e infracciones, y de toda responsabilidad civil, penal y administrativa derivada del uso, la guarda o la circulación de la unidad.",
    `Los gastos de la transferencia quedan a cargo ${DE_QUIEN[c.transferencia.gastosACargo]}.`,
    "Vencido el plazo sin que la transferencia esté inscripta, el titular queda facultado a formular la denuncia de venta ante el Registro Seccional (art. 27, Decreto-Ley 6582/58), siendo a cargo de la agencia los gastos que ello ocasione.",
  ];

  return (
    <Hoja>
      <Encabezado agencia={agencia} titulo="Compromiso de transferencia" generado={datos.firmado ?? datos.generado} />
      <p className="text-[13px] leading-[1.55] mb-3">
        <strong>{agencia?.nombre ?? "La agencia"}</strong>
        {agencia?.direccion ? `, con domicilio en ${agencia.direccion},` : ""} recibió de <strong>{nombreCompleto(titular)}</strong> (DNI{" "}
        {dni(titular?.dni) ?? "—"}) el vehículo {auto}, el {fechaLarga(c.entrega)} a las {hora(c.entrega)} hs, y se compromete a:
      </p>

      <ol className="space-y-1.5 mb-4">
        {obligaciones.map((texto, i) => (
          <li key={texto} className="grid grid-cols-[1.6rem_1fr] text-[13px] leading-[1.55]">
            <span className="font-semibold tabular-nums opacity-60">{i + 1}</span>
            <p>{texto}</p>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-3 gap-x-6 border-t border-current/15 pt-2">
        <Dato etiqueta="Dominio">{vehiculo.dominio}</Dato>
        <Dato etiqueta="Entrega">{`${fecha(c.entrega)} ${hora(c.entrega)} hs`}</Dato>
        <Dato etiqueta="Transferir hasta el">{fecha(c.transferencia.vence)}</Dato>
      </div>

      <Firmas titular={titular} />
    </Hoja>
  );
}
