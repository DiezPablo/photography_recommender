// Algoritmos de recomendación (análisis del 09-11-2026), funciones puras sin navegador.
import { expect, test } from "@playwright/test";
import { puntuacionAhora, type Parque, type Recientes } from "../src/features/safaris/modelo";

const parque = (id: string): Parque => ({ id, meses: [8], conteo_estrella: {}, observaciones: 0 }) as unknown as Parque;

test("«Mejor ahora»: la tasa de especies estrella, no el número bruto de fotos", () => {
  const recientes: Recientes = {
    fecha: "2026-11-09",
    desde: "2026-10-10",
    parques: {
      // muy visitado: muchas vistas, pero sobre muchísimas observaciones
      visitado: { estrella: { "1": 90 }, mamiferos: [], observaciones: 600 },
      // menos visitado, con más especies estrella por observación
      bueno: { estrella: { "1": 40 }, mamiferos: [], observaciones: 80 },
    },
  };
  const agosto = 7;
  expect(puntuacionAhora(parque("bueno"), agosto, recientes)).toBeGreaterThan(
    puntuacionAhora(parque("visitado"), agosto, recientes),
  );
  // la temporada manda: fuera de ella, por debajo de cualquiera en temporada
  expect(puntuacionAhora(parque("bueno"), 0, recientes)).toBeLessThan(
    puntuacionAhora(parque("visitado"), agosto, recientes),
  );
});
