// Orden de visualización: la semana arranca en lunes. `dia` sigue getDay() (0=Dom),
// que es lo que guarda y lee el backend/bot.
export const ORDEN = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

const POR_DEFECTO = { abierto: false, apertura: "09:00", cierre: "18:00", cortado: false, apertura_2: "", cierre_2: "" };

// Mismo formato que valida la API.
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const CIERRE_MANANA = "13:00";
const APERTURA_TARDE = "16:00";
const CIERRE_TARDE = "21:00";

// "08:00 - 13:00 y 16:00 - 21:00", "09:00 - 18:00" o "Cerrado".
export function textoDelDia(h) {
  if (!h?.abierto || !h.apertura || !h.cierre) return "Cerrado";
  const manana = `${h.apertura} - ${h.cierre}`;
  return h.apertura_2 && h.cierre_2 ? `${manana} y ${h.apertura_2} - ${h.cierre_2}` : manana;
}

// Parte el día corrido en dos franjas. Si el cierre anterior ya pasaba de las 16,
// se conserva como cierre de la tarde.
export function prenderCortado(d) {
  return {
    ...d,
    cierre: CIERRE_MANANA,
    apertura_2: APERTURA_TARDE,
    cierre_2: d.cierre > APERTURA_TARDE ? d.cierre : CIERRE_TARDE,
    cortado: true,
  };
}

// Vuelve a un solo tramo: el cierre pasa a ser el de la segunda franja.
export function apagarCortado(d) {
  return { ...d, cierre: d.cierre_2 || d.cierre, apertura_2: "", cierre_2: "", cortado: false };
}

// De la lista del backend a un mapa { [dia]: {abierto, apertura, cierre, cortado,
// apertura_2, cierre_2} } listo para editar. Las horas quedan siempre como string
// para los inputs, aunque el día esté cerrado (así el admin no pierde lo escrito
// al togglear).
export function aFormulario(horarios) {
  const mapa = {};
  for (const { dia } of ORDEN) {
    const h = horarios?.find((x) => x.dia === dia);
    mapa[dia] = h
      ? {
          abierto: h.abierto,
          apertura: h.apertura || "09:00",
          cierre: h.cierre || "18:00",
          cortado: Boolean(h.apertura_2 && h.cierre_2),
          apertura_2: h.apertura_2 || "",
          cierre_2: h.cierre_2 || "",
        }
      : { ...POR_DEFECTO };
  }
  return mapa;
}

// Mensaje con el nombre del día que no cierra, o null si la semana es válida.
export function validarHorarios(mapa) {
  for (const { dia, nombre } of ORDEN) {
    const d = mapa[dia];
    if (!d.abierto) continue;
    if (!d.apertura || !d.cierre) return `Completá el horario del ${nombre}.`;
    if (!HORA.test(d.apertura) || !HORA.test(d.cierre)) return `El horario del ${nombre} debe ser HH:MM (24 h).`;
    if (d.apertura >= d.cierre) return `El ${nombre} la apertura debe ser anterior al cierre.`;
    if (!d.cortado) continue;
    if (!d.apertura_2 || !d.cierre_2) return `Completá la segunda franja del ${nombre}.`;
    if (!HORA.test(d.apertura_2) || !HORA.test(d.cierre_2)) {
      return `El horario de la segunda franja del ${nombre} debe ser HH:MM (24 h).`;
    }
    if (d.apertura_2 <= d.cierre) return `El ${nombre} la segunda franja debe empezar después del cierre de la primera.`;
    if (d.apertura_2 >= d.cierre_2) return `El ${nombre} la apertura de la tarde debe ser anterior al cierre.`;
  }
  return null;
}

// Del mapa editable a la lista que recibe la API: la segunda franja solo viaja
// en los días abiertos y cortados.
export function aPayload(mapa) {
  return ORDEN.map(({ dia }) => {
    const d = mapa[dia];
    if (!d.abierto) {
      return { dia, abierto: false, apertura: null, cierre: null, apertura_2: null, cierre_2: null };
    }
    return {
      dia,
      abierto: true,
      apertura: d.apertura,
      cierre: d.cierre,
      apertura_2: d.cortado ? d.apertura_2 : null,
      cierre_2: d.cortado ? d.cierre_2 : null,
    };
  });
}
