import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";

// Importar la lista de vehículos de punta a punta, contra el stack local.
//
// La subida a Blob y la lectura con IA se simulan en el navegador: cuestan plata,
// necesitan credenciales y no son lo que se prueba acá. Lo demás es real: la
// importación en el backend, la base local, publicar desde el formulario y el
// freno de la segunda lectura. Al terminar borra solo lo que creó.

const BACKEND = new URL("../../backend/", import.meta.url);
const API = "http://localhost:4000/api";
const SELLO = String(Date.now()).slice(-7);
const MARCA = `E2E-LISTA-${SELLO}`;
const HUELLA = randomBytes(32).toString("hex");
const PATHNAME = `listas/${HUELLA}.jpg`;

const FILAS = [
  {
    marca: MARCA, modelo: "Prueba", version: "1.6 E2E", anio: 2015, kms: 85000, condicion: "usado",
    tipoVehiculo: "auto", combustible: "nafta", precio: 9000000, precio_contado: null, anticipo: null,
    dudosos: ["kms"], estado: "nuevo", coincide: null,
  },
  {
    marca: "Fiat", modelo: "Uno", version: "Fire", anio: 2010, kms: 150000, condicion: "usado",
    tipoVehiculo: "auto", combustible: null, precio: null, precio_contado: null, anticipo: null,
    dudosos: [], estado: "ya_cargado",
    coincide: { ref: "1", marca: "Fiat", modelo: "Uno Fire", version: null, anio: 2010, kms: 150000 },
  },
];

let prisma;
let token;

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
  await page.route("**/api/blob/upload", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ pathname: PATHNAME }) })
  );
});

test.afterAll(async () => {
  if (!prisma) return;
  const archivo = await prisma.importaciones_vehiculos_archivos.findUnique({ where: { huella: HUELLA } });
  await prisma.autos.deleteMany({ where: { marca: MARCA } });
  if (archivo) await prisma.importaciones_vehiculos.delete({ where: { id: archivo.importacion_id } });
  await prisma.$disconnect();
});

async function abrirImportacion(page) {
  await page.goto("/admin");
  await page.locator("aside").getByText("Vehículos", { exact: true }).click();
  await page.getByRole("button", { name: "Importar lista" }).click();
  await page.getByLabel("Archivo de la lista").setInputFiles({ name: "lista.jpg", mimeType: "image/jpeg", buffer: Buffer.from("lista") });
  await expect(page.getByText("lista.jpg")).toBeVisible();
}

test("importar una lista crea los autos nuevos sin publicar", async ({ page }, testInfo) => {
  await page.route("**/api/vehiculos/importar/leer", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { filas: FILAS } }) })
  );
  await abrirImportacion(page);
  await page.getByRole("button", { name: "Leer lista" }).click();

  await expect(page.getByLabel("Crear fila 1")).toBeChecked();
  await expect(page.getByLabel("Crear fila 2")).toBeDisabled();
  await expect(page.getByLabel("Kms, fila 1")).toHaveValue("85.000");
  await page.screenshot({ path: testInfo.outputPath("propuesta.png"), fullPage: true });

  await page.getByRole("button", { name: "Crear 1 vehículo" }).click();
  await expect(page.getByText("Se creó 1 vehículo.")).toBeVisible();

  const autos = await prisma.autos.findMany({ where: { marca: MARCA } });
  expect(autos).toHaveLength(1);
  expect(autos[0].disponible).toBe(false);
  expect(autos[0].version).toBe("1.6 E2E");
  expect(autos[0].kms).toBe(85000);
  expect(autos[0].importacion_id).not.toBeNull();

  await page.getByRole("button", { name: "Listo" }).click();
  await expect(page.getByRole("row", { name: new RegExp(MARCA) })).toContainText("sin publicar");
});

test("la misma lista no se puede importar dos veces", async ({ page, request }) => {
  // Sin simular la lectura: el backend real tiene que frenarla antes de llamar a la IA.
  await abrirImportacion(page);
  await page.getByRole("button", { name: "Leer lista" }).click();
  await expect(page.getByText(/Esta lista ya se importó el .* y se crearon 1 vehículo/)).toBeVisible();

  const otraVez = await request.post(`${API}/vehiculos/importar`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { archivos: [PATHNAME], vehiculos: [FILAS[0]] },
  });
  expect(otraVez.status()).toBe(409);
  expect(await prisma.autos.count({ where: { marca: MARCA } })).toBe(1);
});

test("publicar un auto importado lo muestra en la web", async ({ page }) => {
  await page.goto("/admin");
  await page.locator("aside").getByText("Vehículos", { exact: true }).click();
  await page.getByRole("row", { name: new RegExp(MARCA) }).getByTitle("Editar").click();
  await expect(page.getByLabel("Versión")).toHaveValue("1.6 E2E");
  await expect(page.getByLabel("Publicado en la web")).not.toBeChecked();

  await page.getByLabel("Publicado en la web").check();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { name: "Editar vehículo" })).toHaveCount(0);

  const auto = await prisma.autos.findFirst({ where: { marca: MARCA } });
  expect(auto.disponible).toBe(true);
  await page.goto(`/catalogo/${auto.ref}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(MARCA);
});
