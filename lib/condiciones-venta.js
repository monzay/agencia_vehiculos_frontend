// Condiciones de venta de la agencia (bancos, financieras, garantía, usados).
// Funciones puras, sin React ni fetch: validan y arman el cuerpo del PUT con las mismas reglas que la API.

export const MAX_NOMBRES = 15;
export const MAX_NOMBRE = 80;
export const MAX_DETALLE = 200;

export const BOOLEANAS = ["trabajaBancos", "trabajaFinancieras", "financiaCasa", "garantia", "recibeUsados"];
export const TIPOS_CUOTA = ["fija", "uva", "fija_y_uva"];

// Minúsculas y sin tildes, para detectar repetidos como lo hace la base.
const clave = (nombre) =>
  String(nombre).trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const recortar = (texto) => (typeof texto === "string" ? texto.trim() : "");
const detalleOVacio = (texto) => recortar(texto) || null;

export function aOpcion(valor) {
  if (valor === true) return "si";
  if (valor === false) return "no";
  return "sin_definir";
}

export function deOpcion(texto) {
  if (texto === "si") return true;
  if (texto === "no") return false;
  return null;
}

// Error al agregar un nombre a la lista, o null si se puede.
export function validarNombreNuevo(lista, nombre) {
  const limpio = recortar(nombre);
  if (!limpio) return "Escribí un nombre.";
  if (limpio.length > MAX_NOMBRE) return `El nombre puede tener hasta ${MAX_NOMBRE} caracteres.`;
  if ((lista ?? []).some((n) => clave(n) === clave(limpio))) return "Ese nombre ya está en la lista.";
  if ((lista ?? []).length >= MAX_NOMBRES) return `La lista admite hasta ${MAX_NOMBRES} nombres.`;
  return null;
}

function errorDeLista(lista) {
  if (!Array.isArray(lista)) return "La lista no es válida.";
  if (lista.length > MAX_NOMBRES) return `La lista admite hasta ${MAX_NOMBRES} nombres.`;
  const vistos = new Set();
  for (const nombre of lista) {
    if (typeof nombre !== "string") return "Los nombres tienen que ser texto.";
    const limpio = nombre.trim();
    if (!limpio) return "Hay un nombre vacío.";
    if (limpio.length > MAX_NOMBRE) return `Los nombres pueden tener hasta ${MAX_NOMBRE} caracteres.`;
    if (vistos.has(clave(limpio))) return `"${limpio}" está repetido.`;
    vistos.add(clave(limpio));
  }
  return null;
}

function errorDeDetalle(detalle) {
  if (detalle != null && typeof detalle !== "string") return "El detalle tiene que ser texto.";
  if (recortar(detalle).length > MAX_DETALLE) return `El detalle puede tener hasta ${MAX_DETALLE} caracteres.`;
  return null;
}

// { campo: mensaje }, vacío si está todo bien. Solo valida lo que se manda: lo que no aplica va vacío.
export function validarCondiciones(estado) {
  const errores = {};
  for (const campo of BOOLEANAS) {
    const valor = estado[campo];
    if (valor !== true && valor !== false && valor !== null) errores[campo] = "Elegí Sí, No o Sin definir.";
  }
  if (estado.tiposCuota !== null && !TIPOS_CUOTA.includes(estado.tiposCuota)) {
    errores.tiposCuota = "Elegí un tipo de cuota válido.";
  }
  const listas = [
    ["trabajaBancos", "bancos"],
    ["trabajaFinancieras", "financieras"],
  ];
  for (const [interruptor, lista] of listas) {
    if (estado[interruptor] !== true) continue;
    const error = errorDeLista(estado[lista]);
    if (error) errores[lista] = error;
  }
  const detalles = [
    ["garantia", "garantiaDetalle", (v) => v === true || v === false],
    ["recibeUsados", "usadosDetalle", (v) => v === true],
  ];
  for (const [interruptor, detalle, aplica] of detalles) {
    if (!aplica(estado[interruptor])) continue;
    const error = errorDeDetalle(estado[detalle]);
    if (error) errores[detalle] = error;
  }
  return errores;
}

// Cuerpo del PUT: exactamente las 10 claves, recortado y con lo que no aplica vacío.
export function armarEnvio(estado) {
  const nombres = (lista) => (Array.isArray(lista) ? lista.map(recortar) : []);
  return {
    trabajaBancos: estado.trabajaBancos,
    bancos: estado.trabajaBancos === true ? nombres(estado.bancos) : [],
    trabajaFinancieras: estado.trabajaFinancieras,
    financieras: estado.trabajaFinancieras === true ? nombres(estado.financieras) : [],
    financiaCasa: estado.financiaCasa,
    tiposCuota: estado.tiposCuota,
    garantia: estado.garantia,
    garantiaDetalle: estado.garantia === null ? null : detalleOVacio(estado.garantiaDetalle),
    recibeUsados: estado.recibeUsados,
    usadosDetalle: estado.recibeUsados === true ? detalleOVacio(estado.usadosDetalle) : null,
  };
}

// Estado nuevo al elegir una opción de garantía: el texto es de cada opción, así que se vacía al cambiar
// y reaparece el guardado si se vuelve a la opción guardada.
export function cambiarGarantia(original, estado, valor) {
  const garantiaDetalle =
    valor === estado.garantia ? estado.garantiaDetalle : valor === original?.garantia ? original.garantiaDetalle : null;
  return { ...estado, garantia: valor, garantiaDetalle };
}

// true si lo que se mandaría difiere de lo guardado (el orden de las listas no cuenta).
export function hayCambios(original, estado) {
  const ordenado = (e) => {
    const envio = armarEnvio(e);
    return { ...envio, bancos: [...envio.bancos].sort(), financieras: [...envio.financieras].sort() };
  };
  return JSON.stringify(ordenado(original)) !== JSON.stringify(ordenado(estado));
}
