import { Car, Bike, Truck, createLucideIcon } from "lucide-react";

// Ícono propio de pick-up (lucide no trae uno): trazo de 24x24 al estilo lucide,
// para distinguir la camioneta del camión.
const PickUp = createLucideIcon("PickUp", [
  ["path", { d: "M4.5 17H2v-4h9V7h4.5l3.5 5h2a1 1 0 0 1 1 1v4h-1.5", key: "carroceria" }],
  ["path", { d: "M8.5 17h6", key: "piso" }],
  ["path", { d: "M14 7v5h5", key: "ventana" }],
  ["circle", { cx: "6.5", cy: "17", r: "2", key: "rueda1" }],
  ["circle", { cx: "16.5", cy: "17", r: "2", key: "rueda2" }],
]);

// Los tipos de vehículo, en las palabras que usa el cliente. Los mismos valores
// que valida el backend (lib/tipos-vehiculo.js). Camioneta incluye SUV, pick-ups
// y furgones.
export const TIPOS_VEHICULO = [
  { valor: "auto", label: "Auto", plural: "Autos", icono: Car },
  { valor: "camioneta", label: "Camioneta", plural: "Camionetas", icono: PickUp },
  { valor: "camion", label: "Camión", plural: "Camiones", icono: Truck },
  { valor: "moto", label: "Moto", plural: "Motos", icono: Bike },
];

// Un valor desconocido se muestra como auto, igual que lo guarda el backend.
export const tipoVehiculo = (valor) => TIPOS_VEHICULO.find((t) => t.valor === valor) ?? TIPOS_VEHICULO[0];
