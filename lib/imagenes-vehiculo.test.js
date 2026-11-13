import { test } from "node:test";
import assert from "node:assert/strict";
import { IMAGENES_ADICIONALES_MAX, lugaresLibres, repartirElegidas, imagenesParaGuardar } from "./imagenes-vehiculo.js";

test("quedan libres las adicionales que faltan para llegar a 5", () => {
  assert.equal(IMAGENES_ADICIONALES_MAX, 5);
  assert.equal(lugaresLibres([]), 5);
  assert.equal(lugaresLibres(["a", "b", "c"]), 2);
  assert.equal(lugaresLibres(["a", "b", "c", "d", "e"]), 0);
  assert.equal(lugaresLibres(["a", "b", "c", "d", "e", "f", "g"]), 0);
});

test("de las elegidas solo entran las que caben", () => {
  const adicionales = ["a", "b", "c"];
  const elegidas = ["1", "2", "3", "4"];
  assert.deepEqual(repartirElegidas(adicionales, elegidas), { entran: ["1", "2"], sobran: ["3", "4"] });
  assert.deepEqual(repartirElegidas(adicionales, ["1"]), { entran: ["1"], sobran: [] });
  assert.deepEqual(repartirElegidas(["a", "b", "c", "d", "e"], elegidas), { entran: [], sobran: elegidas });
  assert.deepEqual(elegidas, ["1", "2", "3", "4"]);
});

test("el pedido lleva la principal y hasta 5 más", () => {
  const adicionales = ["a", "b", "c", "d", "e", "f", "g"];
  assert.deepEqual(imagenesParaGuardar("p", adicionales), ["p", "a", "b", "c", "d", "e"]);
  assert.deepEqual(imagenesParaGuardar("", ["a", "", "b"]), ["a", "b"]);
  assert.deepEqual(imagenesParaGuardar("p", []), ["p"]);
});
