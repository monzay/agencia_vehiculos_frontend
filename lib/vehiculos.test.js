import { test } from "node:test";
import assert from "node:assert/strict";
import { condicionesDePago, filtrarVehiculos, numerarVehiculos } from "./vehiculos.js";

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

test("la lista de vehículos se numera desde 1 en el orden en que se muestra", () => {
  const lista = [
    { ref: "a", brand: "Fiat" },
    { ref: "b", brand: "Ford" },
    { ref: "c", brand: "Audi" },
  ];
  const numerada = numerarVehiculos(lista);
  assert.deepEqual(numerada, [
    { ref: "a", brand: "Fiat", numero: 1 },
    { ref: "b", brand: "Ford", numero: 2 },
    { ref: "c", brand: "Audi", numero: 3 },
  ]);
  assert.equal("numero" in lista[0], false);
});

test("al filtrar la lista la numeración vuelve a empezar", () => {
  const lista = [
    { ref: "a", tipo: "auto" },
    { ref: "b", tipo: "moto" },
    { ref: "c", tipo: "auto" },
  ];
  const numerada = numerarVehiculos(filtrarVehiculos(lista, { tipo: "auto" }));
  assert.deepEqual(numerada.map((v) => [v.ref, v.numero]), [["a", 1], ["c", 2]]);
});
