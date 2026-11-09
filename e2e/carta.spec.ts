// La carta de España (rediseño B): mapa con la fauna por cuadrícula, mes, día, capas y ficha de cuadrícula; todo en
// la URL.
import { expect, test } from "@playwright/test";

async function claveDe(request: import("@playwright/test").APIRequestContext, cientifico: string) {
  const r = await request.get("/espana/especies.json");
  const { especies } = (await r.json()) as { especies: { k: string; c: string | null }[] };
  return especies.find((e) => e.c === cientifico)?.k ?? null;
}

test("carta: sin especie, el mapa y lo que más sube en el mes", async ({ page }) => {
  await page.goto("/?mes=abril");
  await expect(page.locator(".carta-mapa[data-listo=si]")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("en abril");
  await expect(page.getByRole("button", { name: "abril" })).toHaveAttribute("aria-pressed", "true");
  const sube = page.locator(".lista-sube li");
  if ((await sube.count()) === 0) return; // sin datos de España
  await expect(page.locator(".carta-resumen")).toContainText("Lo que más sube en abril");
  // en abril llegan las estivales: el cuco está entre las que más suben (GBIF)
  await expect(page.locator(".lista-sube")).toContainText("Cuco");
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("carta: buscar una especie, cambiar de mes y apagar una capa queda en la URL", async ({ page, request }) => {
  const grulla = await claveDe(request, "Grus grus");
  test.skip(!grulla, "sin datos de España");
  await page.goto("/?mes=noviembre");
  await page.getByRole("combobox", { name: "Especie" }).fill("grulla com");
  await page
    .getByRole("option", { name: /Grulla común/ })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`especie=${grulla}`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Grulla común en noviembre");
  await expect(page.locator(".tabla-tramos caption")).toContainText("cuadrículas con registros en noviembre");
  // las barras de los meses son su curva: noviembre más alto que junio
  const alto = async (m: string) =>
    page
      .getByRole("button", { name: m })
      .locator(".barra-mes")
      .evaluate((e) => e.getBoundingClientRect().height);
  expect(await alto("noviembre")).toBeGreaterThan(await alto("junio"));
  await expect(page.locator("path.celda-fauna").first()).toBeAttached();
  await page.getByRole("button", { name: "junio" }).click();
  await expect(page).toHaveURL(/mes=junio/);
  await page.getByLabel("Sol del día").uncheck();
  await expect(page).toHaveURL(/sin=luz/);
});

test("carta: ficha de la cuadrícula de Gallocanta con grupos, luz y cómo llegar", async ({ page, request }) => {
  const grulla = await claveDe(request, "Grus grus");
  test.skip(!grulla, "sin datos de España");
  await page.goto(`/?especie=${grulla}&mes=noviembre&fecha=2026-11-14&celda=10kmE335N206`);
  const ficha = page.locator(".ficha-celda");
  await expect(ficha.getByRole("heading", { level: 2 })).toContainText("Gallocanta");
  await expect(ficha.locator(".ficha-celda-elegida")).toContainText(/Grulla común en noviembre: \d+ ‰/);
  await expect(ficha.locator(".tabla-celda caption").first()).toContainText("Aves");
  await expect(ficha.locator(".franja-datos")).toContainText("Sale el sol");
  await expect(ficha.getByRole("link", { name: /Cómo llegar/ })).toHaveAttribute(
    "href",
    /openstreetmap\.org\/directions/,
  );
  await expect(page.locator("path.celda-elegida")).toBeAttached();
  await ficha.getByRole("button", { name: "Cerrar la ficha de la cuadrícula" }).click();
  await expect(page).not.toHaveURL(/celda=/);
});

test("carta: el explorador antiguo lleva a la carta con la especie y el mes", async ({ page }) => {
  await page.goto("/espana/mapa?k=2474950&mes=10");
  await expect(page).toHaveURL(/\/\?especie=2474950&mes=noviembre/);
});

test("carta: los enlaces antiguos con lat y lon siguen abriendo «Cerca de mí»", async ({ page }) => {
  await page.goto("/espana?lat=40.420&lon=-3.700&radio=10&fecha=2026-11-08");
  await expect(page.locator(".carta")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cerca de mí");
});

test("portada: la carta de España; /espana y los enlaces antiguos de safaris redirigen", async ({ page }) => {
  await page.goto("/espana?mes=marzo");
  await expect(page).toHaveURL(/\/\?mes=marzo$/);
  await expect(page.locator(".carta")).toBeVisible();
  await page.goto("/?ver=5219404&mes=7");
  await expect(page).toHaveURL(/\/safaris\?ver=5219404&mes=7/);
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Sección de la web" }).getByRole("link", { name: "España" }),
  ).toHaveAttribute("aria-current", "page");
});
