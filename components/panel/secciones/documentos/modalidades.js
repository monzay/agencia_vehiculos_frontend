// Las tres formas en que la agencia toma un vehículo. Cada una define un
// circuito de papeles distinto. Solo consignación está implementada; las otras
// dos esperan a que se definan sus requisitos.
export const MODALIDADES = [
  { id: "consignacion", label: "Consignación", activa: true },
  { id: "parte-de-pago", label: "Parte de pago", activa: false },
  { id: "compra-directa", label: "Compra directa", activa: false },
];
