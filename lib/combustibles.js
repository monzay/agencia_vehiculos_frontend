// Los combustibles, en las palabras que usa el cliente. Los mismos valores que
// valida el backend (lib/combustibles.js).
export const COMBUSTIBLES = [
  { valor: "nafta", label: "Nafta" },
  { valor: "gnc", label: "GNC" },
  { valor: "nafta_gnc", label: "Nafta y GNC" },
  { valor: "diesel", label: "Diésel" },
];

export const etiquetaCombustible = (valor) => COMBUSTIBLES.find((c) => c.valor === valor)?.label;

export const tieneGnc = (valor) => valor === "gnc" || valor === "nafta_gnc";
