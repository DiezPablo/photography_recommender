// Catálogo de hides: datos completos, sin nidos, y búsqueda por especie y por zona (sin navegador).
import { expect, test } from "@playwright/test";
import { HIDES, hidesCerca, hidesDe } from "../src/features/espana/hides";

test("cada hide tiene web, zona y punto en España; ids únicos", () => {
  expect(new Set(HIDES.map((h) => h.id)).size).toBe(HIDES.length);
  for (const h of HIDES) {
    expect(h.web).toMatch(/^https:\/\//);
    expect(h.zona.length).toBeGreaterThan(3);
    expect(h.lat).toBeGreaterThan(27);
    expect(h.lat).toBeLessThan(44);
    expect(h.meses.every((m) => m >= 1 && m <= 12)).toBe(true);
    expect(`${h.nombre} ${h.notas ?? ""}`).not.toMatch(/\bnido\b/i);
  }
});

test("por especie y cerca de un punto", () => {
  expect(hidesDe("Gypaetus barbatus").length).toBeGreaterThanOrEqual(2);
  expect(hidesDe("Otis tarda tarda").length).toBeGreaterThanOrEqual(2); // subespecie → especie
  const toledo = hidesCerca(39.96, -4.83, 30);
  expect(toledo.length).toBeGreaterThan(3);
  expect(toledo[0].km).toBeLessThanOrEqual(toledo[toledo.length - 1].km);
});
