// Helpers de presentacion y filtrado de vehiculos.
//
// Los DATOS ya no estan hardcodeados aca: vienen de la API (ver lib/api.js,
// que consume el backend Express + Prisma + MySQL). Estas funciones son
// puras y operan sobre la lista que se les pasa.
//
// Shape de cada vehiculo (lo devuelve la API):
//   { id, ref, brand, model, year, kms, tipo: "auto"|"moto",
//     condicion: "0km"|"usado", combustible: "nafta"|"gnc"|"nafta_gnc"|"diesel"|"",
//     precio, color, image }

function obtenerNombreCompletoVehiculo(vehicle) {
  return `${vehicle.brand} ${vehicle.model}`;
}

/**
 * Filtra una lista de vehiculos por tipo, condicion y marca.
 * @param {Array} lista
 * @param {{tipo?: "todos"|"auto"|"camioneta"|"moto", condicion?: "todos"|"0km"|"usado", marca?: string}} filtros
 */
function filtrarVehiculos(lista = [], { tipo = "todos", condicion = "todos", marca = "todas" } = {}) {
  return lista.filter((v) => {
    const coincideTipo      = tipo      === "todos" || v.tipo      === tipo;
    const coincideCondicion = condicion === "todos" || v.condicion === condicion;
    const coincideMarca     = marca     === "todas" || v.brand     === marca;
    return coincideTipo && coincideCondicion && coincideMarca;
  });
}

/**
 * Devuelve las marcas disponibles dentro de una lista, segun tipo/condicion.
 */
function obtenerMarcasFiltradas(lista = [], { tipo = "todos", condicion = "todos" } = {}) {
  const vehiculos = filtrarVehiculos(lista, { tipo, condicion });
  const brands = [...new Set(vehiculos.map((v) => v.brand))];
  return brands.sort();
}

/**
 * Formatea el precio en pesos argentinos.
 */
function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

/**
 * "DD/MM" para la vigencia de un beneficio (las fechas vienen etiquetadas UTC).
 */
function fechaCorta(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}

/**
 * Etiqueta del descuento propio del vehiculo ({ tipo, valor }).
 */
function etiquetaDescuento(descuento) {
  return descuento.tipo === "monto" ? `-${formatearPrecio(descuento.valor)}` : `-${descuento.valor}%`;
}

/**
 * Etiqueta del descuento de una promocion ({ descuento, descuento_tipo }); "" si no lleva.
 */
function etiquetaPromo(promo) {
  if (promo.descuento == null) return "";
  return promo.descuento_tipo === "monto" ? `-${formatearPrecio(promo.descuento)}` : `-${promo.descuento}%`;
}

/**
 * Precio al contado y anticipo del vehiculo: solo los que estan cargados.
 */
function condicionesDePago(vehiculo) {
  return [
    { rotulo: "Precio al contado", valor: vehiculo.precio_contado },
    { rotulo: "Anticipo", valor: vehiculo.anticipo },
  ].filter((condicion) => condicion.valor > 0);
}

/**
 * Devuelve una lista nueva con cada vehiculo y su numero (1, 2, 3...) en el orden recibido.
 */
function numerarVehiculos(lista = []) {
  return lista.map((v, i) => ({ ...v, numero: i + 1 }));
}

export {
  condicionesDePago,
  obtenerNombreCompletoVehiculo,
  filtrarVehiculos,
  numerarVehiculos,
  obtenerMarcasFiltradas,
  formatearPrecio,
  fechaCorta,
  etiquetaDescuento,
  etiquetaPromo,
};
