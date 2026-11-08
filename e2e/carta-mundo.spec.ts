// La carta de safaris (rediseño B, fase 3): parques del mundo, temporada por mes, ‰ de un mamífero y ficha del
// parque; todo en la URL.
import { expect, test } from "@playwright/test";

async function claveDe(request: import("@playwright/test").APIRequestContext, cientifico: string) {
  const r = await request.get("/mapa/especies.json");
  const { especies } = (await r.json()) as { especies: { k: string; c: string }[] };
  return especies.find((e) => e.c === cientifico)?.k ?? null;
}

test("carta del mundo: parques en temporada en el mes", async ({ page }) => {
  await page.goto("/mapa?mes=agosto");
  await expect(page.locator(".carta-mapa[data-listo=si]")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Safaris en agosto");
  await expect(page.locator(".carta-resumen h2")).toContainText(/En temporada en agosto: [\d.]+ parques/);
  await expect(page.locator("path.parque-fauna").first()).toBeAttached();
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("carta del mundo: el león, su tabla de tramos y la ficha del Serengeti", async ({ page, request }) => {
  const leon = await claveDe(request, "Panthera leo");
  test.skip(!leon, "sin datos del mundo");
  await page.goto("/mapa?mes=agosto");
  await page.getByRole("searchbox", { name: "Mamífero" }).fill("león");
  await page.locator(".carta-opciones button", { hasText: "Panthera leo" }).click();
  await expect(page).toHaveURL(new RegExp(`especie=${leon}`));
  await expect(page.locator(".tabla-tramos caption")).toContainText("entre los 12 mamíferos más registrados");
  await page.goto(`/mapa?mes=agosto&especie=${leon}&parque=serengeti`);
  const ficha = page.locator(".ficha-celda");
  await expect(ficha.getByRole("heading", { level: 2 })).toHaveText("Serengeti");
  await expect(ficha.locator(".ficha-celda-elegida")).toContainText(/León: \d+ ‰/);
  await expect(ficha.getByRole("link", { name: /Ficha completa/ })).toHaveAttribute("href", /\/parque\/serengeti/);
});

test("carta del mundo: la ficha de un parque enlaza al mapa", async ({ page }) => {
  await page.goto("/parque/serengeti");
  await expect(page.getByRole("link", { name: "En el mapa" })).toHaveAttribute("href", "/mapa?parque=serengeti");
});
