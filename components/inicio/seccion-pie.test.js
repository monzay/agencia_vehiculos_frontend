import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fuente = (ruta) => readFileSync(new URL(`../../${ruta}`, import.meta.url), "utf8");

// cuil-directo: el link a la política sale del pie (ENLACES_PIE), así que todas las páginas públicas usan ese pie.
test("las páginas públicas usan el pie con el link a la política de privacidad", () => {
  for (const pagina of ["app/page.jsx", "app/catalogo/page.jsx", "app/catalogo/[ref]/page.jsx", "app/privacidad/page.jsx"]) {
    assert.match(fuente(pagina), /<SeccionPie\b/, pagina);
  }
  assert.match(fuente("components/inicio/seccion-pie.jsx"), /ENLACES_PIE/);
});

test("la consulta de cuotas, que pide el DNI y no usa el pie, también enlaza la política de privacidad", () => {
  assert.match(fuente("app/financiacion/page.jsx"), /href="\/privacidad"/);
});
