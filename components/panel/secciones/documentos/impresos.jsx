"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X, Loader2 } from "lucide-react";
import { obtenerImpresosIngreso } from "@/lib/api";
import { Boton } from "../../ui/boton";
import { fechaSinHora } from "./formato";

// Los tres papeles que se le entregan al cliente, armados de la misma fuente:
//   1. Contrato de consignación (por duplicado)
//   2. Recibo de documentación entregada
//   3. Recibo de recepción de la unidad
//
// No se genera un PDF en el servidor: se imprime la hoja desde el navegador, y
// "Guardar como PDF" del diálogo de impresión da el archivo. Una dependencia
// menos y lo que se ve en pantalla es exactamente lo que sale impreso.

const pesos = (n) => (n == null ? "—" : `$ ${Math.round(n).toLocaleString("es-AR")}`);
const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR") : "—");
const A_CARGO = { agencia: "La agencia", cliente: "El cliente" };
const FORMAS = { transferencia: "transferencia bancaria", efectivo: "efectivo", cheque: "cheque" };
// Qué dejó el cliente de cada papel. Snapshots viejos pueden no traerlo.
const TENENCIA = { original: "Original", copia: "Fotocopia" };
const originales = (papeles) => papeles.filter((p) => p.tenencia === "original");

const nombreCompleto = (p) => (p ? [p.nombre, p.apellido].filter(Boolean).join(" ") || "—" : "—");

function Dato({ etiqueta, children }) {
  return (
    <div className="py-1">
      <span className="text-[11px] uppercase tracking-wide opacity-60">{etiqueta}</span>
      <div className="text-sm">{children ?? "—"}</div>
    </div>
  );
}

function Clausula({ n, titulo, children }) {
  return (
    <section className="mb-3">
      <h3 className="text-[13px] font-semibold mb-0.5">
        {n}. {titulo}
      </h3>
      <p className="text-[13px] leading-relaxed">{children}</p>
    </section>
  );
}

