// La cuadrícula EEA del navegador da lo mismo que pyproj (y que rasante/fauna/rejilla.py); sin página.
import { expect, test } from "@playwright/test";
import { bloque, celda, celdasEnRadio, centroCelda, laea, laeaInversa } from "../src/lib/rejilla";

test("cuadrícula EEA como pyproj", () => {
  const [e, n] = laea(40.4168, -3.7038);
  expect(Math.abs(e - 3159390.36)).toBeLessThan(1);
  expect(Math.abs(n - 2029850.92)).toBeLessThan(1);
  expect(celda(43.2, -4.85)).toBe("10kmE311N235");
  expect(celda(28.27, -16.64)).toBe("10kmE170N103");
  expect(bloque("10kmE315N202")).toBe("100kmE31N20");
  expect(celdasEnRadio(40.4168, -3.7038, 0)).toEqual(["10kmE315N202"]);
  expect(celdasEnRadio(40.4168, -3.7038, 15)).toHaveLength(16);
});

test("inversa: ida y vuelta y centro de celda", () => {
  for (const [lat, lon] of [
    [40.4168, -3.7038],
    [28.27, -16.64],
    [43.2, -4.85],
  ]) {
    const [la, lo] = laeaInversa(...laea(lat, lon));
    expect(Math.abs(la - lat)).toBeLessThan(1e-6);
    expect(Math.abs(lo - lon)).toBeLessThan(1e-6);
  }
  const [la, lo] = centroCelda("10kmE315N202");
  expect(celda(la, lo)).toBe("10kmE315N202");
});
