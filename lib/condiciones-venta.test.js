import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aOpcion,
  armarEnvio,
  deOpcion,
  hayCambios,
  validarCondiciones,
  validarNombreNuevo,
} from "./condiciones-venta.js";

// Estado del formulario = mismo objeto que devuelve GET /api/condiciones-venta.
const vacio = () => ({
  trabajaBancos: null,
  bancos: [],
  trabajaFinancieras: null,
  financieras: [],
  financiaCasa: null,
  tiposCuota: null,
  garantia: null,
  garantiaDetalle: null,
  recibeUsados: null,
  usadosDetalle: null,
});
const con = (cambios) => ({ ...vacio(), ...cambios });
const quince = () => Array.from({ length: 15 }, (_, i) => `Banco ${i + 1}`);

// --- validarNombreNuevo ---

test("un nombre nuevo y distinto se acepta", () => {
  assert.equal(validarNombreNuevo(["Macro"], "Galicia"), null);
});

test("un nombre vacío o solo de espacios da error", () => {
  assert.equal(typeof validarNombreNuevo([], ""), "string");
  assert.equal(typeof validarNombreNuevo([], "    "), "string");
});

test("el nombre se evalúa recortado: con espacios alrededor se acepta", () => {
  assert.equal(validarNombreNuevo([], "  Galicia  "), null);
});

test("un nombre de 80 caracteres se acepta y uno de 81 da error", () => {
  assert.equal(validarNombreNuevo([], "a".repeat(80)), null);
  assert.equal(typeof validarNombreNuevo([], "a".repeat(81)), "string");
});

test("el largo se cuenta después de recortar", () => {
  assert.equal(validarNombreNuevo([], ` ${"a".repeat(80)} `), null);
});

test("un nombre repetido da error aunque cambien las mayúsculas", () => {
  assert.equal(typeof validarNombreNuevo(["Macro"], "macro"), "string");
  assert.equal(typeof validarNombreNuevo(["Macro"], "  MACRO "), "string");
});

test("un nombre repetido da error aunque cambien las tildes", () => {
  assert.equal(typeof validarNombreNuevo(["Banco Ciudad"], "Banco Cíudad"), "string");
  assert.equal(typeof validarNombreNuevo(["Peugeot Compañía"], "peugeot compania"), "string");
});

test("con 15 nombres en la lista no se puede agregar otro", () => {
  assert.equal(typeof validarNombreNuevo(quince(), "Otro"), "string");
});

test("con 14 nombres todavía se puede agregar uno", () => {
  assert.equal(validarNombreNuevo(quince().slice(0, 14), "Otro"), null);
});

// --- validarCondiciones ---

test("un estado vacío (todo sin definir) no tiene errores", () => {
  assert.deepEqual(validarCondiciones(vacio()), {});
});

test("un estado completo y correcto no tiene errores", () => {
  const estado = con({
    trabajaBancos: true,
    bancos: ["Galicia", "Macro"],
    trabajaFinancieras: true,
    financieras: ["Credicuotas"],
    financiaCasa: false,
    tiposCuota: "fija_y_uva",
    garantia: true,
    garantiaDetalle: "3 meses de motor y caja",
    recibeUsados: true,
    usadosDetalle: "autos y camionetas; motos no",
  });
  assert.deepEqual(validarCondiciones(estado), {});
});

test("un detalle de 200 caracteres pasa y uno de 201 da error en su campo", () => {
  assert.deepEqual(validarCondiciones(con({ garantia: true, garantiaDetalle: "a".repeat(200) })), {});
  const errores = validarCondiciones(con({ garantia: true, garantiaDetalle: "a".repeat(201) }));
  assert.deepEqual(Object.keys(errores), ["garantiaDetalle"]);
  assert.equal(typeof errores.garantiaDetalle, "string");
});

test("el detalle de usados de 201 caracteres da error en usadosDetalle", () => {
  const errores = validarCondiciones(con({ recibeUsados: true, usadosDetalle: "a".repeat(201) }));
  assert.deepEqual(Object.keys(errores), ["usadosDetalle"]);
});

test("el largo del detalle se cuenta recortado", () => {
  const estado = con({ garantia: true, garantiaDetalle: `  ${"a".repeat(200)}  ` });
  assert.deepEqual(validarCondiciones(estado), {});
});

test("un banco repetido sin distinguir mayúsculas da error en bancos", () => {
  const errores = validarCondiciones(con({ trabajaBancos: true, bancos: ["Macro", "macro"] }));
  assert.deepEqual(Object.keys(errores), ["bancos"]);
});

