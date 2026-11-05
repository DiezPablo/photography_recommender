// Lectura de public/datos/safaris.json y safaris_recientes.json (solo servidor).
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { leerDatos } from "@/lib/datos";
import type { EspecieSafari, Mundo, Parque, ParqueMundo, Recientes, Safaris } from "@/features/safaris/modelo";
import { capitalizar, paisesDe, slugEspecie, slugTexto } from "@/features/safaris/modelo";

export * from "@/features/safaris/modelo";

function leer<T>(nombre: string): T | null {
  return leerDatos<T>(nombre);
}

let cache: Safaris | null | undefined;
let cacheRecientes: Recientes | null | undefined;

export function cargarSafaris(): Safaris | null {
  if (cache === undefined) cache = leer<Safaris>("safaris.json");
  return cache;
}

export function cargarRecientes(): Recientes | null {
  if (cacheRecientes === undefined) cacheRecientes = leer<Recientes>("safaris_recientes.json");
  return cacheRecientes;
}

export function getParque(id: string): Parque | undefined {
  return cargarSafaris()?.parques.find((p) => p.id === id);
}

export function getEspecieSafari(slug: string): EspecieSafari | undefined {
  return cargarSafaris()?.especies.find((e) => slugEspecie(e) === slug);
}

export function especiePorTaxon(taxon: number): EspecieSafari | undefined {
  return cargarSafaris()?.especies.find((e) => e.taxon === taxon);
}

let cacheMundo: Mundo | null | undefined;

export function cargarMundo(): Mundo | null {
  if (cacheMundo === undefined) cacheMundo = leer<Mundo>("safaris_mundo.json");
  return cacheMundo;
}

export function getParqueMundo(id: string): ParqueMundo | undefined {
  return cargarMundo()?.parques.find((p) => p.id === id);
}

/** Los mejores parques del mundo para una especie del catálogo (por su nombre científico). */
export function parquesMundoDe(cientifico: string, max = 25): { p: ParqueMundo; n: number }[] {
  const m = cargarMundo();
  if (!m) return [];
  const clave = Object.entries(m.estrella).find(([, c]) => c === cientifico)?.[0];
  if (!clave) return [];
  return m.parques
    .map((p) => ({ p, n: p.estrella[clave] ?? 0 }))
    .filter((x) => x.n >= 3)
    .sort((a, b) => b.n - a.n)
    .slice(0, max);
}

/** Nombre en español de una especie estrella del mundo (clave de GBIF): el del catálogo, si lo tiene. */
export function nombreEstrella(clave: number | string): string {
  const m = cargarMundo();
  const cientifico = m?.estrella[String(clave)];
  const c = cientifico ? cargarSafaris()?.especies.find((e) => e.cientifico === cientifico) : undefined;
  if (c?.nombre) return capitalizar(c.nombre);
  const n = m?.especies[String(clave)]?.n;
  return n ? capitalizar(n) : (cientifico ?? "Especie sin nombre común");
}

/** Países con parques destacados: slug → nombre (para /safari-en/tanzania). */
export function paisesDestacados(): Map<string, string> {
  const nombres = (cargarSafaris()?.parques ?? []).flatMap(paisesDe).sort((a, b) => a.localeCompare(b, "es"));
  return new Map(nombres.map((n) => [slugTexto(n), n]));
}

let exclusiones: { parque: string; cientifico: string }[] | undefined;
/** Especies que no se enseñan en un parque (safari/recursos/exclusiones.csv, la misma lista que usa el pipeline):
 * domésticas en todos y pares imposibles (errores de identificación). */
export function exclusionesDe(parque: string): string[] {
  if (!exclusiones) {
    const texto = readFileSync(path.join(process.cwd(), "safari", "recursos", "exclusiones.csv"), "utf8");
    exclusiones = texto
      .trim()
      .split("\n")
      .slice(1)
      .map((l) => {
        const [p, c] = l.split(",");
        return { parque: p, cientifico: c };
      });
  }
  return exclusiones.filter((x) => x.parque === "*" || x.parque === parque).map((x) => x.cientifico);
}

/** Las cifras que se citan en la web, de una sola fuente (al compilar): parques destacados (escritos a mano),
 * destinos de fauna en total (niveles A y B del catálogo mundial), países y especies con ficha. */
export function cifras(): { destacados: number; destinos: number; paises: number; especies: number } {
  const parques = cargarSafaris()?.parques ?? [];
  const destinos = (cargarMundo()?.parques ?? []).filter((p) => p.nivel !== "C");
  return {
    destacados: parques.length,
    destinos: destinos.length || parques.length,
    paises: new Set((destinos.length ? destinos : parques).map((p) => p.pais)).size,
    especies: cargarSafaris()?.especies.length ?? 0,
  };
}
