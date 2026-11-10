import { test } from "node:test";
import assert from "node:assert/strict";
import { condicionesDePago } from "./vehiculos.js";

test("muestra el precio al contado y el anticipo cuando están cargados", () => {
  assert.deepEqual(condicionesDePago({ precio_contado: 10000000, anticipo: 3000000 }), [
    { rotulo: "Precio al contado", valor: 10000000 },
    { rotulo: "Anticipo", valor: 3000000 },
  ]);
});

test("muestra solo el dato que está cargado", () => {
  assert.deepEqual(condicionesDePago({ precio_contado: null, anticipo: 3000000 }), [
    { rotulo: "Anticipo", valor: 3000000 },
  ]);
});

test("un auto sin esos datos no muestra nada", () => {
  assert.deepEqual(condicionesDePago({ precio_contado: null, anticipo: null }), []);
  assert.deepEqual(condicionesDePago({}), []);
});
