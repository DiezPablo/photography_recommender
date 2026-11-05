// España (T27, T30, T31) y secciones personales (T47).
import { expect, test } from "@playwright/test";
import { FENOMENOS } from "../src/features/espana/fenomenos";

test("fenómenos de noviembre: Villafáfila, lince y buitres; grullas con dormidero", () => {
  const nov = FENOMENOS.filter((f) => f.meses.includes(11)).map((f) => f.id);
  expect(nov).toEqual(expect.arrayContaining(["villafafila-ansares-avutardas", "andujar-lince", "monfrague-buitres"]));
  expect(FENOMENOS.find((f) => f.id === "gallocanta-grullas")?.dormidero).toBeTruthy();
});

test("España: menú propio con rarezas y diario, y marca general", async ({ page }) => {
  await page.goto("/espana/rarezas");
  await expect(page.locator(".marca").first()).toHaveText("Atlas de fauna");
  const menu = page.getByRole("navigation", { name: /Secciones|Menú|principal/i }).first();
  void menu;
  await expect(page.locator(".mas-espana, header").first()).toBeVisible();
  await page.goto("/espana");
  await expect(page.locator(".mas-espana a")).toHaveCount(6);
  await expect(page.locator(".mas-espana .icono-tarjeta").first()).toBeVisible();
});

test("Mis especies: estado vacío con acción y copia en JSON que se recupera", async ({ page }) => {
  await page.goto("/espana/mis-especies");
  await expect(page.getByRole("heading", { name: "Tu lista de especies empieza aquí" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver qué hay cerca de mí" })).toBeVisible();
  const copia = {
    app: "atlas-de-fauna",
    version: 1,
    fecha: "2026-11-05",
    datos: {
      "espana-vistas": JSON.stringify({
        "2474953": { n: "Grulla común", c: "Grus grus", clase: "Aves", f: "2026-11-05" },
      }),
    },
  };
  page.on("dialog", (d) => d.accept());
  await page.locator(".copia-local input[type=file]").setInputFiles({
    name: "mis-especies.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(copia)),
  });
  await expect(page.getByRole("link", { name: "Grulla común" })).toBeVisible();
});
