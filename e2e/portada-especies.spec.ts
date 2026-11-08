// Portada (T35, T36, T26) y /especies (T44).
import { expect, test } from "@playwright/test";

test("buscador: cómo ir en botones, filtro de fotografía y sugerencia si no hay resultados", async ({ page }) => {
  await page.goto("/safaris");
  await expect(page.locator(".rejilla-safaris li").first()).toBeVisible();
  await page.getByRole("button", { name: "Por mi cuenta (turismo)" }).click();
  await expect(page).toHaveURL(/cuenta=turismo/);
  await page.getByRole("button", { name: "Pocos vehículos" }).click();
  await expect(page).toHaveURL(/foto=pocos/);
  // turismo + pocos vehículos + hides: ningún parque a la vez (o pocos); si no hay, se sugiere qué quitar
  await page.getByRole("button", { name: "Hides o barcas" }).click();
  const sugerencia = page.locator(".sin-resultados button").first();
  const hay = await page.locator(".rejilla-safaris li").count();
  if (!hay) {
    await expect(sugerencia).toContainText(/Quitando «.+» hay \d+/);
    await sugerencia.click();
    await expect(page.locator(".rejilla-safaris li").first()).toBeVisible();
  }
});

test("portada: ejemplos para empezar", async ({ page }) => {
  await page.goto("/safaris");
  await expect(page.locator(".ejemplos-hero")).toContainText("Safari sin malaria con niños");
  await page.locator(".ejemplos-hero").getByRole("link", { name: "Safari sin malaria con niños" }).click();
  await expect(page).toHaveURL(/ninos=1/);
});

test("/especies: filtros por grupo, continente y buena época", async ({ page }) => {
  await page.goto("/especies");
  const tarjetas = page.locator(".rejilla-especies > li");
  const total = await tarjetas.count();
  test.skip(!total, "sin datos de especies");
  await page.getByRole("button", { name: /^Felinos/ }).click();
  await expect(tarjetas.first()).toBeVisible();
  expect(await tarjetas.count()).toBeLessThan(total);
  await page.getByRole("button", { name: /^Todas/ }).click();
  await page.getByLabel("Continente").selectOption("Asia");
  await expect(tarjetas.filter({ hasText: "Tigre" }).first()).toBeVisible();
  await page.getByLabel(/En buena época en/).check();
  await expect(page.locator(".filtros-especies-mas")).toContainText(/\d+ especies?/);
});

test("ficha de especie: estado UICN, tamaño y consejos de fotografía", async ({ page }) => {
  await page.goto("/especie/panthera-leo");
  const datos = page.locator(".ficha-especie-datos");
  await expect(datos).toContainText("Vulnerable");
  await expect(datos).toContainText("Cuándo está activa");
  await expect(datos).toContainText("Distancia y focal");
});
