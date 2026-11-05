// Coherencia entre módulos (sin navegador): la migración y la temporada de cada parque no se contradicen.
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { MIGRACION } from "../src/features/safaris/migracion";

function mesesDelCatalogo(): Record<string, number[]> {
  const filas = readFileSync("safari/recursos/safaris.csv", "utf8").trim().split("\n");
  const cab = filas[0].split(",");
  const i = cab.indexOf("meses");
  const salida: Record<string, number[]> = {};
  for (const f of filas.slice(1)) {
    const c = f.split(",");
    salida[c[0]] = c[i].split("|").map(Number);
  }
  return salida;
}

test("la migración nunca cae en un mes «fuera de temporada» de su parque (salvo las lluvias, marcadas)", () => {
  const meses = mesesDelCatalogo();
  for (const z of MIGRACION) {
    const ok = meses[z.parque]?.includes(z.mes) || z.lluvias;
    expect(ok, `${z.parque} en el mes ${z.mes} (${z.zona})`).toBeTruthy();
  }
});
