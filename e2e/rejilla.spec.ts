// La cuadrícula EEA del navegador da lo mismo que pyproj (y que safari/espana/rejilla.py); sin página.
import { expect, test } from "@playwright/test";
import { bloque, celda, celdasEnRadio, laea } from "../src/lib/rejilla";

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
