// Lectura de public/datos/safaris.json y safaris_recientes.json (solo servidor).
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { leerDatos } from "@/lib/datos";
import type {
  EspecieSafari,
  FilaIndice,
  FotoSafari,
  Mundo,
  Parque,
  ParqueMundo,
  Recientes,
  Safaris,
} from "@/features/safaris/modelo";
import {
  buenaEpoca,
  capitalizar,
  esDestino,
  nombreTaxon as nombreTaxonDe,
  paisesDe,
  slugEspecie,
  slugTexto,
} from "@/features/safaris/modelo";

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

let indice: FilaIndice[] | null | undefined;
/** El índice del buscador (safaris_indice.json) en el servidor: para pintar la primera página sin JavaScript. */
export function cargarIndice(): FilaIndice[] {
  if (indice === undefined) indice = leerDatos<{ parques: FilaIndice[] }>("safaris_indice.json")?.parques ?? null;
  return indice ?? [];
}

/** La primera página del buscador sin filtros (destinos de fauna, primero los que están en buena época ese mes),
 * tal como la ordena el navegador. */
export function primerosDelIndice(mes: number, n = 30): FilaIndice[] {
  return cargarIndice()
    .filter(esDestino)
    .map((f) => ({ f, epoca: buenaEpoca(f)?.includes(mes + 1) ?? false }))
    .sort((a, b) => Number(b.epoca) - Number(a.epoca) || Number(b.f.d) - Number(a.f.d) || b.f.s - a.f.s)
    .slice(0, n)
    .map((x) => x.f);
}

/** Países del planificador, de más a menos interés (como en el navegador). */
export function paisesPlanificador(): string[] {
  const interes = new Map<string, number>();
  for (const f of cargarIndice().filter(esDestino)) if (f.p) interes.set(f.p, (interes.get(f.p) ?? 0) + f.s);
  return [...interes.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
}

/** La foto de cabecera de un parque: su primera especie estrella con foto que se pueda recortar (sin licencia
 * ND), en grande. Las cabeceras eran paisajes de Commons; el paisaje queda solo si no hay ninguna. */
export function fotoFauna(p: Parque): { foto: FotoSafari; especie: string } | null {
  for (const t of p.estrella) {
    const e = especiePorTaxon(t);
    const f = e?.foto;
    if (!e || !f || f.licencia?.toUpperCase().includes("ND")) continue;
    return { foto: { ...f, url: f.url.replace("/medium.", "/large.") }, especie: nombreTaxonDe(e) };
  }
  return null;
}
