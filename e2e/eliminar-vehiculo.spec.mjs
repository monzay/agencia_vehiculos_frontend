import { test, expect } from "@playwright/test";

// Eliminar un vehículo desde el panel, contra el stack local. Crea sus propios autos y al
// terminar borra físicamente solo los ids que creó.

const BACKEND = new URL("../../backend/", import.meta.url);
const API = "http://localhost:4000/api";
const SELLO = String(Date.now()).slice(-7);
const MARCA = `E2E-ELIM-${SELLO}`;

let prisma;
let tokenAdmin;
let tokenAsesor;
let autoAEliminar;
let autoACancelar;
let asesorTemporalId = null;

test.describe.configure({ mode: "serial" });

const crearAuto = (sufijo) =>
  prisma.autos.create({
    data: {
      ref: `E2E${SELLO}${sufijo}`,
      marca: MARCA,
      modelo: `Modelo ${sufijo}`,
      anio: 2018,
      tipo: "usado",
      precio: 1000000,
      disponible: true,
    },
  });

async function obtenerAsesor() {
  const existente = await prisma.usuarios.findFirst({
    where: { rol: "asesor", activo: true, deleted_at: null },
    select: { id: true, rol: true, nombre: true },
  });
  if (existente) return existente;
  const creado = await prisma.usuarios.create({
    data: { nombre: `E2E asesor ${SELLO}`, email: `e2e-elim-${SELLO}@example.com`, password_hash: "x", rol: "asesor" },
    select: { id: true, rol: true, nombre: true },
  });
  asesorTemporalId = creado.id;
  return creado;
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
  tokenAsesor = firmarToken(await obtenerAsesor());
  autoAEliminar = await crearAuto("a");
  autoACancelar = await crearAuto("b");
});

test.afterAll(async () => {
  if (!prisma) return;
  const ids = [autoAEliminar?.id, autoACancelar?.id].filter(Boolean);
  await prisma.autos.deleteMany({ where: { id: { in: ids } } });
  if (asesorTemporalId) await prisma.usuarios.delete({ where: { id: asesorTemporalId } });
  await prisma.$disconnect();
});

async function abrirVehiculos(page, token) {
  await page.addInitScript((valor) => localStorage.setItem("agencia_token", valor), token);
  await page.goto("/admin");
  await page.locator("aside").getByText("Vehículos", { exact: true }).click();
  await expect(page.getByRole("row", { name: new RegExp(MARCA) }).first()).toBeVisible();
}

const fila = (page, auto) => page.getByRole("row", { name: new RegExp(`${MARCA} ${auto.modelo}`) });

test("el admin elimina un vehículo después de confirmar y desaparece del panel y del catálogo", async ({ page, request }) => {
  await abrirVehiculos(page, tokenAdmin);
  await fila(page, autoAEliminar).getByTitle("Eliminar").click();
  await expect(page.getByText("¿Eliminar este vehículo?")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();

  await expect(fila(page, autoAEliminar)).toHaveCount(0);
  const catalogo = await request.get(`${API}/vehiculos/${autoAEliminar.ref}`);
  expect(catalogo.status()).toBe(404);
  const guardado = await prisma.autos.findUnique({ where: { id: autoAEliminar.id } });
  expect(guardado.deleted_at).not.toBeNull();
  expect(guardado.disponible).toBe(false);
});

test("cancelar la confirmación no elimina el vehículo", async ({ page }) => {
  await abrirVehiculos(page, tokenAdmin);
  await fila(page, autoACancelar).getByTitle("Eliminar").click();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await expect(page.getByText("¿Eliminar este vehículo?")).toHaveCount(0);
  await expect(fila(page, autoACancelar)).toBeVisible();
  const guardado = await prisma.autos.findUnique({ where: { id: autoACancelar.id } });
  expect(guardado.deleted_at).toBeNull();
});

test("un asesor no ve el botón de eliminar", async ({ page }) => {
  await abrirVehiculos(page, tokenAsesor);
  await expect(fila(page, autoACancelar)).toBeVisible();
  await expect(page.getByTitle("Eliminar")).toHaveCount(0);
});
