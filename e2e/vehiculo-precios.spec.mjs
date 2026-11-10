import { test, expect } from "@playwright/test";

// Anticipo y precio al contado de punta a punta, contra el stack local. Crea un
// auto, un trámite y un cliente de prueba, y al terminar borra solo esos ids.

const BACKEND = new URL("../../backend/", import.meta.url);
const API = "http://localhost:4000/api";
const SELLO = String(Date.now()).slice(-7);
const MARCA = `E2E-PRECIOS-${SELLO}`;
const TITULAR = `Titular E2E ${SELLO}`;
const DNI = `9${SELLO}`;

let prisma;
let token;
let autoId = null;
let ref = null;
let ingresoId = null;
let clienteId = null;

test.describe.configure({ mode: "serial" });

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
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript((valor) => localStorage.setItem("agencia_token", valor), token);
});

async function borrarTramite() {
  if (ingresoId) await prisma.consignacion_ingresos.delete({ where: { id: ingresoId } });
  if (clienteId) {
    await prisma.cliente_perfiles.deleteMany({ where: { cliente_id: clienteId } });
    await prisma.cliente_canales.deleteMany({ where: { cliente_id: clienteId } });
    await prisma.clientes.delete({ where: { id: clienteId } });
  }
  ingresoId = null;
  clienteId = null;
}

test.afterAll(async () => {
  if (!prisma) return;
  await borrarTramite();
  // La marca lleva un sello único de esta corrida; sus vistas se borran en cascada.
  await prisma.autos.deleteMany({ where: { marca: MARCA } });
  await prisma.$disconnect();
});

async function abrirSeccion(page, nombre) {
  await page.goto("/admin");
  await page.locator("aside").getByText(nombre, { exact: true }).click();
}

test("el menú no ofrece Descuentos/Promos", async ({ page }) => {
  await page.goto("/admin");
  const menu = page.locator("aside");
  await expect(menu.getByText("Vehículos", { exact: true })).toBeVisible();
  await expect(menu.getByText("Descuentos/Promos")).toHaveCount(0);
});

test("Nuevo guarda los dos datos y la ficha pública los muestra", async ({ page }, testInfo) => {
  await abrirSeccion(page, "Vehículos");
  await page.getByRole("button", { name: "Nuevo vehículo" }).click();
  await page.getByLabel("Marca / Nombre *").fill(MARCA);
  await page.getByLabel("Modelo *").fill("Prueba");
  await page.getByLabel("Año *").fill("2020");
  await page.getByLabel("Precio (ARS) *").fill("12000000");
  await page.getByLabel("Precio al contado (ARS)").fill("10000000");
  await page.getByLabel("Anticipo (ARS)").fill("3000000");
  await page.getByRole("button", { name: "Crear vehículo" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo vehículo" })).toHaveCount(0);

  const auto = await prisma.autos.findFirst({ where: { marca: MARCA } });
  autoId = auto.id;
  ref = auto.ref;
  expect(Number(auto.precio_contado)).toBe(10000000);
  expect(Number(auto.anticipo)).toBe(3000000);

  await page.goto(`/catalogo/${ref}`);
  const condiciones = page.locator("dl", { hasText: "Precio al contado" });
  await expect(condiciones).toContainText(/10\.000\.000/);
  await expect(condiciones).toContainText("Anticipo");
  await expect(condiciones).toContainText(/3\.000\.000/);
  await page.screenshot({ path: testInfo.outputPath("ficha.png"), fullPage: true });
});

test("el boleto de una venta al contado arranca con el precio al contado", async ({ page, request }) => {
  expect(await prisma.clientes.findFirst({ where: { dni: DNI } })).toBeNull();

  const respuesta = await request.post(`${API}/ingresos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { modalidad: "contado", autoInteresRef: ref, titular: { nombre: TITULAR, dni: DNI } },
  });
  expect(respuesta.status()).toBe(201);
  ingresoId = (await respuesta.json()).data.id;
  const ingreso = await prisma.consignacion_ingresos.findUnique({ where: { id: ingresoId }, select: { cliente_id: true } });
  clienteId = ingreso.cliente_id;

  await abrirSeccion(page, "Documentos");
  await page.getByRole("button", { name: "Venta al contado" }).click();
  await page.getByRole("row", { name: new RegExp(TITULAR) }).click();
  await page.getByRole("button", { name: "Cargar condiciones" }).click();
  await expect(page.getByLabel("Precio de venta ($) *")).toHaveValue("10.000.000");

  await borrarTramite();
});

test("Editar trae los datos y vaciarlos los saca de la ficha", async ({ page }) => {
  await abrirSeccion(page, "Vehículos");
  await page.getByRole("row", { name: new RegExp(MARCA) }).getByTitle("Editar").click();
  await expect(page.getByLabel("Precio al contado (ARS)")).toHaveValue("10.000.000");
  await expect(page.getByLabel("Anticipo (ARS)")).toHaveValue("3.000.000");

  await page.getByLabel("Precio al contado (ARS)").fill("");
  await page.getByLabel("Anticipo (ARS)").fill("");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { name: "Editar vehículo" })).toHaveCount(0);

  const auto = await prisma.autos.findUnique({ where: { id: autoId } });
  expect(auto.precio_contado).toBeNull();
  expect(auto.anticipo).toBeNull();

  await page.goto(`/catalogo/${ref}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(MARCA);
  await expect(page.getByText("Precio al contado")).toHaveCount(0);
  await expect(page.getByText("Anticipo")).toHaveCount(0);
});
