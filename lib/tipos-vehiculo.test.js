import { test } from "node:test";
import assert from "node:assert/strict";
import { TIPOS_VEHICULO, tipoVehiculo } from "./tipos-vehiculo.js";

test("los tipos del front son auto, camioneta, camion y moto", () => {
  assert.deepEqual(TIPOS_VEHICULO.map((t) => t.valor), ["auto", "camioneta", "camion", "moto"]);
  const camion = tipoVehiculo("camion");
  assert.equal(camion.label, "Camión");
  assert.equal(camion.plural, "Camiones");
});

test("camioneta y camión tienen íconos distintos", () => {
  assert.notEqual(tipoVehiculo("camioneta").icono, tipoVehiculo("camion").icono);
});

test("un tipo desconocido se muestra como auto", () => {
  assert.equal(tipoVehiculo("utilitario").valor, "auto");
  assert.equal(tipoVehiculo(undefined).valor, "auto");
});
