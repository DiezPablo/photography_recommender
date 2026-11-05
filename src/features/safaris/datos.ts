// Lectura de public/datos/safaris.json y safaris_recientes.json (solo servidor).
import "server-only";
import { fotosElegidas, nombreComun } from "@/features/safaris/nombres";
import { readFileSync } from "node:fs";
import path from "node:path";
import { leerDatos } from "@/lib/datos";
import type { EntradaBusqueda } from "@/lib/busqueda";
import type { OpcionEspecie } from "@/ui/SelectorEspecie";
import { grupoFauna } from "@/features/safaris/gruposFauna";
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

/** Nombres comunes con las mismas reglas que el pipeline (diccionario, mayúsculas, guion blando), también para
 * los datos publicados antes de que el pipeline las aplicara. */
function conNombres<T extends { cientifico: string; nombre?: string | null }>(x: T): T {
  return { ...x, nombre: nombreComun(x.cientifico, x.nombre) };
}

/** La foto elegida a mano (T19), si la especie la tiene. */
function conFotoElegida<T extends { cientifico: string; foto?: FotoSafari | null }>(x: T): T {
  const f = fotosElegidas()[x.cientifico];
  return f ? { ...x, foto: f } : x;
}

export function cargarSafaris(): Safaris | null {
  if (cache === undefined) {
    const d = leer<Safaris>("safaris.json");
    cache = d && {
      ...d,
      especies: d.especies.map(conNombres).map(conFotoElegida),
      parques: d.parques.map((p) => ({
        ...p,
        especies: p.especies
          ? Object.fromEntries(Object.entries(p.especies).map(([g, xs]) => [g, xs.map(conNombres)]))
          : p.especies,
      })),
    };
  }
  return cache;
}

export function cargarRecientes(): Recientes | null {
  if (cacheRecientes === undefined) {
    const d = leer<Recientes>("safaris_recientes.json");
    cacheRecientes = d && {
      ...d,
      parques: Object.fromEntries(
        Object.entries(d.parques).map(([id, r]) => [id, { ...r, mamiferos: r.mamiferos.map(conNombres) }]),
      ),
    };
  }
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
  if (c?.nombre) return c.nombre;
  const n = nombreComun(cientifico, m?.especies[String(clave)]?.n);
  return n ?? cientifico ?? "Especie sin nombre común";
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
    // la cabecera: la foto elegida a mano (T19) si la hay; si no, la hecha en el propio parque (T20); si no, la
    // de la especie
    const f = (e && fotosElegidas()[e.cientifico]) || fotoEstrella(p, t) || e?.foto;
    if (!e || !f || f.licencia?.toUpperCase().includes("ND")) continue;
    return { foto: { ...f, url: f.url.replace("/medium.", "/large.") }, especie: nombreTaxonDe(e) };
  }
  return null;
}

/** La foto de una especie estrella hecha en el parque, si el pipeline encontró una con licencia abierta. */
export function fotoEstrella(p: Parque, taxon: number): FotoSafari | null {
  return p.fotos_estrella?.[String(taxon)] ?? null;
}

/** Lo que busca el buscador de la cabecera: parques (todos los del índice o, con `todos` falso, solo los destinos de
 * fauna: el autocompletado pesa 18 KB en vez de 100), especies
 * (las del catálogo con ficha y el resto de estrellas, que llevan al buscador filtrado) y países. */
export function entradasBusqueda(todos = true): EntradaBusqueda[] {
  const salida: EntradaBusqueda[] = [];
  const indice = cargarIndice();
  for (const f of indice)
    if (todos || esDestino(f))
      salida.push({
        tipo: "parque",
        t: f.n,
        s: f.p ?? undefined,
        href: `/parque/${f.id}`,
        w: f.d ? 1.5 : f.nv === "C" ? 0 : 0.5,
      });
  const catalogo = cargarSafaris()?.especies ?? [];
  const conFicha = new Set(catalogo.map((e) => e.cientifico));
  for (const e of catalogo)
    salida.push({
      tipo: "especie",
      t: nombreTaxonDe(e),
      s: e.cientifico,
      href: `/especie/${slugEspecie(e)}`,
      f: e.foto?.url.replace("/medium.", "/square."),
      w: 1,
    });
  for (const [clave, cientifico] of Object.entries(cargarMundo()?.estrella ?? {}))
    if (!conFicha.has(cientifico))
      salida.push({ tipo: "especie", t: nombreEstrella(clave), s: cientifico, href: `/?especie=${clave}`, w: 0.5 });
  const destacados = paisesDestacados();
  const conGuia = new Map([...destacados].map(([slug, nombre]) => [nombre, slug]));
  const paises = new Map<string, number>();
  for (const f of indice) if (f.p && esDestino(f)) paises.set(f.p, (paises.get(f.p) ?? 0) + 1);
  for (const [pais, n] of paises)
    salida.push({
      tipo: "pais",
      t: pais,
      d: `${n} ${n === 1 ? "destino" : "destinos"}`,
      href: conGuia.has(pais) ? `/safari-en/${conGuia.get(pais)}` : `/?q=${encodeURIComponent(pais)}`,
      w: conGuia.has(pais) ? 1 : 0.5,
    });
  return salida;
}

/** Las especies estrella para el selector (T34): nombre, grupo y miniatura del catálogo si la tiene. */
export function opcionesEspecie(): OpcionEspecie[] {
  const catalogo = new Map((cargarSafaris()?.especies ?? []).map((e) => [e.cientifico, e]));
  return Object.entries(cargarMundo()?.estrella ?? {})
    .map(([clave, cientifico]) => {
      const c = catalogo.get(cientifico);
      return {
        clave: Number(clave),
        nombre: nombreEstrella(clave),
        cientifico,
        grupo: grupoFauna(cientifico, c?.grupo),
        foto: c?.foto?.url.replace("/medium.", "/square.") ?? null,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
