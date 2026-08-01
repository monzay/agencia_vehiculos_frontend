// Contenido de la portada. Vive separado de los componentes para que editar un
// texto no obligue a tocar el layout.
import {
  CreditCard,
  Repeat2,
  ShieldCheck,
  Car,
  FileCheck2,
  Gauge,
  Handshake,
} from "lucide-react";

const ENLACES = [
  { nombre: "Vehículos", href: "#vehiculos" },
  { nombre: "Cómo comprar", href: "#como-comprar" },
  { nombre: "Entregas", href: "#entregas" },
  { nombre: "Nosotros", href: "#nosotros" },
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

// Cómo comprar: los cuatro pasos del proceso, en el orden en que los vive el cliente.
const PASOS_COMPRA = [
  {
    titulo: "Explorá el catálogo",
    texto:
      "Filtrá por marca, presupuesto y estilo. Cada ficha trae historial verificado y fotos reales.",
  },
  {
    titulo: "Reservá tu prueba",
    texto:
      "Coordinás un test drive a domicilio o en el showroom, el día y horario que te queden cómodos.",
  },
  {
    titulo: "Definí la financiación",
    texto:
      "Simulás la cuota, entregás tu usado si querés y aprobamos el crédito en 24 horas.",
  },
  {
    // TODO CONTENIDO: el texto original llegó cortado ("Nos ocupamos de toda la
    // documentación. E…"). Completado con lo que se entiende — revisar y ajustar.
    titulo: "Recibí tu auto",
    texto:
      "Nos ocupamos de toda la documentación: transferencia, verificación y patente. Vos solo venís a buscar las llaves.",
  },
];

// TODO CONTENIDO: servicios de ejemplo. Reemplazar por los que la agencia
// realmente presta antes de publicar.
const SERVICIOS = [
  {
    icono: Car,
    titulo: "Test drive a domicilio",
    texto: "Llevamos el vehículo a tu casa o trabajo para que lo pruebes sin moverte.",
  },
  {
    icono: Gauge,
    titulo: "Tasación de tu usado",
    texto: "Te decimos cuánto vale tu vehículo hoy, sin compromiso de venta.",
  },
  {
    icono: FileCheck2,
    titulo: "Gestoría y transferencia",
    texto: "Hacemos el trámite completo: transferencia, verificación policial y patente.",
  },
  {
    icono: Handshake,
    titulo: "Consignación",
    texto: "Dejás tu vehículo en el showroom y lo vendemos por vos.",
  },
];

// TODO CONTENIDO: texto institucional de ejemplo. Reemplazar por la historia
// real de la agencia (años, fundadores, cantidad de entregas) antes de publicar.
const SOBRE = {
  titulo: ["Una agencia", "de barrio"],
  parrafos: [
    "Somos una agencia familiar de Jujuy. Vendemos autos y motos, 0 km y usados, y acompañamos a cada cliente desde la primera consulta hasta que se lleva las llaves.",
    "Trabajamos con lo que tenemos en el showroom: nada de fotos de catálogo ni vehículos que no podés ver. Si está publicado, está acá.",
  ],
  // El guion es intencional: son los números que faltan completar.
  datos: [
    ["—", "años en el rubro"],
    ["—", "entregas por mes"],
    ["—", "vehículos en stock"],
  ],
};

// TODO CONTENIDO: preguntas de ejemplo, redactadas con lo que el bot ya responde.
// Revisar las respuestas con la agencia antes de publicar.
const PREGUNTAS = [
  {
    pregunta: "¿Tomás mi usado como parte de pago?",
    respuesta:
      "Sí. Lo tasamos y descontamos ese valor del precio del vehículo que elijas. Podés traerlo al showroom o mandarnos fotos por WhatsApp para una estimación previa.",
  },
  {
    pregunta: "¿Cómo funciona la financiación?",
    respuesta:
      "Armamos las cuotas según lo que podés pagar por mes. Necesitás DNI y recibo de sueldo o garante. La aprobación demora hasta 24 horas y sabés el total antes de firmar.",
  },
  {
    pregunta: "¿Los vehículos tienen garantía?",
    respuesta:
      "Todo el stock pasa por revisión mecánica antes de publicarse y sale con garantía, tanto los 0 km como los usados.",
  },
  {
    pregunta: "¿Puedo ver el vehículo antes de comprarlo?",
    respuesta:
      "Sí, y te lo recomendamos. Venís al showroom cuando quieras dentro del horario de atención, o coordinamos un test drive a domicilio.",
  },
  {
    pregunta: "¿Quién hace los trámites de transferencia?",
    respuesta:
      "Nosotros. Nos ocupamos de la transferencia, la verificación policial y la patente. Vos solo firmás.",
  },
];

// TODO CONTENIDO — PLACEHOLDER: NO PUBLICAR ASÍ.
//
// Estos testimonios NO son reales: son texto de maqueta con el largo y el tono
// que tendría una reseña de verdad, para poder ver la sección terminada. Sirven
// para diseñar, no para publicar — reseñas inventadas en un sitio comercial son
// publicidad engañosa (Ley 24.240).
//
// Para publicar: reemplazar por reseñas reales de Google Reviews o Facebook,
// con nombre y consentimiento del cliente, y borrar <AvisoPlaceholder /> en
// testimonios.jsx.
const TESTIMONIOS = [
  {
    nombre: "Nombre Apellido",
    detalle: "Compró un usado",
    texto:
      "Fui sin saber bien qué quería y me mostraron tres opciones dentro de lo que podía pagar. Me dejaron probar el auto, revisarlo con mi mecánico y recién ahí cerramos. Nadie me apuró.",
  },
  {
    nombre: "Nombre Apellido",
    detalle: "Entregó su usado",
    texto:
      "Entregué mi Corsa como parte de pago. La tasación me pareció justa y no cambió a último momento, que era lo que más miedo me daba. En una semana estaba manejando el otro.",
  },
  {
    nombre: "Nombre Apellido",
    detalle: "Financió su 0 km",
    texto:
      "Me explicaron la cuota final antes de firmar nada, sin letra chica. Los papeles los hicieron ellos y me avisaban por WhatsApp cómo venía el trámite.",
  },
];

export {
  ENLACES,
  GARANTIAS,
  RAZONES,
  PASOS_COMPRA,
  SERVICIOS,
  SOBRE,
  PREGUNTAS,
  TESTIMONIOS,
};
