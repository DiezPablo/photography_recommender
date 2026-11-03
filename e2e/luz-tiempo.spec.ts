// Luz y tiempo, funciones puras (sin página ni red).
import { expect, test } from "@playwright/test";
import { calidadLuz, luzDia } from "../src/lib/luz";
import { diasHasta, factorTiempo, leerClimatologia, leerPrevision, urlPrevision } from "../src/lib/tiempo";

test("franjas de luz en Madrid el 21 de junio", () => {
  const l = luzDia("2026-06-21", 40.4168, -3.7038);
  // salida hacia las 06:45 hora peninsular (04:45 UTC) y puesta hacia las 21:48 (19:48 UTC)
  expect(Math.abs(l.amanecer!.getTime() - Date.parse("2026-06-21T04:45:00Z"))).toBeLessThan(5 * 60000);
  expect(Math.abs(l.atardecer!.getTime() - Date.parse("2026-06-21T19:48:00Z"))).toBeLessThan(5 * 60000);
  expect(l.azulManana!.hasta.getTime()).toBeLessThanOrEqual(l.doradaManana!.desde.getTime() + 1000);
  expect(calidadLuz(new Date(l.doradaTarde!.desde.getTime() + 60000), l)).toBe(1);
  expect(calidadLuz(new Date("2026-06-21T12:00:00Z"), l)).toBeLessThan(0.4);
  expect(calidadLuz(new Date("2026-06-21T01:00:00Z"), l)).toBe(0);
});

test("previsión y climatología de Open-Meteo", () => {
  expect(urlPrevision(40.98, -1.5, "2026-11-08")).toContain("cloud_cover_low");
  expect(diasHasta("2026-11-10", new Date("2026-11-03T10:00:00Z"))).toBe(7);
  const p = leerPrevision({
    hourly: {
      time: ["2026-11-08T07:00"],
      cloud_cover_low: [80],
      cloud_cover_mid: [10],
      cloud_cover_high: [0],
      precipitation_probability: [20],
      precipitation: [0],
      wind_speed_10m: [12],
      wind_gusts_10m: [30],
    },
  });
  expect(p.horas[0]).toMatchObject({ nubesBajas: 80, probLluvia: 20, rachas: 30 });
  expect(factorTiempo(p.horas[0])).toBe(1);
  expect(factorTiempo({ probLluvia: 90, lluvia: 2, rachas: 70 })).toBe(0.3);
  // climatología: solo cuentan los días a ±7 de la fecha
  const c = leerClimatologia(
    {
      daily: {
        time: ["2024-11-06", "2024-11-08", "2024-06-01"],
        precipitation_sum: [3, 0, 10],
        cloud_cover_mean: [60, 40, 0],
        wind_speed_10m_max: [20, 10, 50],
      },
    },
    "2026-11-08",
    2016,
    2025,
  );
  expect(c).toMatchObject({ tipo: "climatologia", diasLluvia: 50, nubes: 50, vientoMax: 15 });
});
