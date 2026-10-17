import { Car, Bike, Truck } from "lucide-react";

// Los tipos de vehículo, en las palabras que usa el cliente. Los mismos valores
// que valida el backend (lib/tipos-vehiculo.js).
export const TIPOS_VEHICULO = [
  { valor: "auto", label: "Auto", plural: "Autos", icono: Car },
  { valor: "camioneta", label: "Camioneta", plural: "Camionetas", icono: Truck },
  { valor: "moto", label: "Moto", plural: "Motos", icono: Bike },
];

// Un valor desconocido se muestra como auto, igual que lo guarda el backend.
export const tipoVehiculo = (valor) => TIPOS_VEHICULO.find((t) => t.valor === valor) ?? TIPOS_VEHICULO[0];
