// Búsqueda tolerante a tildes y erratas (sin navegador) y el buscador de la cabecera (con navegador).
import { expect, test } from "@playwright/test";
import { buscar, distancia, type EntradaBusqueda } from "../src/lib/busqueda";

const E: EntradaBusqueda[] = [
  { tipo: "parque", t: "Serengeti", s: "Tanzania", href: "/parque/serengeti", w: 1.5 },
  { tipo: "parque", t: "Masái Mara", s: "Kenia", href: "/parque/masai-mara", w: 1.5 },
  { tipo: "parque", t: "Chobe", s: "Botsuana", href: "/parque/chobe", w: 1.5 },
  { tipo: "especie", t: "León", s: "Panthera leo", href: "/especie/panthera-leo", w: 1 },
  { tipo: "especie", t: "Leopardo", s: "Panthera pardus", href: "/especie/panthera-pardus", w: 1 },
  { tipo: "especie", t: "Guepardo", s: "Acinonyx jubatus", href: "/especie/acinonyx-jubatus", w: 1 },
  { tipo: "pais", t: "Botsuana", href: "/safari-en/botsuana", w: 1 },
];
const primero = (q: string) => buscar(E, q)[0]?.href;

test("distancia con transposiciones", () => {
  expect(distancia("serengueti", "serengeti")).toBe(1);
  expect(distancia("gepardo", "guepardo")).toBe(1);
  expect(distancia("laon", "loan")).toBe(1);
});

test("tildes, mayúsculas, erratas, científico y país", () => {
  expect(primero("leon")).toBe("/especie/panthera-leo");
  expect(primero("MASAI")).toBe("/parque/masai-mara");
  expect(primero("serengueti")).toBe("/parque/serengeti");
  expect(primero("gepardo")).toBe("/especie/acinonyx-jubatus");
  expect(primero("acinonyx")).toBe("/especie/acinonyx-jubatus");
  expect(primero("botsuana")).toBe("/safari-en/botsuana");
  expect(primero("seren")).toBe("/parque/serengeti");
  expect(buscar(E, "x")).toEqual([]);
  expect(buscar(E, "zzzzzz")).toEqual([]);
});

test("buscador de la cabecera: autocompleta y lleva a la ficha", async ({ page }) => {
  await page.goto("/guia");
  const caja = page.getByRole("combobox", { name: "Buscar parque, animal o país" });
  await caja.click();
  await caja.fill("serengueti");
  const opcion = page.getByRole("option").filter({ hasText: "Serengeti" }).first();
  await expect(opcion).toBeVisible();
  await caja.press("ArrowDown");
  await caja.press("Enter");
  await expect(page).toHaveURL(/\/parque\/serengeti/);
});

test("página de resultados sin JavaScript", async ({ page }) => {
  await page.goto("/buscar?q=guepardo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("guepardo");
  await expect(page.getByRole("link", { name: "Guepardo" }).first()).toBeVisible();
});
