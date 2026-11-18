import { test } from "node:test";
import assert from "node:assert/strict";
import { ENLACES_PIE } from "./constantes.js";

// cuil-directo: la política de privacidad vive en la web; el bot no la manda salvo que el cliente pregunte.
test("el pie de la web tiene el link a la política de privacidad", () => {
  const enlaces = Object.values(ENLACES_PIE).flat();
  assert.ok(
    enlaces.some((e) => e.name === "Política de privacidad" && e.href === "/privacidad"),
    "falta el link 'Política de privacidad' → /privacidad en ENLACES_PIE"
  );
});
