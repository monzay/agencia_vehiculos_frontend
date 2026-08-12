const INFO_NEGOCIO = {
  name: "SEA AUTOMOTORES",
  phone: "5493884726067",
  whatsapp: "5493884726067",
  address: "Avenida Parroco Marshke 2706 esquina Luis Burela",
  city: "San Salvador de Jujuy",
  province: "Jujuy",
  postalCode: "Y4600",
  // TODO CONTENIDO: cargar el email real de la agencia. Vacío = la sección de
  // contacto no muestra la fila de email (mejor que mostrar uno inventado).
  email: "",
  fullAddress: "Avenida Parroco Marshke 2706 esquina Luis Burela, Y4600 San Salvador de Jujuy, Jujuy",
  hours: {
    weekdays: "Lunes a Viernes: 9:00 - 21:00",
    saturday: "S\xE1bados: 9:00 - 15:00",
    sunday: "Domingos: Cerrado"
  },
  features: [
    "Aceptamos veh\xEDculos como parte de pago",
    "Financiamiento a tu medida",
    "Garant\xEDa en todos nuestros veh\xEDculos"
  ]
};
const ASESORES = [
  { id: 1, nombre: "Agustina", telefono: "5492974357650" },
  { id: 2, nombre: "Belen", telefono: "5491166225211" },
  { id: 3, nombre: "Benjamin", telefono: "5493883124123" },
  { id: 4, nombre: "V\xEDctor", telefono: "5493885015911" },
  { id: 5, nombre: "Cristian", telefono: "5493884049070" },
  { id: 6, nombre: "Matias", telefono: "5493883113341" },
  { id: 7, nombre: "Agustin", telefono: "5493884966058" },
  { id: 8, nombre: "Rada", telefono: "5493885866156" },
  { id: 9, nombre: "Aquiles", telefono: "5493885181318" },
  { id: 10, nombre: "Clara", telefono: "5493885984729" },
];

// Numero de PRODUCCION del BOT de WhatsApp (+54 9 388 512-9241).
// A este numero llegan las consultas de vehiculos y responde el bot de n8n.
// Se puede sobrescribir con NEXT_PUBLIC_WHATSAPP_BOT (solo digitos, con codigo
// de pais). Si no esta seteado, usa el numero de produccion.
const WHATSAPP_BOT_PRODUCCION = "5493885129241";
const WHATSAPP_BOT =
  process.env.NEXT_PUBLIC_WHATSAPP_BOT || WHATSAPP_BOT_PRODUCCION;

// Codigo del asesor que trajo la visita, dejado por /a/<slug> en una cookie.
// Viaja DENTRO del mensaje de WhatsApp —es el unico dato que wa.me deja pasar—
// para que el bot atribuya la consulta en vez de repartirla por carga.
// El cliente lo ve en el texto: no hay forma de mandarlo oculto por wa.me.
function codigoAsesor() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)asesor=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function conCodigoAsesor(message, slug) {
  return slug ? `${message} [AS:${slug}]` : message;
}

function obtenerUrlWhatsApp(message) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${INFO_NEGOCIO.whatsapp}?text=${encodedMessage}`;
}

// URL hacia el BOT (numero de prueba de Meta) para consultar un vehiculo.
// Incluye la REF del auto para que el bot ate la consulta a ese vehiculo.
// `slug` se puede pasar explicito: los CTA que son <a href> se renderizan
// tambien en el servidor, donde no hay cookie, y necesitan controlar cuando
// aparece la marca (ver hooks/usar-url-whatsapp-bot.js). Los que abren la URL en
// un onClick usan el default, que lee la cookie ahi mismo.
function obtenerUrlWhatsAppBotVehiculo(vehicle, nombreAgencia = INFO_NEGOCIO.name, slug = codigoAsesor()) {
  const ref = vehicle.ref ?? vehicle.id;
  const message =
    `Hola ${nombreAgencia}! Estoy interesado en el ${vehicle.brand} ${vehicle.model} ${vehicle.year}. ` +
    `\xBFPodr\xEDan darme m\xE1s informaci\xF3n? (REF #${ref})`;
  const encodedMessage = encodeURIComponent(conCodigoAsesor(message, slug));
  return `https://wa.me/${WHATSAPP_BOT}?text=${encodedMessage}`;
}
// URL hacia el BOT para una consulta general, sin vehiculo asociado.
function obtenerUrlWhatsAppBot(mensaje, slug = codigoAsesor()) {
  const encodedMessage = encodeURIComponent(conCodigoAsesor(mensaje, slug));
  return `https://wa.me/${WHATSAPP_BOT}?text=${encodedMessage}`;
}
function obtenerUrlWhatsAppAsesor(asesor, mensaje) {
  const encodedMessage = encodeURIComponent(mensaje);
  return `https://wa.me/${asesor.telefono}?text=${encodedMessage}`;
}
function obtenerUrlWhatsAppPredeterminada() {
  const message = `Hola Sea Automotores! Me gustar\xEDa recibir m\xE1s informaci\xF3n sobre los veh\xEDculos disponibles.`;
  return obtenerUrlWhatsApp(message);
}
function obtenerUrlWhatsAppVehiculo(brand, model, year) {
  const message = `Hola Sea Automotores! Estoy interesado en el ${brand} ${model} ${year}. \xBFPodr\xEDan darme m\xE1s informaci\xF3n?`;
  return obtenerUrlWhatsApp(message);
}
// La portada tiene ocho secciones con ancla; en la barra entran las cinco que
// alguien busca de verdad. El resto se alcanza desde el pie.
const ENLACES_NAVEGACION = [
  { name: "Cat\xE1logo", href: "#catalogo" },
  { name: "C\xF3mo comprar", href: "#como-comprar" },
  { name: "Entregas", href: "#entregas" },
  { name: "Nosotros", href: "#nosotros" },
  { name: "Contacto", href: "#contacto" }
];
const ENLACES_PIE = {
  Navegaci\u00F3n: [
    { name: "Cat\xE1logo", href: "#catalogo" },
    { name: "Servicios", href: "#servicios" },
    { name: "C\xF3mo comprar", href: "#como-comprar" },
    { name: "Entregas", href: "#entregas" },
    { name: "Nosotros", href: "#nosotros" },
    { name: "Contacto", href: "#contacto" }
  ],
  Ayuda: [
    { name: "Preguntas frecuentes", href: "#preguntas" },
    { name: "Consultar mis cuotas", href: "/financiacion" },
  ],
  Marcas: [
    { name: "Toyota", href: "#catalogo" },
    { name: "Volkswagen", href: "#catalogo" },
    { name: "Ford", href: "#catalogo" },
    { name: "Honda", href: "#catalogo" }
  ]
};
const ENLACES_SOCIALES = [
  { name: "Instagram", href: "#" },
  { name: "Facebook", href: "#" },
  { name: "Tik tok", href: `` }
];
export {
  INFO_NEGOCIO,
  ASESORES,
  ENLACES_PIE,
  ENLACES_NAVEGACION,
  ENLACES_SOCIALES,
  obtenerUrlWhatsApp,
  obtenerUrlWhatsAppPredeterminada,
  obtenerUrlWhatsAppVehiculo,
  obtenerUrlWhatsAppAsesor,
  obtenerUrlWhatsAppBotVehiculo,
  obtenerUrlWhatsAppBot,
  codigoAsesor,
  WHATSAPP_BOT,
};
