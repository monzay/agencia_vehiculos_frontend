import { Hoja, Encabezado, Dato, Firmas } from "./hoja";
import { fecha, kilometros, nombreCompleto } from "./etiquetas";

// En qué estado entró la unidad. Es el papel que se mira cuando, al retirarla,
// aparece un golpe que nadie recuerda.

// Por qué la recibe la agencia. Las copias firmadas antes de que existieran la
// compra y la parte de pago no traen `modalidad`: son todas consignaciones.
const RECIBE = {
  consignacion: "recibe en consignación",
  compra: "recibe, por la compra celebrada,",
  permuta: "recibe como parte de pago",
};

export function ReciboRecepcion({ datos }) {
  const { recepcion, vehiculo } = datos;
  return (
    <Hoja>
      <Encabezado agencia={datos.agencia} titulo="Recibo de recepción de la unidad" generado={datos.firmado ?? datos.generado} />
      <p className="text-[13px] mb-3">
        La agencia {RECIBE[datos.modalidad ?? "consignacion"]} el vehículo <strong>{`${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})`}</strong>, dominio{" "}
        <strong>{vehiculo.dominio}</strong>, propiedad de <strong>{nombreCompleto(datos.titular)}</strong>.
      </p>

      <div className="grid grid-cols-2 gap-x-6 mb-3">
        <Dato etiqueta="Kilómetros">{kilometros(recepcion.kmRecepcion)}</Dato>
        <Dato etiqueta="Fecha de recepción">{fecha(recepcion.recibido)}</Dato>
        <Dato etiqueta="Motor">{vehiculo.motor}</Dato>
        <Dato etiqueta="Chasis">{vehiculo.chasis}</Dato>
      </div>

      <div className="mb-3">
        <p className="text-[11px] uppercase tracking-wide opacity-60 mb-1">Estado de la unidad</p>
        <p className="text-[13px] leading-relaxed border border-current/30 rounded p-2 min-h-[60px]">
          {recepcion.estadoUnidad || "Sin observaciones."}
        </p>
      </div>

      <p className="text-[11px] opacity-70">
        Recibido por {recepcion.recibidoPor?.nombre ?? "—"}. Las fotos del peritaje quedan archivadas en el legajo digital de este ingreso.
      </p>

      <Firmas titular={datos.titular} />
    </Hoja>
  );
}