test("una financiera repetida sin distinguir tildes da error en financieras", () => {
  const errores = validarCondiciones(con({ trabajaFinancieras: true, financieras: ["Crédito Ya", "credito ya"] }));
  assert.deepEqual(Object.keys(errores), ["financieras"]);
});

test("una lista de 16 nombres da error y una de 15 pasa", () => {
  assert.deepEqual(validarCondiciones(con({ trabajaBancos: true, bancos: quince() })), {});
  const errores = validarCondiciones(con({ trabajaBancos: true, bancos: [...quince(), "Banco 16"] }));
  assert.deepEqual(Object.keys(errores), ["bancos"]);
});

test("un nombre vacío o de 81 caracteres dentro de la lista da error", () => {
  assert.ok(validarCondiciones(con({ trabajaBancos: true, bancos: ["   "] })).bancos);
  assert.ok(validarCondiciones(con({ trabajaBancos: true, bancos: ["a".repeat(81)] })).bancos);
  assert.deepEqual(validarCondiciones(con({ trabajaBancos: true, bancos: ["a".repeat(80)] })), {});
});

test("un tipo de cuota fuera de fija, uva y fija_y_uva da error", () => {
  const errores = validarCondiciones(con({ tiposCuota: "mixta" }));
  assert.deepEqual(Object.keys(errores), ["tiposCuota"]);
  for (const valido of ["fija", "uva", "fija_y_uva", null]) {
    assert.deepEqual(validarCondiciones(con({ tiposCuota: valido })), {});
  }
});

for (const campo of ["trabajaBancos", "trabajaFinancieras", "financiaCasa", "garantia", "recibeUsados"]) {
  test(`${campo}: true, false y null pasan`, () => {
    for (const valor of [true, false, null]) {
      assert.deepEqual(validarCondiciones(con({ [campo]: valor })), {});
    }
  });

  test(`${campo}: "si" da error en ese campo`, () => {
    const errores = validarCondiciones(con({ [campo]: "si" }));
    assert.deepEqual(Object.keys(errores), [campo]);
    assert.equal(typeof errores[campo], "string");
  });
}

test("lo que no aplica no se valida: no se manda, así que no puede bloquear el guardado", () => {
  const estado = con({
    trabajaBancos: false,
    bancos: ["Macro", "macro"],
    garantia: false,
    garantiaDetalle: "a".repeat(300),
  });
  assert.deepEqual(validarCondiciones(estado), {});
});

// --- armarEnvio ---

test("el envío tiene exactamente las 10 claves", () => {
  assert.deepEqual(Object.keys(armarEnvio(vacio())).sort(), Object.keys(vacio()).sort());
});

test("el envío de un estado vacío deja todo en null y las listas vacías", () => {
  assert.deepEqual(armarEnvio(vacio()), vacio());
});

test("el envío recorta los nombres de las listas", () => {
  const envio = armarEnvio(con({ trabajaBancos: true, bancos: ["  Galicia  ", "Macro "] }));
  assert.deepEqual(envio.bancos, ["Galicia", "Macro"]);
});

test("el envío recorta los detalles y un detalle vacío o de espacios pasa a null", () => {
  const envio = armarEnvio(
    con({ garantia: true, garantiaDetalle: "  3 meses  ", recibeUsados: true, usadosDetalle: "   " }),
  );
  assert.equal(envio.garantiaDetalle, "3 meses");
  assert.equal(envio.usadosDetalle, null);
});

test("lo que no aplica no se manda: si pasa a No en bancos, bancos va vacía", () => {
  const envio = armarEnvio(con({ trabajaBancos: false, bancos: ["Galicia", "Macro"] }));
  assert.deepEqual(envio.bancos, []);
  assert.equal(envio.trabajaBancos, false);
});

test("lo que no aplica no se manda: bancos con Sin definir también va vacía", () => {
  assert.deepEqual(armarEnvio(con({ trabajaBancos: null, bancos: ["Galicia"] })).bancos, []);
});

test("lo que no aplica no se manda: financieras distinto de Sí va vacía", () => {
  assert.deepEqual(armarEnvio(con({ trabajaFinancieras: false, financieras: ["Credicuotas"] })).financieras, []);
  assert.deepEqual(armarEnvio(con({ trabajaFinancieras: null, financieras: ["Credicuotas"] })).financieras, []);
});

test("con Sí en bancos y financieras las listas se mandan", () => {
  const envio = armarEnvio(
    con({ trabajaBancos: true, bancos: ["Macro"], trabajaFinancieras: true, financieras: ["Credicuotas"] }),
  );
  assert.deepEqual(envio.bancos, ["Macro"]);
  assert.deepEqual(envio.financieras, ["Credicuotas"]);
});

