// Puntuación con desglose (sin página).
import { expect, test } from "@playwright/test";
import { factorDeteccion, factorFrecuencia, factorPresencia, puntuar } from "../src/features/fauna/puntuacion";

test("puntuación: dos notas, suelos y desglose", () => {
  expect(factorFrecuencia(0)).toBe(0);
  expect(factorFrecuencia(50)).toBeGreaterThan(0.65);
  expect(factorPresencia(null)).toBe(0.5);
  expect(factorPresencia(3)).toBe(1);
  expect(factorPresencia(30)).toBe(0.5);
  const base = { permil: 60, actividad: "crepuscular" as const, momento: "dorada" as const, luz: 1, tiempo: 1 };
  const buena = puntuar(base);
  expect(buena.factores).toHaveLength(5);
  // sin avistamientos recientes baja, pero no se anula
  const sinRecientes = puntuar({ ...base, diasDesdeUltimo: null });
  expect(sinRecientes.verla).toBeGreaterThan(0.3);
  // un día malo baja la nota de fotografiarla, no la de verla
  const lluvia = puntuar({ ...base, tiempo: 0.3 });
  expect(lluvia.verla).toBe(buena.verla);
  expect(lluvia.fotografiarla).toBeLessThan(buena.fotografiarla);
  // sin frecuencia, nada
  expect(puntuar({ ...base, permil: 0 }).total).toBe(0);
});

test("detección de eBird: sustituye al ‰ en las aves y sale en el desglose", () => {
  expect(factorDeteccion(0)).toBe(0);
  expect(factorDeteccion(25)).toBeCloseTo(0.63, 2);
  const base = { permil: 5, actividad: "diurna" as const, momento: "dorada" as const, luz: 1, tiempo: 1 };
  const sin = puntuar(base);
  const con = puntuar({ ...base, deteccion: { pct: 60, listas: 300 } });
  expect(con.verla).toBeGreaterThan(sin.verla);
  expect(con.factores[0].nombre).toBe("Detección en eBird");
  expect(con.factores[0].detalle).toContain("60 %");
});
