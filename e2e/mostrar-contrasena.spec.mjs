import { test, expect } from "@playwright/test";

// Ver y ocultar la contraseña, contra el stack local. No envía formularios ni guarda nada.

const BACKEND = new URL("../../backend/", import.meta.url);
const CONTRASENA = "Clave-de-prueba-123";

async function verificarOjo(entrada, page) {
  await entrada.fill(CONTRASENA);
  await expect(entrada).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(entrada).toHaveAttribute("type", "text");
  await expect(entrada).toHaveValue(CONTRASENA);

  await page.getByRole("button", { name: "Ocultar contraseña" }).click();
  await expect(entrada).toHaveAttribute("type", "password");
  await expect(entrada).toHaveValue(CONTRASENA);
}

test("en el login se puede ver y ocultar la contraseña sin perder lo escrito", async ({ page }) => {
  await page.goto("/login");
  await verificarOjo(page.getByPlaceholder("••••••••"), page);
});

test("al crear un asesor se puede ver y ocultar la contraseña", async ({ page }) => {
  process.loadEnvFile(new URL(".env", BACKEND));
  if (new URL(process.env.DATABASE_URL).hostname !== "localhost") {
    throw new Error("Esta prueba solo corre contra la base local");
  }
  const { prisma } = await import(new URL("src/lib/prisma.js", BACKEND).href);
  const { firmarToken } = await import(new URL("src/lib/auth.js", BACKEND).href);
  const admin = await prisma.usuarios.findFirst({
    where: { rol: "admin", activo: true, deleted_at: null },
    select: { id: true, rol: true, nombre: true },
  });
  await prisma.$disconnect();

  await page.addInitScript((valor) => localStorage.setItem("agencia_token", valor), firmarToken(admin));
  await page.goto("/admin");
  await page.locator("aside").getByText("Asesores", { exact: true }).click();
  await page.getByRole("button", { name: /Nuevo asesor/ }).click();

  await verificarOjo(page.getByPlaceholder("Mínimo 6 caracteres"), page);
});
