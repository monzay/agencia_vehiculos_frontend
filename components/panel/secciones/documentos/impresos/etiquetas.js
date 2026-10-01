// Cómo se escribe cada valor en los papeles que firma el cliente. Están acá y
// no en el documento porque los tres impresos tienen que decir lo mismo igual.

export const pesos = (n) => (n == null ? "—" : `$ ${Math.round(n).toLocaleString("es-AR")}`);
export const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR") : "—");
// En un contrato la fecha escrita se lee sin tropezar y no se confunde con el
// formato de otro país.
export const fechaLarga = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "—";
// Siempre en 24 h: "17:00 hs", no "05:00 p. m. hs" (depende del navegador).
export const hora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) : "—";
export const kilometros = (n) => n?.toLocaleString("es-AR");
export const nombreCompleto = (p) => (p ? [p.nombre, p.apellido].filter(Boolean).join(" ") || "—" : "—");

export const A_CARGO = { agencia: "La agencia", cliente: "El cliente" };
// Para "a cargo de…": con la contracción que pide el castellano ("del cliente").
export const DE_QUIEN = { agencia: "de la agencia", cliente: "del cliente" };

// Los plazos del contrato se escriben como en cualquier contrato: en letras y
// con el número al lado. Llega hasta 999 y los plazos están topeados en 365.
const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce",
  "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós",
  "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos",
  "ochocientos", "novecientos"];

export function enLetras(n) {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
  if (n < 30) return UNIDADES[n];
  if (n < 100) {
    const decena = DECENAS[Math.floor(n / 10)];
    const unidad = n % 10;
    return unidad ? `${decena} y ${UNIDADES[unidad]}` : decena;
  }
  if (n === 100) return "cien";
  const resto = n % 100;
  const centena = CENTENAS[Math.floor(n / 100)];
  return resto ? `${centena} ${enLetras(resto)}` : centena;
}
// Delante de un sustantivo masculino "uno" se apocopa: son veintiún días, no
// veintiuno días; un peso, no uno pesos.
export const apocopar = (letras) => letras.replace(/veintiuno$/, "veintiún").replace(/ uno$/, " un").replace(/^uno$/, "un");

// 0 a 999.999 en letras. "mil" solo, no "un mil".
function hastaUnMillon(n) {
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  const partes = [];
  if (miles) partes.push(miles === 1 ? "mil" : `${apocopar(enLetras(miles))} mil`);
  if (resto) partes.push(enLetras(resto));
  return partes.join(" ");
}

// Un monto en letras, como se escribe en un boleto: "quince millones de pesos",
// "veintiún mil pesos con 50/100". Cubre hasta el tope de la base (diez mil
// millones). Lleva "de" cuando termina en millón/millones redondos.
export function montoEnLetras(monto) {
  if (monto == null || !Number.isFinite(Number(monto))) return "—";
  const centavos = Math.round(Number(monto) * 100);
  const entero = Math.floor(centavos / 100);
  const decimales = centavos % 100;

  const millones = Math.floor(entero / 1_000_000);
  const resto = entero % 1_000_000;
  const partes = [];
  if (millones) partes.push(millones === 1 ? "un millón" : `${apocopar(hastaUnMillon(millones))} millones`);
  if (resto || !millones) partes.push(resto ? hastaUnMillon(resto) : "cero");

  const de = millones && !resto ? "de " : "";
  const pesos = entero === 1 ? "peso" : "pesos";
  return `${apocopar(partes.join(" "))} ${de}${pesos}${decimales ? ` con ${String(decimales).padStart(2, "0")}/100` : ""}`;
}

// El monto con su versión en letras al lado, como va en cualquier contrato. Con
// centavos si los tiene: el número y las letras tienen que decir lo mismo.
export const pesosConLetras = (monto) =>
  `$ ${Number(monto).toLocaleString("es-AR", { maximumFractionDigits: 2 })} (${montoEnLetras(monto)})`;

export const FORMAS = { transferencia: "transferencia bancaria", efectivo: "efectivo", cheque: "cheque" };
// Qué dejó el cliente de cada papel. Snapshots viejos pueden no traerlo.
export const TENENCIA = { original: "Original", copia: "Fotocopia" };
export const originales = (papeles) => papeles.filter((p) => p.tenencia === "original");
