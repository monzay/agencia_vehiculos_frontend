import { test, expect } from "@playwright/test";

// Qué ve cada usuario en Consultas, contra el stack local. Crea sus propias fichas de asesor,
// usuarios, clientes y consultas, y al terminar borra físicamente solo los ids que creó.

const BACKEND = new URL("../../backend/", import.meta.url);
const SELLO = `E2E-ACC-${String(Date.now()).slice(-7)}`;

let prisma;
let tokenAdmin;
let tokenAsesorA;
const creados = { vendedores: [], usuarios: [], clientes: [], sesiones: [] };

test.describe.configure({ mode: "serial" });

const nombreDe = (sufijo) => `${SELLO} ${sufijo}`;

async function crearAsesor(sufijo) {
  const ficha = await prisma.vendedores.create({ data: { nombre: nombreDe(`asesor ${sufijo}`) } });
  creados.vendedores.push(ficha.id);
  const usuario = await prisma.usuarios.create({
    data: {
      nombre: nombreDe(`usuario ${sufijo}`),
      email: `${SELLO.toLowerCase()}-${sufijo}@example.com`,
      password_hash: "x",
      rol: "asesor",
      vendedor_id: ficha.id,
    },
    select: { id: true, rol: true, nombre: true },
  });
  creados.usuarios.push(usuario.id);
  return { ficha, usuario };
}

async function crearConsulta(sufijo, vendedorId) {
  const cliente = await prisma.clientes.create({ data: { nombre: nombreDe(sufijo), canal: "web" } });
  creados.clientes.push(cliente.id);
  const sesion = await prisma.chat_estado.create({
    data: { cliente_id: cliente.id, vendedor_id: vendedorId, clasificacion: "CALIENTE", score: 10 },
  });
  creados.sesiones.push(sesion.id);
}

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
  tokenAdmin = firmarToken(admin);
  const a = await crearAsesor("A");
  const b = await crearAsesor("B");
  tokenAsesorA = firmarToken(a.usuario);
  await crearConsulta("consulta de A", a.ficha.id);
  await crearConsulta("consulta de B", b.ficha.id);
  await crearConsulta("consulta sin asignar", null);
});

test.afterAll(async () => {
  if (!prisma) return;
  await prisma.chat_estado.deleteMany({ where: { id: { in: creados.sesiones } } });
  await prisma.clientes.deleteMany({ where: { id: { in: creados.clientes } } });
  await prisma.usuarios.deleteMany({ where: { id: { in: creados.usuarios } } });
  await prisma.vendedores.deleteMany({ where: { id: { in: creados.vendedores } } });
  await prisma.$disconnect();
});

async function abrirConsultas(page, token) {
  await page.addInitScript((valor) => localStorage.setItem("agencia_token", valor), token);
  await page.goto("/admin");
  await page.locator("aside").getByText("Consultas", { exact: true }).click();
  await page.getByPlaceholder("Buscar…").fill(SELLO);
}

const consulta = (page, sufijo) => page.getByText(nombreDe(sufijo), { exact: true });

test("un asesor ve solo sus consultas y no tiene la sección Clientes", async ({ page }) => {
  await abrirConsultas(page, tokenAsesorA);

  await expect(consulta(page, "consulta de A").first()).toBeVisible();
  await expect(consulta(page, "consulta de B")).toHaveCount(0);
  await expect(consulta(page, "consulta sin asignar")).toHaveCount(0);
  await expect(page.locator("aside").getByText("Clientes", { exact: true })).toHaveCount(0);
});

test("el admin ve las consultas de todos los asesores y las sin asignar", async ({ page }) => {
  await abrirConsultas(page, tokenAdmin);

  await expect(consulta(page, "consulta de A").first()).toBeVisible();
  await expect(consulta(page, "consulta de B").first()).toBeVisible();
  await expect(consulta(page, "consulta sin asignar").first()).toBeVisible();
  await expect(page.locator("aside").getByText("Clientes", { exact: true })).toBeVisible();
});