test("lo que no aplica no se manda: garantía distinta de Sí deja garantiaDetalle en null", () => {
  assert.equal(armarEnvio(con({ garantia: false, garantiaDetalle: "3 meses" })).garantiaDetalle, null);
  assert.equal(armarEnvio(con({ garantia: null, garantiaDetalle: "3 meses" })).garantiaDetalle, null);
});

test("lo que no aplica no se manda: recibe usados distinto de Sí deja usadosDetalle en null", () => {
  assert.equal(armarEnvio(con({ recibeUsados: false, usadosDetalle: "solo autos" })).usadosDetalle, null);
  assert.equal(armarEnvio(con({ recibeUsados: null, usadosDetalle: "solo autos" })).usadosDetalle, null);
});

test("armar el envío no modifica el estado del formulario", () => {
  const estado = con({ trabajaBancos: false, bancos: [" Macro "], garantia: false, garantiaDetalle: " x " });
  const copia = structuredClone(estado);
  armarEnvio(estado);
  assert.deepEqual(estado, copia);
});

// --- hayCambios ---

test("sin tocar nada no hay cambios", () => {
  const guardado = con({ trabajaBancos: true, bancos: ["Macro"], tiposCuota: "uva" });
  assert.equal(hayCambios(guardado, structuredClone(guardado)), false);
});

test("cambiar una booleana o el tipo de cuota es un cambio", () => {
  assert.equal(hayCambios(vacio(), con({ financiaCasa: true })), true);
  assert.equal(hayCambios(vacio(), con({ tiposCuota: "fija" })), true);
});

test("agregar o sacar un nombre es un cambio", () => {
  const guardado = con({ trabajaBancos: true, bancos: ["Macro"] });
  assert.equal(hayCambios(guardado, con({ trabajaBancos: true, bancos: ["Macro", "Galicia"] })), true);
  assert.equal(hayCambios(guardado, con({ trabajaBancos: true, bancos: [] })), true);
});

test("escribir espacios de más no cuenta como cambio, porque se manda lo mismo", () => {
  const guardado = con({ garantia: true, garantiaDetalle: "3 meses" });
  assert.equal(hayCambios(guardado, con({ garantia: true, garantiaDetalle: "  3 meses  " })), false);
  assert.equal(hayCambios(vacio(), con({ garantia: true, garantiaDetalle: "   " })), true); // garantía pasa de null a Sí
});

test("escribir en un campo que no aplica no cuenta como cambio", () => {
  const guardado = con({ garantia: false });
  assert.equal(hayCambios(guardado, con({ garantia: false, garantiaDetalle: "algo" })), false);
  assert.equal(hayCambios(vacio(), con({ trabajaBancos: null, bancos: ["Macro"] })), false);
});

test("pasar a No con bancos cargados es un cambio", () => {
  const guardado = con({ trabajaBancos: true, bancos: ["Macro"] });
  assert.equal(hayCambios(guardado, con({ trabajaBancos: false, bancos: ["Macro"] })), true);
});

// --- aOpcion / deOpcion ---

test("aOpcion convierte true, false y null en si, no y sin_definir", () => {
  assert.equal(aOpcion(true), "si");
  assert.equal(aOpcion(false), "no");
  assert.equal(aOpcion(null), "sin_definir");
});

test("deOpcion es la inversa de aOpcion y lo desconocido queda en null", () => {
  assert.equal(deOpcion("si"), true);
  assert.equal(deOpcion("no"), false);
  assert.equal(deOpcion("sin_definir"), null);
  assert.equal(deOpcion("cualquier cosa"), null);
  for (const valor of [true, false, null]) assert.equal(deOpcion(aOpcion(valor)), valor);
});

// --- escenarios del spec ---

test("validación antes de mandar: un banco que ya está o un nombre vacío dan error y no hay envío válido", () => {
  assert.ok(validarNombreNuevo(["Galicia"], "galicia"));
  assert.ok(validarNombreNuevo(["Galicia"], ""));
  assert.ok(validarCondiciones(con({ trabajaBancos: true, bancos: ["Galicia", "galicia"] })).bancos);
});

test("lo que no aplica no se manda: tenía bancos, pasa a No y se manda bancos vacía", () => {
  const original = con({ trabajaBancos: true, bancos: ["Galicia", "Macro"] });
  const estado = { ...original, trabajaBancos: false };
  assert.equal(hayCambios(original, estado), true);
  assert.deepEqual(validarCondiciones(estado), {});
  assert.deepEqual(armarEnvio(estado).bancos, []);
});
