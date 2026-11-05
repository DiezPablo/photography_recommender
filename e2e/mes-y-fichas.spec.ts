// El mes elegido en toda la web (T32), el veredicto y las capas de la ficha (T37), alojamientos por zona (T38),
// parques de una especie (T43) y las entradas de la portada (T33, T34).
import { expect, test } from "@playwright/test";
import { veredictos } from "../src/features/safaris/veredicto";
import { zonasRecomendadas } from "../src/features/safaris/zonasParque";
import { grupoFauna } from "../src/features/safaris/gruposFauna";
import { mesDeParametro } from "../src/lib/fechas";

test("funciones puras: mes de la URL, zonas, grupos y veredicto", () => {
  expect(mesDeParametro("marzo")).toBe(2);
  expect(mesDeParametro("Marzo")).toBe(2);
  expect(mesDeParametro("7")).toBe(7);
  expect(mesDeParametro("13")).toBeNull();
  expect(mesDeParametro("x")).toBeNull();
  const z = zonasRecomendadas("serengeti");
  expect(z[1]).toMatch(/^Sur/); // febrero: partos en Ndutu
  expect(z[7]).toMatch(/^Norte/); // agosto: cruces del Mara
  expect(zonasRecomendadas("kruger").every((x) => x === null)).toBe(true);
  expect(grupoFauna("Panthera leo")).toBe("Felinos");
  expect(grupoFauna("Gorilla beringei")).toBe("Primates");
  expect(grupoFauna("Desconocidus raro", "Aves")).toBe("Aves");
  const p = {
    id: "serengeti",
    meses: [1, 2, 6, 7, 8, 9, 10],
    clima: { lluvia_mm: [80, 70, 120, 180, 90, 20, 10, 15, 25, 40, 110, 100], tmax: [] },
  } as never;
  const v = veredictos(p, [{ nombre: "León", meses: Array(12).fill(60) }]);
  expect(v[7].nota).toBe("excelente");
  expect(v[7].detalles.join(" ")).toContain("Muy probable: león");
  expect(v[7].detalles.join(" ")).toContain("Migración");
  expect(v[3].nota).toBe("regular");
  expect(v[3].detalles.join(" ")).toContain("Fuera de la mejor época");
});

test("el mes elegido se conserva al ir a una ficha y cambia su veredicto", async ({ page }) => {
  await page.goto("/");
  const selector = page.getByRole("combobox", { name: "Mes del viaje" }).or(page.getByLabel("Mes del viaje")).first();
  await page.locator(".selector-mes select").selectOption("7");
  await expect(page).toHaveURL(/mes=agosto/);
  await page.goto("/parque/serengeti");
  await expect(page).toHaveURL(/mes=agosto/);
  await expect(page.locator(".selector-mes select")).toHaveValue("7");
  const veredicto = page.locator(".veredicto-mes");
  await expect(veredicto.locator("select")).toHaveValue("7");
  await expect(veredicto).toContainText("Migración");
  // el calendario resalta agosto
  await expect(page.locator("html")).toHaveAttribute("data-mes", "8");
  // cambiarlo en la ficha lo cambia en toda la web
  await veredicto.getByRole("button", { name: "feb" }).click();
  await expect(page).toHaveURL(/mes=febrero/);
  await expect(page.locator(".selector-mes select")).toHaveValue("1");
  void selector;
});

test("ficha del Serengeti: capas, alojamientos por zona con la recomendada del mes", async ({ page }) => {
  await page.goto("/parque/serengeti?mes=febrero");
  const titulos = await page.locator(".titulo-capa").allTextContents();
  expect(titulos).toEqual(["Qué se ve", "Fotografía", "Organizar el viaje"]);
  const dormir = page.locator("#dormir");
  test.skip(!(await dormir.count()), "sin alojamientos en los datos");
  await expect(dormir.locator(".zona-recomendada")).toContainText("Sur");
  await expect(dormir.locator("details.recomendada")).toHaveAttribute("open", "");
});

test("ficha de especie: parques con barra de meses y orden por buena época", async ({ page }) => {
  await page.goto("/especie/panthera-leo?mes=agosto");
  const filas = page.locator(".parques-especie > li");
  await expect(filas.first()).toBeVisible();
  await expect(filas.first().locator(".meses-parque span")).toHaveCount(12);
  await page.getByRole("button", { name: "Buena época en agosto" }).click();
  await expect(filas.first().locator(".en-epoca")).toBeVisible();
});

test("portada: «Tengo un animal» con buscador y grupos lleva a «¿Qué quieres ver?»", async ({ page }) => {
  await page.goto("/");
  const animal = page.getByRole("combobox", { name: "Tengo un animal" });
  await animal.click();
  await expect(page.getByRole("group", { name: "Felinos" }).first()).toBeVisible();
  await animal.fill("gepardo");
  await page
    .getByRole("option", { name: /Guepardo/ })
    .first()
    .click();
  await expect(page).toHaveURL(/ver=\d+/);
});

test("ficha del Masái Mara: bloque de fotografía con el amanecer del mes elegido", async ({ page }) => {
  await page.goto("/parque/masai-mara?mes=agosto");
  const foto = page.locator("#fotografia");
  await expect(foto).toContainText("Solo en las concesiones privadas");
  await expect(foto).toContainText(/A mediados de agosto, el sol sale hacia las 0?6:\d\d/);
  await expect(page.locator(".indice-ficha a", { hasText: "Fotografía" })).toBeVisible();
  // en un parque sin datos no sale
  await page.goto("/parque/kakadu");
  await expect(page.locator("#fotografia")).toHaveCount(0);
});

test("ficha: botón «Añadir a mi viaje», recuentos de una sola fuente y momentos del año", async ({ page }) => {
  await page.goto("/parque/serengeti");
  await expect(page.locator(".frescura-corta")).toContainText("Actualizado el");
  await expect(page.locator(".ano-safari").first()).toContainText("Momentos");
  await page.getByRole("button", { name: /Añadir a mi viaje/ }).click();
  await expect(page.getByRole("link", { name: /En mi viaje/ })).toBeVisible();
  const v = await page.evaluate(() => JSON.parse(localStorage.getItem("safaris.viaje")!));
  expect(v.etapas[0].id).toBe("serengeti");
});
