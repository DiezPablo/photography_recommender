// La luna llena sobre un objeto (spec 025): el cálculo (funciones puras) y la página sin JavaScript.
import { expect, test } from "@playwright/test";
import { leerAlinear, leerPunto } from "../src/features/alinear/alinear";
import { alturaAparente, citas, posicion } from "../src/features/alinear/calculo";
import { posicionNucleo, ventanasVia } from "../src/features/alinear/via";
import { Body, Illumination } from "astronomy-engine";

const TORRES = { lat: 40.4773, lon: -3.6874 };

test("la posición de la luna coincide con astropy", () => {
  // astropy 8.0, desde las Cuatro Torres, 940 hPa y 5 °C (cálculo del 27-11-2026)
  const astropy: [string, number, number][] = [
    ["2026-12-24T17:43:00Z", 58.517, 2.942],
    ["2027-02-20T17:51:00Z", 77.545, 1.896],
    ["2027-03-22T05:46:00Z", 264.789, 1.536],
  ];
  for (const [t, az, alt] of astropy) {
    const p = posicion("luna", TORRES.lat, TORRES.lon, new Date(t));
    expect(Math.abs(p.az - az)).toBeLessThan(0.02);
    expect(Math.abs(p.alt - alt)).toBeLessThan(0.2);
  }
});

test("la luna sobre las Cuatro Torres en Nochebuena, desde el oeste-suroeste a 8 km", () => {
  // a mano (astropy + relieve): desde el cerro de las Covatillas (8 km, 96 m más bajo), 24-12-2026 a las 18:43
  const r = citas({ ...TORRES, altura: 249, desnivel: 96 }, new Date("2026-12-01T00:00:00Z"), 40);
  const sale = r.find((c) => c.momento === "sale" && c.instante.toISOString().startsWith("2026-12-24"));
  expect(sale).toBeTruthy();
  const f = sale!.filas.find((x) => x.km === 8)!;
  const minutos = (f.instante.getTime() - Date.parse("2026-12-24T17:43:00Z")) / 60000;
  expect(Math.abs(minutos)).toBeLessThanOrEqual(3);
  expect(Math.abs(((f.rumbo + 180) % 360) - 238.5)).toBeLessThan(1); // el punto queda al oeste-suroeste
  expect(f.sol).toBeLessThan(-6);
  // y todas las citas son de luna casi llena con el sol cerca del horizonte
  for (const c of r) {
    expect(c.iluminacion).toBeGreaterThanOrEqual(0.85);
    for (const x of c.filas) expect(x.sol).toBeGreaterThanOrEqual(-12);
  }
});

