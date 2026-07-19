// Helpers de presentacion y filtrado de vehiculos.
//
// Los DATOS ya no estan hardcodeados aca: vienen de la API (ver lib/api.js,
// que consume el backend Express + Prisma + MySQL). Estas funciones son
// puras y operan sobre la lista que se les pasa.
//
// Shape de cada vehiculo (lo devuelve la API):
//   { id, ref, brand, model, year, kms, tipo: "auto"|"moto",
//     condicion: "0km"|"usado", combustible: "nafta"|"gnc"|"diesel"|"",
//     precio, color, image }

function obtenerNombreCompletoVehiculo(vehicle) {
  return `${vehicle.brand} ${vehicle.model}`;
}

/**
 * Filtra una lista de vehiculos por tipo, condicion y marca.
 * @param {Array} lista
 * @param {{tipo?: "todos"|"auto"|"moto", condicion?: "todos"|"0km"|"usado", marca?: string}} filtros
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

export {
  obtenerNombreCompletoVehiculo,
  filtrarVehiculos,
  obtenerMarcasFiltradas,
  formatearPrecio,
};
