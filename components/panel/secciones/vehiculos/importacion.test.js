import { test } from "node:test";
import assert from "node:assert/strict";
import { filasIniciales, alternarFila, cambiarCampo, pedidoDeImportacion, filasIncompletas } from "./importacion.js";

const fila = (estado, extra = {}) => ({
  marca: "Fiat",
  modelo: "Uno",
  version: null,
  anio: 2010,
  kms: 1000,
  condicion: null,
  tipoVehiculo: null,
  combustible: null,
  precio: null,
  precio_contado: null,
  anticipo: null,
  dudosos: [],
  estado,
  coincide: null,
  ...extra,
});

test("las filas nuevas arrancan tildadas y las demás no", () => {
  const filas = filasIniciales([fila("nuevo"), fila("parecido"), fila("repetido"), fila("ya_cargado")]);
  assert.deepEqual(filas.map((f) => f.elegida), [true, false, false, false]);
});

test("una fila ya cargada no se puede tildar", () => {
  const filas = filasIniciales([fila("ya_cargado"), fila("parecido")]);
  const despues = alternarFila(alternarFila(filas, 0), 1);
  assert.deepEqual(despues.map((f) => f.elegida), [false, true]);
  assert.equal(filas[1].elegida, false, "no modifica la lista anterior");
});

test("el pedido de importación lleva solo los campos del formulario", () => {
  const filas = [
    ...filasIniciales([fila("nuevo", { dudosos: ["kms"], coincide: { ref: "1" } }), fila("parecido")]),
    { ...fila("ya_cargado"), id: 9, elegida: true },
  ];
  const corregidas = cambiarCampo(filas, 0, "kms", "85000");

  assert.deepEqual(pedidoDeImportacion(["listas/lista.jpg"], corregidas), {
    archivos: ["listas/lista.jpg"],
    vehiculos: [
      {
        marca: "Fiat",
        modelo: "Uno",
        version: null,
        anio: 2010,
        kms: 85000,
        condicion: null,
        tipoVehiculo: null,
        combustible: null,
        precio: null,
        precio_contado: null,
        anticipo: null,
      },
    ],
  });
});

test("una fila tildada sin marca o con un año fuera de rango cuenta como incompleta", () => {
  const filas = filasIniciales([fila("nuevo", { anio: 19 }), fila("nuevo"), fila("nuevo", { marca: null }), fila("parecido", { anio: null })]);
  assert.deepEqual(filasIncompletas(filas).map((f) => f.id), [0, 2]);
});

test("corregir un dato dudoso lo deja de marcar y vaciarlo lo deja en null", () => {
  const [corregida] = cambiarCampo(filasIniciales([fila("nuevo", { dudosos: ["kms", "marca"] })]), 0, "kms", "");
  assert.equal(corregida.kms, null);
  assert.deepEqual(corregida.dudosos, ["marca"]);
});
