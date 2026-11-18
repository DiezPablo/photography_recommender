import { networkInterfaces } from "node:os";
import { defineConfig, devices } from "@playwright/test";

// Sin BASE_URL se prueba la build local (npm run build && npm start).
// Con BASE_URL=https://photo-recommender.vercel.app se prueba producción.
//
// Si la salida a internet va por un proxy (HTTPS_PROXY, como en el contenedor de desarrollo), Chromium
// tiene que usarlo para cargar teselas y fotos; Playwright manda también localhost por el proxy, así que
// en ese caso el servidor local se sirve en la IP de la máquina y esa IP se excluye del proxy.
const proxy = process.env.HTTPS_PROXY;
const ipLocal =
  Object.values(networkInterfaces())
    .flat()
    .find((i) => i && i.family === "IPv4" && !i.internal)?.address ?? "127.0.0.1";
const host = proxy ? ipLocal : "localhost";
const base = process.env.BASE_URL ?? `http://${host}:3100`;

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.BASE_URL ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: base,
    trace: "off",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    ...(proxy ? { proxy: { server: proxy, bypass: ipLocal } } : {}),
  },
  projects: [
    { name: "movil", use: { ...devices["Pixel 7"] } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 860 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // keep-alive de 60 s (Next deja el de Node, 5 s): el cliente de Playwright reutiliza conexiones que el
        // servidor acaba de cerrar y la petición se corta con ECONNRESET (spec 024, punto 3). Solo en local.
        command: "npx next start -H 0.0.0.0 -p 3100 --keepAliveTimeout 60000",
        url: base,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
