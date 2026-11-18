// ajustes-por-chats-reales, tarea 9: las fotos del usado que mandó el cliente, en el detalle de la consulta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fotosDelUsado } from "./fotos-usado.js";

test("devuelve las URLs de fotosUsado del detalle, en orden", () => {
  const detalle = { fotosUsado: [{ url: "https://blob.example/a.jpg?firma=1" }, { url: "http://localhost:4000/api/dev/blob-simulado/consultas/1/usado/b.png" }] };
  assert.deepEqual(fotosDelUsado(detalle), ["https://blob.example/a.jpg?firma=1", "http://localhost:4000/api/dev/blob-simulado/consultas/1/usado/b.png"]);
});

test("sin fotos, sin detalle o con fotosUsado vacío o ausente devuelve una lista vacía (el detalle se ve como hoy)", () => {
  assert.deepEqual(fotosDelUsado(undefined), []);
  assert.deepEqual(fotosDelUsado(null), []);
  assert.deepEqual(fotosDelUsado({}), []);
  assert.deepEqual(fotosDelUsado({ fotosUsado: [] }), []);
  assert.deepEqual(fotosDelUsado({ fotosUsado: null }), []);
});

test("descarta lo que no es una URL http(s): nada de javascript:, data: ni valores vacíos", () => {
  const detalle = { fotosUsado: [{ url: "javascript:alert(1)" }, { url: "data:image/png;base64,AAAA" }, { url: "" }, {}, null, { url: "https://ok.example/c.webp" }] };
  assert.deepEqual(fotosDelUsado(detalle), ["https://ok.example/c.webp"]);
});
