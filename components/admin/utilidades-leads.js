// Helpers compartidos del dashboard de administracion (leads).
import { Flame, Thermometer, Snowflake, MessageCircle, Hourglass } from "lucide-react";

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

// Respondiendo las preguntas del bot pero sin temperatura todavía: se pone
// recién cuando dijo cómo paga (y, si financia, si tiene recibo o garante).
const EN_CALIFICACION = {
  label: "En calificación",
  icon: Hourglass,
  badge: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  dot: "bg-violet-500",
  barra: "bg-violet-500",
  descripcion: "Respondiendo las preguntas",
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
  if (clasif === "EN_CALIFICACION") return EN_CALIFICACION;
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

// Los timestamps se guardan en UTC (la base de producción corre en UTC) y Prisma
// los entrega etiquetados como UTC. Se muestran convertidos a hora de Argentina.
const ZONA_AR = "America/Argentina/Buenos_Aires";

export function formatearFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString("es-AR", {
    timeZone: ZONA_AR,
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
    timeZone: ZONA_AR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("es-AR", {
    timeZone: ZONA_AR,
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
  // Ambos son instantes UTC reales, así que la diferencia es directa.
  const segs = Math.floor((Date.now() - d.getTime()) / 1000);
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
