import { test, expect } from "@playwright/test";

// cuil-directo: la política de privacidad está en el pie de la web pública. Corre contra el stack local
// (front en 3000, backend en 4000) y solo contra la base local.

const BACKEND = new URL("../../backend/", import.meta.url);
const API = "http://localhost:4000";

async function prismaLocal() {
  process.loadEnvFile(new URL(".env", BACKEND));
  const { esBaseLocal } = await import(new URL("src/lib/base-local.js", BACKEND).href);
  if (!esBaseLocal(process.env.DATABASE_URL)) throw new Error("Esta prueba solo corre contra la base local");
  const { prisma } = await import(new URL("src/lib/prisma.js", BACKEND).href);
  return prisma;
}

// La ficha de un auto que esté a la venta en la base local.
async function rutaDeUnaFicha() {
  const res = await fetch(`${API}/api/vehiculos`);
  const cuerpo = await res.json();
  const autos = Array.isArray(cuerpo) ? cuerpo : cuerpo.data ?? [];
  if (!autos.length) throw new Error("La base local no tiene autos a la venta para abrir una ficha");
  return `/catalogo/${autos[0].ref}`;
}

const linkDelPie = (page) => page.locator("footer").getByRole("link", { name: "Política de privacidad" });

test("el pie de la portada, el catálogo, la ficha de un auto y /privacidad lleva a la política de privacidad", async ({ page }) => {
  for (const ruta of ["/", "/catalogo", await rutaDeUnaFicha(), "/privacidad"]) {
    await page.goto(ruta);
    await expect(linkDelPie(page), ruta).toBeVisible();
    await expect(linkDelPie(page), ruta).toHaveAttribute("href", "/privacidad");
  }
  await page.goto("/");
  await linkDelPie(page).click();
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(page.getByRole("heading", { name: "Cómo usamos tus datos" })).toBeVisible();
});

test("la consulta de cuotas, que pide el DNI, también muestra el link a la política", async ({ page }) => {
  await page.goto("/financiacion");
  const link = page.getByRole("link", { name: "Política de privacidad" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/privacidad");
});

test("sin política publicada, el link sigue en el pie y la página lo dice", async ({ page }) => {
  const prisma = await prismaLocal();
  // Se archivan solo las versiones vigentes, se guardan sus ids y se restauran esas mismas al final.
  const vigentes = await prisma.terminos_versiones.findMany({ where: { deleted_at: null }, select: { id: true } });
  const ids = vigentes.map((v) => v.id);
  try {
    if (ids.length) await prisma.terminos_versiones.updateMany({ where: { id: { in: ids } }, data: { deleted_at: new Date() } });
    await page.goto("/privacidad");
    await expect(page.getByText("La política de privacidad todavía no está publicada.")).toBeVisible();
    await expect(linkDelPie(page)).toHaveAttribute("href", "/privacidad");
  } finally {
    if (ids.length) await prisma.terminos_versiones.updateMany({ where: { id: { in: ids } }, data: { deleted_at: null } });
    await prisma.$disconnect();
  }
});
