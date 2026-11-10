import { test } from "node:test";
import assert from "node:assert/strict";
import { precioInicialDelBoleto, anticipoSugerido, seguirSugerencia } from "./modalidades.js";

const AUTO = { precio: 12000000, precioContado: 10000000 };

test("una venta al contado arranca con el precio al contado", () => {
  assert.equal(precioInicialDelBoleto("contado", AUTO), 10000000);
});

test("una venta al contado sin ese dato arranca con el precio del auto", () => {
  assert.equal(precioInicialDelBoleto("contado", { ...AUTO, precioContado: null }), 12000000);
});

test("una parte de pago arranca con el precio del auto", () => {
  assert.equal(precioInicialDelBoleto("permuta", AUTO), 12000000);
});

test("sin auto no hay precio inicial", () => {
  assert.equal(precioInicialDelBoleto("contado", null), undefined);
});

test("sin usado se propone el anticipo del vehículo", () => {
  assert.equal(anticipoSugerido(false, 4000000), "4000000");
});

test("con usado no se propone nada", () => {
  assert.equal(anticipoSugerido(true, 4000000), "");
});

test("un vehículo sin anticipo no propone nada", () => {
  assert.equal(anticipoSugerido(false, null), "");
});

test("lo sugerido sigue al cambio de vehículo o de opción", () => {
  assert.equal(seguirSugerencia("4000000", "4000000", "5000000"), "5000000");
  assert.equal(seguirSugerencia("", "", "4000000"), "4000000");
  assert.equal(seguirSugerencia("4000000", "4000000", ""), "");
});

test("lo que escribió el admin se respeta", () => {
  assert.equal(seguirSugerencia("3500000", "4000000", "5000000"), "3500000");
  assert.equal(seguirSugerencia("3500000", "4000000", ""), "3500000");
});
