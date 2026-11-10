import { test, expect } from "@playwright/test";

// Avanzar desde una consulta no pide buscar al cliente: ya se sabe quién es. Corre
// contra el stack local. Crea un cliente y una consulta de prueba, y al terminar borra
// solo esos ids. Ningún formulario se confirma, así que no nace ningún trámite.

const BACKEND = new URL("../../backend/", import.meta.url);
const SELLO = String(Date.now()).slice(-7);
const NOMBRE = `Cliente E2E ${SELLO}`;
const TELEFONO = `388${SELLO}`;
const CUIL = `20${SELLO}01`;
const BUSCADOR = "Buscar por DNI, nombre o teléfono…";
const PEDIDO_DE_BUSCAR = "Buscalo primero";

// Títulos completos: las anclas de OpenSpec los buscan tal cual en este archivo.
const DESDE_CONSULTA = [
  {
    titulo: "Seña desde una consulta no muestra el buscador y trae los datos",
    operacion: "Seña",
    etiquetaNombre: "Nombre *",
    etiquetaDni: "DNI *",
  },
  {
    titulo: "Venta al contado desde una consulta no muestra el buscador y trae los datos",
    operacion: "Venta al contado",
    etiquetaNombre: "Nombre",
    etiquetaDni: "DNI",
  },
  {
    titulo: "Venta financiada o con parte de pago desde una consulta no muestra el buscador y trae los datos",
    operacion: "Venta financiada o con parte de pago",
    etiquetaNombre: "Nombre",
    etiquetaDni: "DNI",
  },
];

const DESDE_TRAMITES = [
  { titulo: "Seña desde Trámites sigue ofreciendo el buscador", operacion: "Seña" },
  { titulo: "Venta al contado desde Trámites sigue ofreciendo el buscador", operacion: "Venta al contado" },
];

let prisma;
let token;
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

  const cliente = await prisma.clientes.create({
    data: { nombre: NOMBRE, telefono: TELEFONO, cuil: CUIL, canal: "whatsapp" },
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
  if (clienteId) await prisma.clientes.delete({ where: { id: clienteId } });
  await prisma.$disconnect();
});

async function abrirSeccion(page, nombre) {
  await page.goto("/admin");
  await page.locator("aside").getByText(nombre, { exact: true }).click();
}

// El espacio separa la tarjeta "Seña …" del botón "Señas" del menú.
const tarjeta = (page, operacion) => page.getByRole("button", { name: new RegExp(`^${operacion} `) });

for (const { titulo, operacion, etiquetaNombre, etiquetaDni } of DESDE_CONSULTA) {
  test(titulo, async ({ page }) => {
    await abrirSeccion(page, "Consultas");
    await page.getByRole("row", { name: new RegExp(NOMBRE) }).click();
    await page.getByRole("button", { name: "Avanzar" }).click();
    await tarjeta(page, operacion).click();

    await expect(page.getByLabel(etiquetaNombre, { exact: true })).toHaveValue(NOMBRE);
    await expect(page.getByLabel("Teléfono", { exact: true })).toHaveValue(TELEFONO);
    await expect(page.getByLabel(etiquetaDni, { exact: true })).toHaveValue("");
    await expect(page.getByPlaceholder(BUSCADOR)).toHaveCount(0);
    await expect(page.getByText(PEDIDO_DE_BUSCAR)).toHaveCount(0);
  });
}

for (const { titulo, operacion } of DESDE_TRAMITES) {
  test(titulo, async ({ page }) => {
    await abrirSeccion(page, "Trámites");
    await tarjeta(page, operacion).click();

    await expect(page.getByPlaceholder(BUSCADOR)).toBeVisible();
    await expect(page.getByText(PEDIDO_DE_BUSCAR)).toBeVisible();
  });
}
