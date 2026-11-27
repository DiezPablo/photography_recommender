// La luna llena sobre un objeto (spec 025): el cálculo (funciones puras) y la página sin JavaScript.
import { expect, test } from "@playwright/test";
import { leerAlinear, leerPunto } from "../src/features/alinear/alinear";
import { alturaAparente, citas, posicion } from "../src/features/alinear/calculo";

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