test("altura aparente con curvatura y coordenadas pegadas de un mapa", () => {
  expect(alturaAparente(345, 8000)).toBeCloseTo(2.44, 2);
  expect(leerPunto("40.4773, -3.6874")).toEqual({ lat: 40.4773, lon: -3.6874 });
  expect(leerPunto("40,4773; -3,6874")).toEqual({ lat: 40.4773, lon: -3.6874 });
  expect(leerPunto("Madrid")).toBeNull();
  expect(leerAlinear({ punto: "48.85, 2.29", altura: "300" }).error).toMatch(/España/);
  expect(leerAlinear({ punto: "40.4, -3.7", altura: "2" }).error).toMatch(/altura/);
  expect(leerAlinear({}).error).toBeNull();
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("el formulario lista las fechas y avisa de lo que no entiende", async ({ page }) => {
    await page.goto("/luz/alinear");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("La luna sobre un objeto");
    await page.getByLabel("Qué (opcional)").fill("las Cuatro Torres");
    await page.getByLabel("Dónde está (latitud, longitud)").fill("40.4773, -3.6874");
    await page.getByLabel("Altura del objeto (m)").fill("249");
    await page.getByLabel("Su base, más alta que tú (m)").fill("96");
    await page.getByLabel("Desde").fill("2026-12-01");
    await page.getByRole("button", { name: "Buscar fechas" }).click();
    await expect(page).toHaveURL(/\/luz\/alinear\?.*punto=40\.4773/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("La luna sobre las Cuatro Torres");
    const nochebuena = page.getByRole("article").filter({ hasText: /24 de diciembre de 2026.*la luna sale/ });
    await expect(nochebuena).toBeVisible();
    await expect(nochebuena.getByText(/A 8 km, al suroeste del objeto/)).toBeVisible();

    await page.goto("/luz/alinear?punto=48.85,2.29&altura=300");
    await expect(page.getByRole("alert")).toHaveText("Ese punto no está en España.");
  });
});

// ---- El núcleo de la Vía Láctea sobre un objeto (spec 026) ----

test("la posición del núcleo coincide con astropy", () => {
  // astropy 8.0, Sagitario A* desde las Cuatro Torres, 1010 hPa y 10 °C (cálculo del 28-11-2026)
  const astropy: [string, number, number][] = [
    ["2027-06-10T23:00:00Z", 156.034, 16.344],
    ["2027-04-05T03:00:00Z", 151.13, 14.366],
  ];
  for (const [t, az, alt] of astropy) {
    const p = posicionNucleo(TORRES.lat, TORRES.lon, new Date(t));
    expect(Math.abs(p.az - az)).toBeLessThan(0.02);
    expect(Math.abs(p.alt - alt)).toBeLessThan(0.02);
  }
});

test("las noches del núcleo: rumbo, oscuridad y luna, y la temporada en Madrid", () => {
  const { direcciones, ventanas } = ventanasVia(
    { ...TORRES, altura: 249, desnivel: 0 },
    new Date("2026-11-28T00:00:00Z"),
    "Europe/Madrid",
  );
  const sur = direcciones.find((d) => d.rumbo === 180)!;
  expect(sur.altura).toBeGreaterThan(19.5);
  expect(sur.altura).toBeLessThan(21);
  expect(sur.destacada).toBe(true);
  // a la distancia propuesta, lo alto del objeto queda al menos 5° por debajo del núcleo
  expect(alturaAparente(249, sur.dPropuesta)).toBeLessThanOrEqual(sur.altura - 5);
  const meses = new Set(ventanas.map((v) => Number(v.inicio.slice(5, 7))));
  for (const m of meses) expect(m >= 2 && m <= 10).toBe(true);
  expect(ventanas.length).toBeGreaterThanOrEqual(6);
  for (const v of ventanas)
    for (const x of v.tramos)
      for (const t of [x.primera, x.ultima]) {
        const p = posicionNucleo(TORRES.lat, TORRES.lon, t);
        expect(Math.abs(p.az - x.direccion.rumbo)).toBeLessThan(0.2);
        expect(posicion("sol", TORRES.lat, TORRES.lon, t).alt).toBeLessThanOrEqual(-18);
        const luna = posicion("luna", TORRES.lat, TORRES.lon, t).alt;
        expect(luna <= 0 || Illumination(Body.Moon, t).phase_fraction <= 0.15).toBe(true);
      }
});

test.describe("sin JavaScript, la Vía Láctea", () => {
  test.use({ javaScriptEnabled: false });

  test("el ejemplo del faro enseña dónde ponerse y las noches", async ({ page }) => {
    await page.goto("/luz/alinear");
    await page.getByRole("link", { name: /faro de Fuencaliente/ }).click();
    await expect(page).toHaveURL(/astro=via/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("La Vía Láctea sobre el faro de Fuencaliente");
    await expect(page.getByLabel("Sobre el objeto")).toHaveValue("via");
    await expect(page.getByRole("heading", { name: "Dónde ponerte" })).toBeVisible();
    await expect(page.getByText(/Mirando al sur:/).first()).toBeVisible();
    await expect(page.getByText(/Bortle 2/)).toBeVisible();
  });

  test("en ciudad avisa de que el núcleo apenas se verá", async ({ page }) => {
    await page.goto("/luz/alinear?astro=via&punto=40.4773,-3.6874&altura=249");
    await expect(page.getByRole("note")).toContainText("apenas se verá");
  });
});
