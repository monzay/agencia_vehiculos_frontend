import { test } from "node:test";
import assert from "node:assert/strict";
import { esPdf, huellaDe, pathnameDeLista } from "./archivo-lista.js";

const bytes = (texto) => new TextEncoder().encode(texto);

test("un pdf se reconoce por su contenido, no por su extensión", () => {
  assert.equal(esPdf(bytes("%PDF-1.7\n%âãÏÓ")), true);
  assert.equal(esPdf(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), false);
  assert.equal(esPdf(bytes("%PDF")), false);
  assert.equal(esPdf(bytes("hola %PDF-1.7")), false);
});

test("la huella es el sha256 del archivo original", () => {
  assert.equal(huellaDe(bytes("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("el archivo guardado se llama como su huella", () => {
  const huella = "f".repeat(64);
  assert.equal(pathnameDeLista(huella, true), `listas/${huella}.pdf`);
  assert.equal(pathnameDeLista(huella, false), `listas/${huella}.jpg`);
});
