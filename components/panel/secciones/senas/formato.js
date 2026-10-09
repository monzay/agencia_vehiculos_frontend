// Lo que comparten la sección Señas, su modal y Vehículos.

export const FORMAS_PAGO = [
  { valor: "efectivo", label: "Efectivo" },
  { valor: "transferencia", label: "Transferencia" },
  { valor: "cheque", label: "Cheque" },
];

export const ESTADOS_SENA = {
  vigente: { label: "Vigente", variante: "info" },
  vencida: { label: "Vencida", variante: "alerta" },
  convertida: { label: "Pasó a trámite", variante: "exito" },
  cancelada: { label: "Cancelada", variante: "neutral" },
};

// El auto llega con dos formas: la de la seña (marca/modelo/anio) y la del
// listado de Vehículos (brand/model/year).
export const tituloAuto = (a) =>
  a ? `${a.marca ?? a.brand} ${a.modelo ?? a.model} ${a.anio ?? a.year} · ref ${a.ref}` : "—";

// "2026-10-12" → "12/10/2026", sin pasar por Date para que no se corra de día.
export const fechaCorta = (aaaammdd) => (aaaammdd ? aaaammdd.split("-").reverse().join("/") : "—");
