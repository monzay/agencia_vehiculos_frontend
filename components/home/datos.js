// Contenido de la portada. Vive separado de los componentes para que editar un
// texto no obligue a tocar el layout.
import { CreditCard, Repeat2, ShieldCheck } from "lucide-react";

const ENLACES = [
  { nombre: "Vehículos", href: "#vehiculos" },
  { nombre: "Por qué SEA", href: "#por-que" },
  { nombre: "Dónde estamos", href: "#contacto" },
];

// Franja de confianza bajo el hero: lo que la agencia resuelve, en cuatro datos.
const GARANTIAS = [
  ["Financiación", "Cuotas a tu medida"],
  ["Tu usado", "En parte de pago"],
  ["Garantía", "En todo el stock"],
  ["Showroom", "Jujuy · Lun a Sáb"],
];

const RAZONES = [
  {
    icono: CreditCard,
    titulo: "Financiación a tu medida",
    texto: "Armamos las cuotas según lo que podés pagar por mes. Sabés el total antes de firmar.",
  },
  {
    icono: Repeat2,
    titulo: "Tu usado, en parte de pago",
    texto: "Lo tasamos y lo descontamos del precio. Entregás uno, te llevás el otro.",
  },
  {
    icono: ShieldCheck,
    titulo: "Garantía en todo el stock",
    texto: "Cada vehículo pasa por revisión antes de publicarse. Autos y motos, 0 km y usados.",
  },
];

export { ENLACES, GARANTIAS, RAZONES };
