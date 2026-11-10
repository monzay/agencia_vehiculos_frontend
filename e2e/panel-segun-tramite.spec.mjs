import { test, expect } from "@playwright/test";

// Lo que el panel muestra según el tipo de trámite, y lo que se sacó de Resumen,
// Consultas y el legajo. Corre contra el stack local. Crea un vehículo, un cliente, una
// consulta y trámites de prueba, y al terminar borra solo esos ids.

const BACKEND = new URL("../../backend/", import.meta.url);
const API = "http://localhost:4000/api";
const SELLO = String(Date.now()).slice(-7);
const REF = `E2E${SELLO}`;
const MARCA = `E2E-PANEL-${SELLO}`;
const TITULAR = `Titular Panel ${SELLO}`;
const DNI = `8${SELLO}`;
const CUENTA = { cbu: `${"1".repeat(15)}${SELLO}`, aliasCbu: `alias.e2e.${SELLO}` };
const ESTADO_DE_LA_UNIDAD = "Estado de la unidad al recibirla";

const PESTANA = {
  consignacion: "Consignación",
  contado: "Venta al contado",
  permuta: "Parte de pago o financiado",
  compra: "Compra de la agencia",
};

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
    data: { nombre: TITULAR, dni: DNI, telefono: `387${SELLO}`, canal: "whatsapp" },
    select: { id: true },
  });
  clienteId = cliente.id;

  const ahora = new Date();
  const sesion = await prisma.chat_estado.create({
    data: {
      cliente_id: clienteId,
      paso_actual: "handoff",
      score: 3,
      clasificacion: "TIBIO",
      alerta_enviada: true,
      pago_tipo: "contado",
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

const tarjeta = (page, opcion) => page.getByRole("button", { name: new RegExp(`^${opcion} `) });

async function conTramite(request, cuerpo, probar) {
  const respuesta = await request.post(`${API}/ingresos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { titular: { nombre: TITULAR, dni: DNI, ...CUENTA }, ...cuerpo },
  });
  expect(respuesta.status()).toBe(201);
  const { id } = (await respuesta.json()).data;
  try {
    await probar(id);
  } finally {
    await prisma.preparaciones.deleteMany({ where: { ingreso_id: id } });
    await prisma.consignacion_ingresos.delete({ where: { id } });
  }
}

async function abrirLegajo(page, pestana) {
  await abrirSeccion(page, "Documentos");
  await page.getByRole("button", { name: pestana, exact: true }).click();
  await page.getByRole("row", { name: new RegExp(TITULAR) }).click();
  await expect(page.getByText("Fechas", { exact: true })).toBeVisible();
}

async function abrirBoleto(page, pestana) {
  await abrirLegajo(page, pestana);
  await page.getByRole("button", { name: "Contrato", exact: true }).click();
  await page.getByRole("button", { name: "Cargar condiciones" }).click();
  await expect(page.getByLabel("Condiciones particulares")).toBeVisible();
}

test("Resumen no muestra la conversión de consultas", async ({ page }) => {
  await abrirSeccion(page, "Resumen");
  await expect(page.getByRole("heading", { name: "Resumen general" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Conversión de consultas")).toHaveCount(0);
});

test("el menú ya no tiene la sección Preparación", async ({ page }) => {
  await page.goto("/admin");
  const menu = page.locator("aside");
  await expect(menu.getByText("Documentos", { exact: true })).toBeVisible();
  await expect(menu.getByText("Preparación", { exact: true })).toHaveCount(0);
});

test("un usado recibido se publica desde su legajo en Documentos", async ({ page, request }) => {
  await conTramite(request, { modalidad: "compra" }, async (id) => {
    await prisma.preparaciones.create({ data: { ingreso_id: id } });
    await abrirLegajo(page, PESTANA.compra);
    await page.getByRole("button", { name: "Publicado en la web" }).click();
    await expect(page.getByRole("heading", { name: "Para publicar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publicar", exact: true })).toBeVisible();
    // Sigue en el legajo: no se fue a otra sección.
    await expect(page.getByText("Fechas", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publicación", exact: true })).toBeVisible();
  });
});

test("un trámite sin usado recibido no tiene la pestaña Publicación", async ({ page, request }) => {
  await conTramite(request, { modalidad: "contado", autoInteresRef: REF }, async () => {
    await abrirLegajo(page, PESTANA.contado);
    await expect(page.getByRole("button", { name: "Contrato", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publicación", exact: true })).toHaveCount(0);
  });
});

test("Consultas no ofrece elegir el tipo", async ({ page }) => {
  await abrirSeccion(page, "Consultas");
  await expect(page.getByRole("button", { name: "Calientes", exact: true })).toBeVisible();
  for (const tipo of ["Compra", "Venta directa", "Consignación"]) {
    await expect(page.getByRole("button", { name: tipo, exact: true })).toHaveCount(0);
  }
});

test("los formularios de venta y compra no piden CBU ni alias", async ({ page }) => {
  await abrirSeccion(page, "Trámites");
  const formularios = [
    ["Venta al contado", "Nueva venta al contado"],
    ["Venta financiada o con parte de pago", "Nueva parte de pago o financiado"],
    ["Compra de la agencia", "Nueva compra"],
  ];
  for (const [opcion, titulo] of formularios) {
    await tarjeta(page, opcion).click();
    await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
    await expect(page.getByLabel("CBU")).toHaveCount(0);
    await expect(page.getByLabel("Alias")).toHaveCount(0);
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { name: titulo })).toHaveCount(0);
  }
});

test("el formulario de consignación sigue pidiendo CBU y alias", async ({ page }) => {
  await abrirSeccion(page, "Trámites");
  await tarjeta(page, "Consignación").click();
  await expect(page.getByRole("heading", { name: "Nueva consignación" })).toBeVisible();
  await expect(page.getByLabel("CBU")).toBeVisible();
  await expect(page.getByLabel("Alias")).toBeVisible();
});

test("el legajo de una venta no muestra CBU ni Ver consulta", async ({ page, request }) => {
  await conTramite(request, { modalidad: "contado", autoInteresRef: REF, sesionId }, async () => {
    await abrirLegajo(page, PESTANA.contado);
    await expect(page.getByText("CBU / Alias")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ver consulta" })).toHaveCount(0);
  });
});

test("el legajo de una consignación muestra CBU", async ({ page, request }) => {
  await conTramite(request, { modalidad: "consignacion" }, async () => {
    await abrirLegajo(page, PESTANA.consignacion);
    await expect(page.getByText("CBU / Alias")).toBeVisible();
  });
});

test("el boleto de una parte de pago sin usado no pide el estado de la unidad", async ({ page, request }) => {
  await conTramite(request, { modalidad: "permuta", autoInteresRef: REF, parteDePagoEfectivo: 1000000 }, async () => {
    await abrirBoleto(page, PESTANA.permuta);
    await expect(page.getByLabel(ESTADO_DE_LA_UNIDAD)).toHaveCount(0);
  });
});

test("el boleto de una venta al contado no pide el estado de la unidad", async ({ page, request }) => {
  await conTramite(request, { modalidad: "contado", autoInteresRef: REF }, async () => {
    await abrirBoleto(page, PESTANA.contado);
    await expect(page.getByLabel(ESTADO_DE_LA_UNIDAD)).toHaveCount(0);
  });
});

test("el boleto de una parte de pago con usado pide el estado de la unidad", async ({ page, request }) => {
  const usado = { parteDePagoVehiculo: "Volkswagen Gol 2015", parteDePagoValor: 5000000 };
  await conTramite(request, { modalidad: "permuta", autoInteresRef: REF, ...usado }, async () => {
    await abrirBoleto(page, PESTANA.permuta);
    await expect(page.getByLabel(ESTADO_DE_LA_UNIDAD)).toBeVisible();
  });
});

test("el boleto de una compra pide el estado de la unidad", async ({ page, request }) => {
  await conTramite(request, { modalidad: "compra" }, async () => {
    await abrirBoleto(page, PESTANA.compra);
    await expect(page.getByLabel(ESTADO_DE_LA_UNIDAD)).toBeVisible();
  });
});
