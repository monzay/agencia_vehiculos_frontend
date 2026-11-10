// Las formas en que la agencia toma o vende un vehículo. Los `id` son los
// valores del enum `consignacion_ingresos.modalidad`.
//
// En la consignación y la compra la agencia recibe el auto del cliente (con sus
// papeles). En la parte de pago y la venta al contado la agencia vende un auto
// de su stock; en la parte de pago el cliente puede, además, entregar un usado.
export const MODALIDADES = [
  { id: "consignacion", label: "Consignación", nuevo: "Nueva consignación", contrato: "Contrato de consignación" },
  // "permuta" es el valor en la base; para el usuario es la venta de un auto de
  // la agencia que se puede pagar con un usado, plata y cuotas.
  { id: "permuta", label: "Parte de pago o financiado", nuevo: "Nueva parte de pago o financiado", contrato: "Boleto de compraventa con parte de pago" },
  { id: "contado", label: "Venta al contado", nuevo: "Nueva venta al contado", contrato: "Boleto de compraventa" },
  { id: "compra", label: "Compra de la agencia", nuevo: "Nueva compra", contrato: "Boleto de compraventa" },
];

export const MODALIDAD = Object.fromEntries(MODALIDADES.map((m) => [m.id, m]));

// La agencia vende un auto propio: el boleto lleva el vehículo del stock.
export const vendeLaAgencia = (modalidad) => modalidad === "permuta" || modalidad === "contado";

// Un boleto nuevo arranca con el precio del auto. Si la venta es al contado y el
// auto tiene precio al contado, arranca con ese.
export const precioInicialDelBoleto = (modalidad, auto) =>
  (modalidad === "contado" && auto?.precioContado) || auto?.precio;

// Lo que se propone que deje el cliente: sin usado, el anticipo del vehículo; con
// usado nada, porque ahí lo normal es que deje otro monto.
export const anticipoSugerido = (entregaUsado, anticipo) => (entregaUsado || anticipo == null ? "" : String(anticipo));

// Lo sugerido sigue a los cambios de vehículo o de usado; lo que escribió el admin se respeta.
export const seguirSugerencia = (actual, anterior, nueva) => (actual === anterior ? nueva : actual);
