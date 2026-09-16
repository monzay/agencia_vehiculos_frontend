// De quién es el teléfono alternativo del titular.
// Los valores son los del enum `cliente_perfiles.contacto_alt_vinculo`.
export const VINCULOS = [
  { valor: "pareja", label: "Pareja" },
  { valor: "padre_madre", label: "Padre / madre" },
  { valor: "hermano_a", label: "Hermano/a" },
  { valor: "hijo_a", label: "Hijo/a" },
  { valor: "otro", label: "Otro" },
];

export const VINCULO = Object.fromEntries(VINCULOS.map((v) => [v.valor, v.label]));
