import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

test("la sección Vehículos no muestra la ref del vehículo", () => {
  const archivos = [leer("../vehiculos.jsx"), leer("./eliminar-vehiculo.jsx")];
  const patrones = [/REF \{/, /label="REF"/, /\(ref \$\{/, /`[^`]*\bref \$\{[^`]*`/];
  for (const texto of archivos) {
    for (const patron of patrones) assert.doesNotMatch(texto, patron);
  }
});
