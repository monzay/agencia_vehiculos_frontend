// Qué tiene la agencia del papel físico. Es un hecho distinto de que exista el
// escaneo: se puede tener la foto del título sin que el título esté acá, y ese
// es justo el caso que frena una transferencia.
//
// Los valores son los del enum `consignacion_documentos.tenencia`.
export const TENENCIAS = [
  {
    valor: "no_recibido",
    label: "Nada — solo el escaneo",
    corto: "Solo digital",
    clase: "text-muted-foreground border-border",
  },
  {
    valor: "copia",
    label: "Una fotocopia",
    corto: "Copia",
    clase: "text-sky-400 border-sky-500/40",
  },
  {
    valor: "original",
    label: "El original",
    corto: "Original",
    clase: "text-emerald-500 border-emerald-500/40",
  },
];

export const TENENCIA = Object.fromEntries(TENENCIAS.map((t) => [t.valor, t]));
