import { test, expect } from "@playwright/test";

// Tarjeta "Condiciones de venta" de Configuración, contra el stack local. Guarda el estado que
// había por la API al empezar y lo restaura al terminar, así la base local queda como estaba.
// No crea usuarios: el test del asesor usa uno activo que ya exista (Configuración es solo del admin).

const BACKEND = new URL("../../backend/", import.meta.url);
const API = "http://localhost:4000/api/condiciones-venta";

let prisma;
let tokenAdmin;
let tokenAsesor = null;
let original = null;

const VACIO = {
  trabajaBancos: null, bancos: [], trabajaFinancieras: null, financieras: [], financiaCasa: null,
  tiposCuota: null, garantia: null, garantiaDetalle: null, recibeUsados: null, usadosDetalle: null,
};

test.describe.configure({ mode: "serial" });

// Cada test deja la base en el estado que necesita, sin depender de lo que dejó otro.
const preparar = (cambios = {}) => guardar(tokenAdmin, { ...VACIO, ...cambios });

// Cuenta los PUT a /api/condiciones-venta que sale la página.
function contarPut(page) {
  const puts = [];
  page.on("request", (r) => {
    if (r.method() === "PUT" && r.url().includes("/api/condiciones-venta")) puts.push(r.url());
  });
  return puts;
}

const cabeceras = (token) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

async function leer(token) {
  const respuesta = await fetch(API, { headers: cabeceras(token) });
  expect(respuesta.status).toBe(200);
  return (await respuesta.json()).data;
}

async function guardar(token, estado) {
  const respuesta = await fetch(API, { method: "PUT", headers: cabeceras(token), body: JSON.stringify(estado) });
  expect(respuesta.status).toBe(200);
}

// La tarjeta es una región con nombre; sus selects, campos y botones se buscan por label accesible.
async function abrirConfiguracion(page, token) {
  await page.addInitScript((valor) => localStorage.setItem("agencia_token", valor), token);
  await page.goto("/admin");
  await page.locator("aside").getByText("Configuración", { exact: true }).click();
  const tarjeta = page.getByRole("region", { name: "Condiciones de venta" });
  await expect(tarjeta).toBeVisible();
  return tarjeta;
}

// Playwright exige que el primer argumento sea un patrón de objeto, aunque esté vacío.
// eslint-disable-next-line no-empty-pattern
test.beforeAll(async ({}, testInfo) => {
  const { hostname } = new URL(testInfo.project.use.baseURL ?? "http://sin-baseurl");
  if (!["localhost", "127.0.0.1"].includes(hostname)) {
    throw new Error(`Esta prueba solo corre contra localhost o 127.0.0.1, no contra ${hostname}`);
  }
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
  const asesor = await prisma.usuarios.findFirst({
    where: { rol: "asesor", activo: true, deleted_at: null },
    select: { id: true, rol: true, nombre: true },
  });
  tokenAdmin = firmarToken(admin);
  tokenAsesor = asesor ? firmarToken(asesor) : null;

  original = await leer(tokenAdmin); // lo que había, para devolverlo al final
});

test.afterAll(async () => {
  try {
    if (original) await guardar(tokenAdmin, original);
  } finally {
    await prisma?.$disconnect();
  }
});

test("el admin carga y guarda: bancos, Galicia y Fija y UVA siguen al recargar", async ({ page }) => {
  await preparar();

  const tarjeta = await abrirConfiguracion(page, tokenAdmin);
  const guardarBoton = tarjeta.getByRole("button", { name: "Guardar condiciones" });
  await expect(tarjeta.getByLabel("Tipos de cuota").locator("option")).toHaveText([
    "Sin definir", "Solo fija", "Solo UVA", "Fija y UVA",
  ]);
  await expect(guardarBoton).toBeDisabled(); // sin cambios no se puede guardar

  await tarjeta.getByLabel("¿Trabaja con bancos?").selectOption({ label: "Sí" });
  await tarjeta.getByLabel("Agregar banco").fill("Galicia");
  await tarjeta.getByRole("button", { name: "Agregar banco" }).click();
  await expect(tarjeta.getByText("Galicia", { exact: true })).toBeVisible();
  await tarjeta.getByLabel("Tipos de cuota").selectOption({ label: "Fija y UVA" });

  await expect(guardarBoton).toBeEnabled();
  await guardarBoton.click();
  await expect(page.getByText("Condiciones actualizadas")).toBeVisible();

  await page.reload();
  const recargada = await abrirConfiguracion(page, tokenAdmin);
  await expect(recargada.getByLabel("¿Trabaja con bancos?")).toHaveValue("si");
  await expect(recargada.getByText("Galicia", { exact: true })).toBeVisible();
  await expect(recargada.getByLabel("Tipos de cuota")).toHaveValue("fija_y_uva");
});

