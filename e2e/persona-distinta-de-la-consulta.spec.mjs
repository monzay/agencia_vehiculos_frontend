import { test, expect } from "@playwright/test";

// Alguien consulta desde el teléfono de otra persona (la madre) y el que viene a comprar
// es otro. Corre contra el stack local. Crea un vehículo, un cliente y una consulta de
// prueba, y al terminar borra solo esos ids.

const BACKEND = new URL("../../backend/", import.meta.url);
const SELLO = String(Date.now()).slice(-7);
const REF = `E2E${SELLO}`;
const MARCA = `E2E-PERSONA-${SELLO}`;
const MADRE = `Madre E2E ${SELLO}`;
const PEDRO = `Pedro E2E ${SELLO}`;
// Con característica real: un número que no es argentino no se reconoce.
const TELEFONO = `3885${SELLO.slice(-6)}`;
const DNI = `7${SELLO}`;

let prisma;
let token;
let autoId = null;
let clienteId = null;
let sesionId = null;

test.beforeAll(async () => {
  process.loadEnvFile(new URL(".env", BACKEND));
  if (new URL(process.env.DATABASE_URL).hostname !== "localhost") {
    throw new Error("Esta prueba solo corre contra la base local");
  }
  ({ prisma } = await import(new URL("src/lib/prisma.js", BACKEND).href));
  const { firmarToken } = await import(new URL("src/lib/auth.js", BACKEND).href);
  const admin = await prisma.usuarios.findFirst({
    where: { rol: "admin", activo: true, deleted_at: null },
    select: { id: true, rol: true, nombre: true },
  });
  token = firmarToken(admin);

  const auto = await prisma.autos.create({
    data: { ref: REF, marca: MARCA, modelo: "Prueba", anio: 2020, tipo: "km", precio: 12000000 },
    select: { id: true },
  });
  autoId = auto.id;

  const cliente = await prisma.clientes.create({
    data: {
      nombre: MADRE,
      telefono: TELEFONO,
      canal: "whatsapp",
      canales: { create: { canal: "whatsapp", identificador: `549${TELEFONO}` } },
    },
    select: { id: true },
  });
  clienteId = cliente.id;

  const ahora = new Date();
  const sesion = await prisma.chat_estado.create({
    data: {
      cliente_id: clienteId,
      auto_id: autoId,
      paso_actual: "handoff",
      score: 5,
      clasificacion: "TIBIO",
      alerta_enviada: true,
      pago_tipo: "contado",
      entrega_usado: false,
      sesion_inicio: ahora,
      ultimo_mensaje: ahora,
      updated_at: ahora,
    },
    select: { id: true },
  });
  sesionId = sesion.id;
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript((valor) => localStorage.setItem("agencia_token", valor), token);
});

test.afterAll(async () => {
  if (!prisma) return;
  if (sesionId) {
    await prisma.consignacion_ingresos.deleteMany({ where: { sesion_id: sesionId } });
    await prisma.chat_estado.delete({ where: { id: sesionId } });
  }
  if (clienteId) {
    // Si la prueba falla, puede haber quedado otra ficha con el DNI de esta corrida.
    await prisma.clientes.deleteMany({ where: { dni: DNI, id: { not: clienteId } } });
    await prisma.cliente_perfiles.deleteMany({ where: { cliente_id: clienteId } });
    await prisma.cliente_canales.deleteMany({ where: { cliente_id: clienteId } });
    await prisma.clientes.delete({ where: { id: clienteId } });
  }
  if (autoId) await prisma.autos.delete({ where: { id: autoId } });
  await prisma.$disconnect();
});

async function abrirSeccion(page, nombre) {
  await page.goto("/admin");
  await page.locator("aside").getByText(nombre, { exact: true }).click();
}

test("si consulta desde el teléfono de la madre y viene otra persona, la consulta queda con su nombre y su DNI", async ({ page }) => {
  await abrirSeccion(page, "Consultas");
  await page.getByRole("row", { name: new RegExp(MADRE) }).click();
  await page.getByRole("button", { name: "Avanzar" }).click();
  await page.getByRole("button", { name: /^Venta al contado / }).click();

  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(MADRE);
  await page.getByLabel("Nombre", { exact: true }).fill(PEDRO);
  await page.getByLabel("DNI", { exact: true }).fill(DNI);
  await page.getByRole("button", { name: "Crear trámite" }).click();
  await expect(page.getByRole("heading", { name: "Nueva venta al contado" })).toHaveCount(0);

  const tramite = await prisma.consignacion_ingresos.findFirst({ where: { sesion_id: sesionId, deleted_at: null } });
  expect(tramite.cliente_id).toBe(clienteId);

  const ficha = await prisma.clientes.findUnique({ where: { id: clienteId } });
  expect(ficha.nombre).toBe(PEDRO);
  expect(ficha.dni).toBe(DNI);
  expect(ficha.telefono).toBe(TELEFONO);
  expect(await prisma.clientes.count({ where: { telefono: TELEFONO } })).toBe(1);

  await abrirSeccion(page, "Consultas");
  await expect(page.getByRole("row", { name: new RegExp(PEDRO) })).toBeVisible();
});
