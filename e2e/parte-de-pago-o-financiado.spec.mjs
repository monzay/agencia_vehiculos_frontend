import { test, expect } from "@playwright/test";

// La parte de pago también sirve para una venta financiada: el cliente deja el anticipo
// del vehículo y no entrega usado. Corre contra el stack local. Crea un vehículo, un
// cliente y una consulta de prueba, y al terminar borra solo esos ids.

const BACKEND = new URL("../../backend/", import.meta.url);
const SELLO = String(Date.now()).slice(-7);
const REF = `E2E${SELLO}`;
const MARCA = `E2E-FINANCIADO-${SELLO}`;
const NOMBRE = `Financia E2E ${SELLO}`;
const TELEFONO = `388${SELLO}`;
const DNI = `9${SELLO}`;
const ANTICIPO = 3000000;
const ANTICIPO_EN_PANTALLA = "3.000.000";

const OPCION = "Venta financiada o con parte de pago";
const TITULO_FORMULARIO = "Nueva parte de pago o financiado";
const NOMBRE_EN_DOCUMENTOS = "Parte de pago o financiado";
const CAMPO_MONTO = "Anticipo o lo que tiene para entregar ($)";
const AVISO_SIN_DOMINIO = "no tiene dominio cargado";

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
    data: { ref: REF, marca: MARCA, modelo: "Prueba", anio: 2020, tipo: "km", precio: 12000000, anticipo: ANTICIPO },
    select: { id: true },
  });
  autoId = auto.id;

  const cliente = await prisma.clientes.create({
    data: { nombre: NOMBRE, telefono: TELEFONO, canal: "whatsapp" },
    select: { id: true },
  });
  clienteId = cliente.id;

  const ahora = new Date();
  const sesion = await prisma.chat_estado.create({
    data: {
      cliente_id: clienteId,
      auto_id: autoId,
      paso_actual: "handoff",
      score: 2,
      clasificacion: "FRIO",
      alerta_enviada: true,
      pago_tipo: "financiado",
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

async function borrarTramite() {
  if (sesionId) await prisma.consignacion_ingresos.deleteMany({ where: { sesion_id: sesionId } });
}

test.afterAll(async () => {
  if (!prisma) return;
  await borrarTramite();
  if (sesionId) await prisma.chat_estado.delete({ where: { id: sesionId } });
  if (clienteId) {
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

const elegirOpcion = (page) => page.getByRole("button", { name: new RegExp(`^${OPCION} `) }).click();
const tituloDelFormulario = (page) => page.getByRole("heading", { name: TITULO_FORMULARIO });

test("desde una consulta sin usado trae el anticipo y crea el trámite", async ({ page }) => {
  await abrirSeccion(page, "Consultas");
  await page.getByRole("row", { name: new RegExp(NOMBRE) }).click();
  await page.getByRole("button", { name: "Avanzar" }).click();
  await elegirOpcion(page);

  await expect(tituloDelFormulario(page)).toBeVisible();
  await expect(page.getByLabel(CAMPO_MONTO)).toHaveValue(ANTICIPO_EN_PANTALLA);

  await page.getByLabel("DNI", { exact: true }).fill(DNI);
  await page.getByRole("button", { name: "Crear trámite" }).click();
  await expect(tituloDelFormulario(page)).toHaveCount(0);

  const tramite = await prisma.consignacion_ingresos.findFirst({ where: { sesion_id: sesionId, deleted_at: null } });
  expect(tramite.modalidad).toBe("permuta");
  expect(tramite.cliente_id).toBe(clienteId);
  expect(tramite.auto_interes_id).toBe(autoId);
  expect(Number(tramite.parte_pago_efectivo)).toBe(ANTICIPO);
  expect(tramite.parte_pago_vehiculo).toBeNull();

  await expect(page.getByRole("button", { name: NOMBRE_EN_DOCUMENTOS })).toBeVisible();
  await borrarTramite();
});

test("el trámite se crea sin aviso de dominio y el boleto pide dominio, motor y chasis", async ({ page }) => {
  await abrirSeccion(page, "Consultas");
  await page.getByRole("row", { name: new RegExp(NOMBRE) }).click();
  await page.getByRole("button", { name: "Avanzar" }).click();
  await elegirOpcion(page);

  // "Precio de lista" aparece cuando ya cargó el stock, que es cuando saldría el aviso.
  await expect(page.getByText("Precio de lista")).toBeVisible();
  await expect(page.getByText(AVISO_SIN_DOMINIO)).toHaveCount(0);

  await page.getByLabel("DNI", { exact: true }).fill(DNI);
  await page.getByRole("button", { name: "Crear trámite" }).click();
  await expect(tituloDelFormulario(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Cargar condiciones" }).click();
  for (const campo of ["Dominio *", "Número de motor *", "Número de chasis *"]) {
    await expect(page.getByLabel(campo)).toHaveValue("");
  }
  await borrarTramite();
});

test("desde Trámites propone el anticipo al marcar que no entrega vehículo", async ({ page }) => {
  await abrirSeccion(page, "Trámites");
  await elegirOpcion(page);
  await expect(tituloDelFormulario(page)).toBeVisible();

  await page.getByLabel("Vehículo *").selectOption(REF);
  const monto = page.getByLabel(CAMPO_MONTO);
  await expect(monto).toHaveValue("");

  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect(monto).toHaveValue(ANTICIPO_EN_PANTALLA);

  // El primer botón dentro de un <label> toma el nombre del label: se lo busca por su texto.
  await page.locator("button", { hasText: /^Sí$/ }).click();
  await expect(monto).toHaveValue("");
});