test("la tarjeta tiene los tres Sí/No y, con Sí en financieras, la lista con Agregar financiera", async ({ page }) => {
  await preparar();
  const tarjeta = await abrirConfiguracion(page, tokenAdmin);
  for (const etiqueta of ["¿Trabaja con bancos?", "¿Trabaja con financieras?", "¿Financia por la casa?"]) {
    await expect(tarjeta.getByLabel(etiqueta).locator("option")).toHaveText(["Sin definir", "Sí", "No"]);
  }
  await expect(tarjeta.getByLabel("Agregar financiera")).toHaveCount(0);
  await tarjeta.getByLabel("¿Trabaja con financieras?").selectOption({ label: "Sí" });
  await expect(tarjeta.getByLabel("Agregar financiera")).toBeVisible();
  await expect(tarjeta.getByRole("button", { name: "Agregar financiera" })).toBeVisible();
});

test("un banco repetido o un nombre vacío muestran el error y no mandan ningún PUT", async ({ page }) => {
  await preparar({ trabajaBancos: true, bancos: ["Galicia"] });
  const puts = contarPut(page);
  const tarjeta = await abrirConfiguracion(page, tokenAdmin);
  const agregar = tarjeta.getByRole("button", { name: "Agregar banco" });

  await tarjeta.getByLabel("Agregar banco").fill("galicia");
  await agregar.click();
  await expect(tarjeta.getByRole("alert")).toBeVisible();
  await expect(tarjeta.getByText("Galicia", { exact: true })).toHaveCount(1);

  await tarjeta.getByLabel("Agregar banco").fill("   ");
  await agregar.click();
  await expect(tarjeta.getByRole("alert")).toBeVisible();

  expect(puts).toEqual([]);
});

test("detalle con Sí: el campo del detalle de la garantía aparece solo con Sí", async ({ page }) => {
  await preparar();
  const tarjeta = await abrirConfiguracion(page, tokenAdmin);
  const garantia = tarjeta.getByLabel("¿Da garantía propia?");
  const detalle = tarjeta.getByLabel("Detalle de la garantía");

  await garantia.selectOption({ label: "Sí" });
  await expect(detalle).toBeVisible();

  await garantia.selectOption({ label: "No" });
  await expect(detalle).toHaveCount(0);

  await garantia.selectOption({ label: "Sin definir" });
  await expect(detalle).toHaveCount(0);

  const usados = tarjeta.getByLabel("¿Recibe usados como parte de pago?");
  await usados.selectOption({ label: "Sí" });
  await expect(tarjeta.getByLabel("Detalle de los usados")).toBeVisible();
  await usados.selectOption({ label: "No" });
  await expect(tarjeta.getByLabel("Detalle de los usados")).toHaveCount(0);
});

test("un asesor no ve la sección Configuración, así que no ve la tarjeta", async ({ page }) => {
  test.skip(!tokenAsesor, "No hay un usuario asesor activo en la base local (la prueba no crea usuarios)");

  await page.addInitScript((valor) => localStorage.setItem("agencia_token", valor), tokenAsesor);
  await page.goto("/admin");
  await expect(page.locator("aside")).toBeVisible();
  await expect(page.locator("aside").getByText("Configuración", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Condiciones de venta" })).toHaveCount(0);
});
