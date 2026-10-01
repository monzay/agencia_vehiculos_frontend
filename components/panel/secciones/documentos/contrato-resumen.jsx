import { pesos } from "./impresos/etiquetas";

// El resumen de un contrato en el legajo: pares rótulo/valor y, abajo, los
// textos largos. Lo usan la consignación y el boleto de compraventa.
export function ListaResumen({ filas, textos = [] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
          <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
          <dd className="text-sm text-foreground text-right">{valor}</dd>
        </div>
      ))}
      {textos
        .filter(([, texto]) => texto)
        .map(([etiqueta, texto]) => (
          <div key={etiqueta} className="sm:col-span-2 pt-1">
            <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
            <dd className="text-sm text-foreground mt-0.5">{texto}</dd>
          </div>
        ))}
    </dl>
  );
}

// El texto pactado para el retiro puede ser largo: en el resumen se avisa que
// está y se lee completo en el contrato impreso.
function resumenRetiro({ avisoDias, costo, condiciones }) {
  const partes = [];
  if (avisoDias || costo) partes.push(`${avisoDias} días de aviso · ${pesos(costo)}`);
  if (condiciones) partes.push("+ lo pactado por escrito");
  return partes.join(" ") || "Sin condiciones";
}

export function ResumenContrato({ contrato }) {
  const comision = contrato.comision.tipo === "porcentaje" ? `${contrato.comision.valor} %` : pesos(contrato.comision.valor);
  const filas = [
    ["Precio de publicación", pesos(contrato.precioPublicacion)],
    ["Precio mínimo autorizado", pesos(contrato.precioMinimo)],
    ["Comisión", `${comision} · ${contrato.comision.incluida ? "sale del precio" : "se suma"}`],
    ["Plazo", `${contrato.plazoDias} días`],
    ["Verificación / libre deuda", `${contrato.gastos.verificacion} / ${contrato.gastos.libreDeuda}`],
    ["Lavado / publicación", `${contrato.gastos.lavado} / ${contrato.gastos.publicacion}`],
    ["Retiro anticipado", resumenRetiro(contrato.retiroAnticipado)],
    ["Prueba de manejo", contrato.pruebaManejo.permitida ? `Sí · responde ${contrato.pruebaManejo.responsable}` : "No"],
    ["Seguro a cargo de", contrato.seguroACargo],
    ["Liquidación", `${contrato.liquidacion.dias} días · ${contrato.liquidacion.forma}`],
  ];

  return <ListaResumen filas={filas} textos={[["Estado de la unidad", contrato.estadoUnidad]]} />;
}
