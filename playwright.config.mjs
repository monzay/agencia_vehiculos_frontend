import { defineConfig } from "@playwright/test";

// Corre contra el stack local ya levantado (front en 3000, backend en 4000) con
// el Edge instalado en la máquina: no hace falta descargar navegadores.
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  reporter: "list",
  timeout: 90_000,
  use: { baseURL: "http://localhost:3000", channel: "msedge" },
});
