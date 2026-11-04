// «Este finde»: días, mejor franja del tiempo y nota (funciones puras, sin navegador).
import { expect, test } from "@playwright/test";
import { diasFinde, leerPrevisionVarios, puntuarFinde, tiempoDia } from "../src/features/espana/finde";
import type { HoraTiempo } from "../src/lib/tiempo";

test("días del fin de semana", () => {
  expect(diasFinde("2026-11-04")).toEqual(["2026-11-07", "2026-11-08"]); // miércoles
  expect(diasFinde("2026-11-07")).toEqual(["2026-11-07", "2026-11-08"]); // sábado
  expect(diasFinde("2026-11-08")).toEqual(["2026-11-08"]); // domingo
});

const hora = (h: string, probLluvia: number, rachas: number): HoraTiempo => ({
  hora: h,
  instante: new Date(`${h}:00Z`),
  nubesBajas: 0,
  nubesMedias: 0,
  nubesAltas: 0,
  probLluvia,
  lluvia: 0,
  viento: 10,
  rachas,
});

test("mejor franja: la tarde seca gana a la mañana de lluvia", () => {
  const horas = [hora("2026-11-07T08:00", 90, 20), hora("2026-11-07T17:00", 10, 20), hora("2026-11-08T08:00", 0, 60)];
  const t = tiempoDia(horas, "2026-11-07");
  expect(t?.franja).toBe("tarde");
  expect(t?.valor).toBeCloseTo(0.93, 2);
  expect(tiempoDia(horas, "2026-11-08")?.valor).toBeCloseTo(0.6, 2); // rachas de 60
  expect(tiempoDia(horas, "2026-11-09")).toBeNull();
});

test("nota: más fauna y mejor tiempo arriba; el fenómeno suma", () => {
  const base = { maxEspecies: 100, maxKm: 50, fenomeno: null };
  const seco = { valor: 1, franja: "mañana" as const, probLluvia: 0, rachas: 10 };
  const a = puntuarFinde({ ...base, especies: 100, km: 10, tiempo: seco });
  const b = puntuarFinde({ ...base, especies: 25, km: 10, tiempo: seco });
  const c = puntuarFinde({ ...base, especies: 100, km: 10, tiempo: { ...seco, valor: 0.3 } });
  expect(a.total).toBeGreaterThan(b.total);
  expect(a.total).toBeGreaterThan(c.total);
  expect(b.factores[0].valor).toBeCloseTo(0.5, 5); // raíz de 0,25
  const d = puntuarFinde({ ...base, especies: 25, km: 10, tiempo: seco, fenomeno: "Berrea" });
  expect(d.total).toBeCloseTo(b.total * 1.15, 5);
});

test("Open-Meteo: un punto (objeto) o varios (lista)", () => {
  const uno = {
    hourly: {
      time: ["2026-11-07T08:00"],
      cloud_cover_low: [0],
      cloud_cover_mid: [0],
      cloud_cover_high: [0],
      precipitation_probability: [5],
      precipitation: [0],
      wind_speed_10m: [3],
      wind_gusts_10m: [8],
    },
  };
  expect(leerPrevisionVarios(uno)).toHaveLength(1);
  expect(leerPrevisionVarios([uno, uno])).toHaveLength(2);
});
