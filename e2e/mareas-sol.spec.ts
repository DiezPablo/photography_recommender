// Rumbo del sol y mareas (funciones puras, sin navegador).
import { expect, test } from "@playwright/test";
import { azimutSol, rumbo } from "../src/lib/sol";
import { leerMareas } from "../src/lib/mareas";
import { luna } from "../src/lib/luna";

test("rumbo del sol: en Madrid sale por el ENE en junio y por el ESE en diciembre", () => {
  const junio = azimutSol("2026-06-21", 40.42, -3.7, -0.833, true)!;
  const diciembre = azimutSol("2026-12-21", 40.42, -3.7, -0.833, true)!;
  expect(junio).toBeGreaterThan(55);
  expect(junio).toBeLessThan(65); // ~58°
  expect(diciembre).toBeGreaterThan(115);
  expect(diciembre).toBeLessThan(125); // ~121°
  const puesta = azimutSol("2026-06-21", 40.42, -3.7, -0.833, false)!;
  expect(puesta).toBeCloseTo(360 - junio, -1);
  expect(rumbo(58)).toBe("ENE");
  expect(rumbo(121)).toBe("ESE");
  expect(rumbo(359)).toBe("N");
});

const serie = (amplitud: number) => {
  const time: string[] = [];
  const nivel: number[] = [];
  for (let h = 0; h < 72; h++) {
    const d = new Date(Date.UTC(2026, 10, 6, h));
    time.push(d.toISOString().slice(0, 16));
    // marea semidiurna: periodo de 12,42 h
    nivel.push(amplitud * Math.cos((2 * Math.PI * (h - 3)) / 12.42));
  }
  return { latitude: 43.47, longitude: -3.8, hourly: { time, sea_level_height_msl: nivel } };
};

test("mareas: dos pleamares y dos bajamares, ventana para limícolas", () => {
  const m = leerMareas(serie(1.5), "2026-11-07", 43.47, -3.8)!;
  expect(m.rango).toBeGreaterThan(2.5);
  expect(m.mareas.filter((x) => x.tipo === "alta").length).toBe(2);
  expect(m.mareas.filter((x) => x.tipo === "baja").length).toBe(2);
  expect(m.limicolas.length).toBe(2);
  expect(m.limicolas[0]).toMatch(/^\d{2}:\d{2}–\d{2}:\d{2}$/);
});

test("mareas: Mediterráneo (casi sin marea) y punto de interior", () => {
  const med = leerMareas({ ...serie(0.1), latitude: 41.37, longitude: 2.2 }, "2026-11-07", 41.38, 2.19)!;
  expect(med.limicolas).toEqual([]);
  // la celda de mar queda a más de 15 km: es interior
  expect(leerMareas({ ...serie(1), latitude: 43.47, longitude: -3.8 }, "2026-11-07", 40.42, -3.7)).toBeNull();
});

test("fase de la luna", () => {
  // 3-1-2026 fue luna llena; 18-1-2026, luna nueva
  expect(luna("2026-01-03").nombre).toBe("luna llena");
  expect(luna("2026-01-03").iluminada).toBeGreaterThan(0.95);
  expect(luna("2026-01-18").iluminada).toBeLessThan(0.05);
});
