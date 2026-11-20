import { test } from "node:test";
import assert from "node:assert/strict";
import { ENLACES_PIE, urlWhatsAppCliente } from "./constantes.js";

// cuil-directo: la política de privacidad vive en la web; el bot no la manda salvo que el cliente pregunte.
test("el pie de la web tiene el link a la política de privacidad", () => {
  const enlaces = Object.values(ENLACES_PIE).flat();
  assert.ok(
    enlaces.some((e) => e.name === "Política de privacidad" && e.href === "/privacidad"),
    "falta el link 'Política de privacidad' → /privacidad en ENLACES_PIE"
  );
});

// whatsapp-del-cliente: el detalle de la consulta abre el chat directo con el cliente.
test("urlWhatsAppCliente arma el link de wa.me con el número", () => {
  assert.equal(urlWhatsAppCliente("5493884708347"), "https://wa.me/5493884708347");
});

test("urlWhatsAppCliente sin un número válido no da link", () => {
  const invalidos = [
    null,
    undefined,
    "",
    "1234567",
    "1234567890123456",
    "549 388 470",
    "5493884708347?text=x",
    "javascript:alert(1)",
  ];
  for (const numero of invalidos) {
    assert.equal(urlWhatsAppCliente(numero), null, `debía rechazar ${JSON.stringify(numero)}`);
  }
});
