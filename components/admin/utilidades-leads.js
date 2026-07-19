// Helpers compartidos del dashboard de administracion (leads).
import { Flame, Thermometer, Snowflake, MessageCircle } from "lucide-react";

// Estilos y metadatos por clasificacion de lead.
export const CLASIFICACIONES = {
  CALIENTE: {
    label: "Caliente",
    icon: Flame,
    // rojo/naranja
    badge: "bg-red-500/15 text-red-600 border-red-500/30",
    dot: "bg-red-500",
    barra: "bg-red-500",
    descripcion: "Listo para comprar",
  },
  TIBIO: {
    label: "Tibio",
    icon: Thermometer,
    // ambar
    badge: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    dot: "bg-amber-500",
    barra: "bg-amber-500",
    descripcion: "Interesado, en evaluacion",
  },
  FRIO: {
    label: "Frío",
    icon: Snowflake,
    // azul
    badge: "bg-sky-500/15 text-sky-600 border-sky-500/30",
    dot: "bg-sky-500",
    barra: "bg-sky-500",
    descripcion: "Consulta inicial",
  },
};

// Consulta sin clasificar (general: solo saludo/menú, sin especificar nada).
// No es un lead frío, así que lleva su propio badge neutro.
export const SIN_CLASIFICAR = {
  label: "Consulta general",
  icon: MessageCircle,
  badge: "bg-foreground/5 text-muted-foreground border-foreground/15",
  dot: "bg-muted-foreground",
  barra: "bg-muted-foreground",
  descripcion: "Sin consulta específica",
};

export function infoClasificacion(clasif) {
  return CLASIFICACIONES[clasif] ?? SIN_CLASIFICAR;
}

const CANALES = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  web: "Web",
};

export function nombreCanal(canal) {
  return CANALES[canal] ?? canal ?? "—";
}

// Las fechas de la DB son hora local de la agencia (Argentina) pero Prisma las
// entrega etiquetadas como UTC (MySQL DATETIME es naive). Por eso se formatea con
// timeZone:"UTC": así se muestra EXACTAMENTE el reloj que quedó guardado, sin la
// re-conversión del navegador (que restaba 3 h de más).
export function formatearFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString("es-AR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Fecha y hora por separado (mismo criterio de zona que formatearFecha).
export function partesFecha(iso) {
  if (!iso) return { fecha: "—", hora: "" };
  const d = new Date(iso);
  if (isNaN(d)) return { fecha: "—", hora: "" };
  const fecha = d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("es-AR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { fecha, hora };
}

// Tiempo relativo simple: "hace 3 h", "hace 2 d".
export function tiempoRelativo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  // "Ahora" se lleva al mismo marco que las fechas guardadas (wall-clock como UTC),
  // corriendo el offset local, para que "recién" no muestre "hace 3 h".
  const ahora = Date.now() - new Date().getTimezoneOffset() * 60000;
  const segs = Math.floor((ahora - d.getTime()) / 1000);
  if (segs < 60) return "recién";
  const min = Math.floor(segs / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 30) return `hace ${dias} d`;
  const meses = Math.floor(dias / 30);
  return `hace ${meses} mes${meses > 1 ? "es" : ""}`;
}
