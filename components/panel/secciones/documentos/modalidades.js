// Las tres formas en que la agencia toma un vehículo. Los `id` son los valores
// del enum `consignacion_ingresos.modalidad`.
//
// Los papeles del auto son los mismos en las tres; lo que cambia es el contrato
// y, en la consignación, que el auto se publica por cuenta del dueño.
export const MODALIDADES = [
  { id: "consignacion", label: "Consignación", nuevo: "Nueva consignación", contrato: "Contrato de consignación" },
  // "permuta" es el valor en la base; para el usuario es la venta de un auto de
  // la agencia con el usado del cliente en parte de pago.
  { id: "permuta", label: "Parte de pago", nuevo: "Nueva parte de pago", contrato: "Boleto de compraventa con parte de pago" },
  { id: "compra", label: "Compra directa", nuevo: "Nueva compra", contrato: "Boleto de compraventa" },
];

export const MODALIDAD = Object.fromEntries(MODALIDADES.map((m) => [m.id, m]));