// Firma el titular y la agencia. Los contratos firmados antes de sacar al
// cónyuge (migración 044) pueden traerlo en su copia congelada: no se muestra.
function Firmas({ titular }) {
  const lineas = [`${nombreCompleto(titular)} — DNI ${titular?.dni ?? "—"}`, "Por la agencia"];

  return (
    <div className="grid grid-cols-2 gap-8 mt-10">
      {lineas.map((l) => (
        <div key={l} className="text-center">
          <div className="border-t border-current/40 pt-1 text-[11px]">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Encabezado({ agencia, titulo, generado }) {
  return (
    <header className="flex items-start justify-between border-b border-current/30 pb-2 mb-4">
      <div>
        <p className="text-sm font-semibold">{agencia?.nombre ?? "Agencia"}</p>
        {agencia?.direccion && <p className="text-[11px] opacity-70">{agencia.direccion}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold uppercase tracking-wide">{titulo}</p>
        <p className="text-[11px] opacity-70">{fecha(generado)}</p>
      </div>
    </header>
  );
}

function DatosPartes({ datos }) {
  const { titular, vehiculo } = datos;
  return (
    <div className="grid grid-cols-2 gap-x-6 mb-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">Titular</p>
        <Dato etiqueta="Nombre">{nombreCompleto(titular)}</Dato>
        <Dato etiqueta="DNI / CUIT">{[titular?.dni, titular?.cuit].filter(Boolean).join(" · ")}</Dato>
        <Dato etiqueta="Domicilio">{[titular?.domicilio, titular?.localidad, titular?.provincia].filter(Boolean).join(", ")}</Dato>
        <Dato etiqueta="Teléfono">{titular?.telefono}</Dato>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">Vehículo</p>
        <Dato etiqueta="Dominio">{vehiculo.dominio}</Dato>
        <Dato etiqueta="Marca y modelo">{`${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})`}</Dato>
        <Dato etiqueta="Motor / chasis">{[vehiculo.motor, vehiculo.chasis].filter(Boolean).join(" · ")}</Dato>
        <Dato etiqueta="Kilómetros al recibirlo">{vehiculo.kmRecepcion?.toLocaleString("es-AR")}</Dato>
      </div>
    </div>
  );
}

function Contrato({ datos, copia }) {
  const c = datos.condiciones;
  const comision = c.comision.tipo === "porcentaje" ? `${c.comision.valor} %` : pesos(c.comision.valor);
  const deDonde = c.comision.incluida ? "se descuenta del precio de venta" : "se suma por encima del precio";

  return (
    <article>
      <Encabezado agencia={datos.agencia} titulo={`Contrato de consignación — ${copia}`} generado={datos.firmado ?? datos.generado} />
      <DatosPartes datos={datos} />

      <Clausula n={1} titulo="Objeto">
        El titular entrega el vehículo descripto a la agencia para su exhibición y venta por cuenta y orden del titular. El vehículo
        permanece a nombre del titular hasta su transferencia.
      </Clausula>
      <Clausula n={2} titulo="Precio mínimo autorizado">
        La agencia no podrá cerrar la venta por un valor inferior a <strong>{pesos(c.precioMinimo)}</strong> sin autorización expresa del
        titular.
      </Clausula>
      <Clausula n={3} titulo="Comisión">
        La comisión de la agencia es de <strong>{comision}</strong> y {deDonde}.
      </Clausula>
      <Clausula n={4} titulo="Plazo">
        La agencia dispone del vehículo por <strong>{c.plazoDias} días</strong> contados desde la firma.
      </Clausula>
      <Clausula n={5} titulo="Gastos">
        Verificación policial: {A_CARGO[c.gastos.verificacion]}. Libre deuda: {A_CARGO[c.gastos.libreDeuda]}. Lavado y preparación:{" "}
        {A_CARGO[c.gastos.lavado]}. Publicación: {A_CARGO[c.gastos.publicacion]}.
      </Clausula>
      <Clausula n={6} titulo="Retiro anticipado">
        {c.retiroAnticipado.avisoDias > 0 || c.retiroAnticipado.costo > 0
          ? `El titular puede retirar el vehículo antes del vencimiento avisando con ${c.retiroAnticipado.avisoDias} días de anticipación${
              c.retiroAnticipado.costo > 0 ? `, abonando ${pesos(c.retiroAnticipado.costo)} en concepto de gastos` : ""
            }.`
          : "El titular puede retirar el vehículo en cualquier momento, sin costo ni preaviso."}
      </Clausula>
      <Clausula n={7} titulo="Estado de la unidad">
        Recibida con {datos.vehiculo.kmRecepcion?.toLocaleString("es-AR") ?? "—"} km.{" "}
        {c.estadoUnidad || "Sin observaciones adicionales al momento de la recepción."}
      </Clausula>
      <Clausula n={8} titulo="Pruebas de manejo">
        {c.pruebaManejo.permitida
          ? `La agencia queda autorizada a realizar pruebas de manejo con interesados. Ante cualquier siniestro responde ${A_CARGO[
              c.pruebaManejo.responsable
            ].toLowerCase()}.`
          : "La agencia no está autorizada a circular con el vehículo."}
      </Clausula>
      <Clausula n={9} titulo="Seguro">
        La cobertura del vehículo mientras permanece en la agencia queda a cargo de {A_CARGO[c.seguroACargo].toLowerCase()}.
      </Clausula>
      <Clausula n={10} titulo="Liquidación">
        Concretada la venta, la agencia liquidará al titular dentro de los <strong>{c.liquidacion.dias} días</strong>, por{" "}
        {FORMAS[c.liquidacion.forma]}
        {datos.titular?.cbu ? ` a la cuenta CBU ${datos.titular.cbu}` : ""}.
      </Clausula>
      <Clausula n={11} titulo="Documentación entregada">
        {originales(datos.papelesEntregados).length
          ? `Quedan en poder de la agencia, en original: ${originales(datos.papelesEntregados)
              .map((p) => p.label)
              .join(", ")}. El detalle completo consta en el recibo adjunto.`
          : "La agencia no retiene documentación original del vehículo."}
      </Clausula>

      <Firmas titular={datos.titular} />
    </article>
  );
}

function ReciboDocumentacion({ datos }) {
  return (
    <article className="salto-pagina">
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
    </article>
  );
}

function ReciboRecepcion({ datos }) {
  const { recepcion, vehiculo } = datos;
  return (
    <article className="salto-pagina">
      <Encabezado agencia={datos.agencia} titulo="Recibo de recepción de la unidad" generado={datos.firmado ?? datos.generado} />
      <p className="text-[13px] mb-3">
        La agencia recibe en consignación el vehículo <strong>{`${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})`}</strong>, dominio{" "}
        <strong>{vehiculo.dominio}</strong>, propiedad de <strong>{nombreCompleto(datos.titular)}</strong>.
      </p>

      <div className="grid grid-cols-2 gap-x-6 mb-3">
        <Dato etiqueta="Kilómetros">{recepcion.kmRecepcion?.toLocaleString("es-AR")}</Dato>
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
    </article>
  );
}

export function Impresos({ ingresoId, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    let activo = true;
    obtenerImpresosIngreso(ingresoId)
      .then((d) => activo && setDatos(d))
      .catch((e) => activo && setError(e.message));
    return () => {
      activo = false;
    };
  }, [ingresoId]);

  if (!montado) return null;

  return createPortal(
    <div className="hoja-impresion fixed inset-0 z-50 bg-white text-black overflow-y-auto">
      <div className="sin-imprimir sticky top-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10 bg-white">
        <p className="text-sm font-medium">
          Contrato y recibos
          {datos?.firmado && <span className="ml-2 text-xs text-black/50">Firmado el {fecha(datos.firmado)} — copia congelada</span>}
        </p>
        <div className="flex items-center gap-2">
          <Boton variante="primario" className="gap-1.5" onClick={() => window.print()} disabled={!datos}>
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </Boton>
          <button onClick={onCerrar} className="p-2 rounded-lg text-black/60 hover:text-black hover:bg-black/5" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-8 py-8">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!datos && !error && (
          <p className="flex items-center gap-2 text-sm text-black/60">
            <Loader2 className="w-4 h-4 animate-spin" /> Armando los documentos…
          </p>
        )}
        {datos && (
          <>
            <Contrato datos={datos} copia="original para el cliente" />
            <div className="salto-pagina">
              <Contrato datos={datos} copia="duplicado para la agencia" />
            </div>
            <ReciboDocumentacion datos={datos} />
            <ReciboRecepcion datos={datos} />
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
