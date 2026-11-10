// La propuesta de "Importar lista": qué filas se crean y con qué datos.
// Lógica pura, sin React, para poder probarla sola.

// Los campos del formulario de vehículo: lo único que viaja al importar.
export const CAMPOS = [
  "marca",
  "modelo",
  "version",
  "anio",
  "kms",
  "condicion",
  "tipoVehiculo",
  "combustible",
  "precio",
  "precio_contado",
  "anticipo",
];

const NUMERICOS = new Set(["anio", "kms", "precio", "precio_contado", "anticipo"]);

export const ESTADOS = {
  nuevo: { etiqueta: "Nuevo", plural: "nuevos", ayuda: "No está en el stock." },
  parecido: { etiqueta: "Parecido", plural: "parecidos", ayuda: "Hay uno del mismo modelo y año. Revisá si es el mismo antes de tildarlo." },
  repetido: { etiqueta: "Repetido", plural: "repetidos", ayuda: "Aparece más arriba en la lista." },
  ya_cargado: { etiqueta: "Ya cargado", plural: "ya cargados", ayuda: "Ya está en el stock: no se puede crear otra vez." },
};

const ANIO_MIN = 1900;
const ANIO_MAX = 2100;

export const sePuedeElegir = (fila) => fila.estado !== "ya_cargado";

const seCrea = (fila) => fila.elegida && sePuedeElegir(fila);

export const filasIniciales = (filas) => filas.map((fila, i) => ({ ...fila, id: i, elegida: fila.estado === "nuevo" }));

export const alternarFila = (filas, id) =>
  filas.map((fila) => (fila.id === id && sePuedeElegir(fila) ? { ...fila, elegida: !fila.elegida } : fila));

// Lo que la persona corrige deja de estar en duda.
export function cambiarCampo(filas, id, campo, valor) {
  const vacio = valor === "" || valor === null || valor === undefined;
  const limpio = vacio ? null : NUMERICOS.has(campo) ? Number(valor) : valor;
  return filas.map((fila) =>
    fila.id === id ? { ...fila, [campo]: limpio, dudosos: (fila.dudosos ?? []).filter((c) => c !== campo) } : fila
  );
}

export const cantidadElegida = (filas) => filas.filter(seCrea).length;

// El alta exige marca, modelo y un año válido: sin eso el backend rechaza toda la lista.
const anioValido = (anio) => Number.isInteger(anio) && anio >= ANIO_MIN && anio <= ANIO_MAX;
export const filasIncompletas = (filas) =>
  filas.filter((f) => seCrea(f) && (!f.marca || !f.modelo || !anioValido(f.anio)));

export const pedidoDeImportacion = (archivos, filas) => ({
  archivos,
  vehiculos: filas.filter(seCrea).map((fila) => Object.fromEntries(CAMPOS.map((c) => [c, fila[c] ?? null]))),
});
