import { test } from "node:test";
import assert from "node:assert/strict";
import { aFormulario, aPayload, apagarCortado, prenderCortado, textoDelDia, validarHorarios } from "./horarios.js";

test("al prender cortado, el día se parte a las 13 y a las 16", () => {
  const dia = { abierto: true, apertura: "08:00", cierre: "21:00", cortado: false };
  const resultado = prenderCortado(dia);
  assert.equal(resultado.apertura, "08:00");
  assert.equal(resultado.cierre, "13:00");
  assert.equal(resultado.apertura_2, "16:00");
  assert.equal(resultado.cierre_2, "21:00");
  assert.equal(resultado.cortado, true);
  assert.equal(dia.cierre, "21:00");
});

test("al apagar cortado, el día vuelve a ser corrido de punta a punta", () => {
  const dia = {
    abierto: true,
    apertura: "08:00",
    cierre: "13:00",
    cortado: true,
    apertura_2: "16:00",
    cierre_2: "21:00",
  };
  const resultado = apagarCortado(dia);
  assert.equal(resultado.apertura, "08:00");
  assert.equal(resultado.cierre, "21:00");
  assert.equal(resultado.cortado, false);
  assert.ok(!resultado.apertura_2);
  assert.ok(!resultado.cierre_2);
});

test("el panel rechaza una segunda franja que se pisa con la primera", () => {
  const semana = (lunes) =>
    aFormulario([{ dia: 1, abierto: true, apertura: "08:00", cierre: lunes.cierre, apertura_2: lunes.apertura_2, cierre_2: "21:00" }]);

  const pisada = validarHorarios(semana({ cierre: "13:00", apertura_2: "12:00" }));
  assert.match(pisada, /lunes/i);

  assert.equal(validarHorarios(semana({ cierre: "13:00", apertura_2: "16:00" })), null);
});

test("solo los días cortados mandan la segunda franja", () => {
  const mapa = aFormulario([
    { dia: 1, abierto: true, apertura: "08:00", cierre: "13:00", apertura_2: "16:00", cierre_2: "21:00" },
    { dia: 2, abierto: true, apertura: "09:00", cierre: "18:00", apertura_2: null, cierre_2: null },
    { dia: 3, abierto: false, apertura: null, cierre: null, apertura_2: null, cierre_2: null },
  ]);
  const payload = aPayload(mapa);
  const porDia = (dia) => payload.find((d) => d.dia === dia);

  assert.equal(porDia(1).apertura_2, "16:00");
  assert.equal(porDia(1).cierre_2, "21:00");
  assert.equal(porDia(2).apertura_2, null);
  assert.equal(porDia(2).cierre_2, null);
  assert.deepEqual(porDia(3), {
    dia: 3,
    abierto: false,
    apertura: null,
    cierre: null,
    apertura_2: null,
    cierre_2: null,
  });
});

test("un día cortado se muestra con las dos franjas", () => {
  const texto = textoDelDia({
    abierto: true,
    apertura: "08:00",
    cierre: "13:00",
    apertura_2: "16:00",
    cierre_2: "21:00",
  });
  assert.equal(texto, "08:00 - 13:00 y 16:00 - 21:00");
});

test("un día corrido y uno cerrado se muestran como antes", () => {
  assert.equal(textoDelDia({ abierto: true, apertura: "09:00", cierre: "18:00" }), "09:00 - 18:00");
  assert.equal(textoDelDia({ abierto: false, apertura: null, cierre: null }), "Cerrado");
});

test("el panel rechaza una hora que no es HH:MM", () => {
  const lunes = (dia) => aFormulario([{ dia: 1, abierto: true, apertura: "08:00", cierre: "21:00", ...dia }]);

  assert.match(validarHorarios(lunes({ apertura: "8:00" })), /lunes/i);
  assert.match(
    validarHorarios(lunes({ cierre: "13:00", apertura_2: "16h", cierre_2: "21:00" })),
    /lunes/i,
  );
  assert.equal(validarHorarios(lunes({})), null);
});
