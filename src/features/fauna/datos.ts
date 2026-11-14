// Datos de España en el servidor: espana.json (descarga de GBIF por cuadrícula de 10 km) y los lugares
// (espana_lugares.json: puntos de eBird, espacios protegidos de Wikidata, observatorios de OSM) para buscar, para
// «cerca de aquí» y para nombrar cada celda.
import "server-only";
import { leerDatos } from "@/lib/datos";
import { celda, celdasEnRadio, centroCelda } from "@/lib/rejilla";
import { distanciaKm } from "@/lib/fechas";
import { ZONAS_ESPANA, type BloqueEspana, type LugarFauna, type ObsReciente } from "@/features/fauna/zonas";

export interface Espana {
  generado: string;
  /** lo que más sube cada mes, calculado en el pipeline (rasante/fauna/cuadricula.py, sube_por_mes): [[clave, ‰, media]] */
  sube?: [string, number, number][][];
  fuente?: { cita?: string };
  especies: BloqueEspana["especies"];
  celdas: BloqueEspana["celdas"];
}

/** Listas de eBird en un punto de observación (espana_listas.json, spec 021). */
export interface ActividadPunto {
  /** listas en los últimos 7 y 30 días */
  l7: number;
  l30: number;
  /** fecha de la última (AAAA-MM-DD) y especies de la lista más larga de ese día */
  u: string;
  e: number;
  /** especies de la lista más larga de los 30 días */
  m: number;
}

let listas: Record<string, ActividadPunto> | null | undefined;
/** La actividad reciente de un lugar que es un punto de eBird (id `eb-L…`); null si no hay datos o no lo es. */
export function actividadPunto(id: string): ActividadPunto | null {
  if (!id.startsWith("eb-")) return null;
  if (listas === undefined)
    listas = leerDatos<{ puntos: Record<string, ActividadPunto> }>("espana_listas.json")?.puntos ?? null;
  return listas?.[id.slice(3)] ?? null;
}

let espana: Espana | null | undefined;
export function cargarEspana(): Espana | null {
  if (espana === undefined) espana = leerDatos<Espana>("espana.json");
  return espana;
}

export interface SitioNatura {
  n: string;
  /** A: ZEPA (aves); B: LIC/ZEC (hábitats); C: los dos */
  t: string | null;
  a: number;
  lat: number;
  lon: number;
  celdas: string[];
  g: GeoJSON.Geometry;
}
let natura: Record<string, SitioNatura> | null | undefined;
/** Espacios de la Red Natura 2000 con su contorno y sus cuadrículas (espana_natura.json, de la EEA). */
export function cargarNatura(): Record<string, SitioNatura> {
  if (natura === undefined)
    natura = leerDatos<{ sitios: Record<string, SitioNatura> }>("espana_natura.json")?.sitios ?? null;
  return natura ?? {};
}

const TIPO_NATURA: Record<string, string> = { A: "ZEPA", B: "Red Natura 2000", C: "ZEPA y ZEC" };

/** Los espacios Natura 2000 que no tienen ya un lugar de Wikidata (por código o por nombre), como lugares. */
function lugaresNatura(propios: LugarFauna[]): LugarFauna[] {
  const codigos = new Set(propios.map((l) => l.z).filter(Boolean));
  const nombres = new Set(propios.filter((l) => l.id.startsWith("wd-")).map((l) => l.n.toLowerCase()));
  return Object.entries(cargarNatura())
    .filter(([c, x]) => !codigos.has(c) && !nombres.has(x.n.toLowerCase()))
    .map(([c, x]) => ({
      id: `n2k-${c}`,
      n: x.n,
      t: TIPO_NATURA[x.t ?? ""] ?? "Red Natura 2000",
      lat: x.lat,
      lon: x.lon,
      r: Math.round(Math.min(30, Math.max(1, Math.sqrt(x.a / Math.PI))) * 10) / 10,
      z: c,
    }));
}

/** Las cuadrículas de un lugar: las que toca su contorno Natura 2000 si lo tiene; si no, las del círculo. */
export function celdasDe(l: LugarFauna): string[] {
  const sitio = l.z ? cargarNatura()[l.z] : undefined;
  return sitio?.celdas.length ? sitio.celdas : celdasEnRadio(l.lat, l.lon, Math.min(l.r, 10));
}

/** Contorno Natura 2000 del lugar, para el mapa. */
export function contornoDe(l: LugarFauna): GeoJSON.Geometry | null {
  return (l.z && cargarNatura()[l.z]?.g) || null;
}

// cuadrícula → el espacio Natura 2000 más grande que la contiene (el más conocido: «Cuenca de Gallocanta» antes que
// «Laguna de Gallocanta»), con el id de su lugar
let dentroDe: Map<string, { nombre: string; id: string }> | undefined;
function espacioDeCelda(c: string): { nombre: string; id: string } | null {
  if (!dentroDe) {
    dentroDe = new Map();
    const idPorCodigo = new Map(
      cargarLugares()
        .filter((l) => l.z)
        .map((l) => [l.z!, l]),
    );
    const area = new Map<string, number>();
    for (const [codigo, x] of Object.entries(cargarNatura())) {
      const l = idPorCodigo.get(codigo);
      if (!l) continue;
      for (const celda of x.celdas)
        if (x.a > (area.get(celda) ?? -1)) {
          area.set(celda, x.a);
          dentroDe.set(celda, { nombre: l.n, id: l.id });
        }
    }
  }
  return dentroDe.get(c) ?? null;
}

let lugares: LugarFauna[] | undefined;
/** Todos los lugares: las zonas destacadas y los de espana_lugares.json (mientras no exista, solo las zonas). */
export function cargarLugares(): LugarFauna[] {
  if (lugares === undefined) {
    const propios = leerDatos<{ lugares: LugarFauna[] }>("espana_lugares.json")?.lugares;
    const zonas: LugarFauna[] = ZONAS_ESPANA.map((z) => ({
      id: `zona-${z.id}`,
      n: z.nombre,
      t: "Destacado",
      lat: z.lat,
      lon: z.lon,
      r: z.radioKm,
    }));
    lugares = propios?.length ? [...zonas, ...propios, ...lugaresNatura(propios)] : zonas;
  }
  return lugares;
}

const sinTildes = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Lugares cuyo nombre contiene el texto (sin tildes); antes los que empiezan así y los de más especies. */
export function buscarLugares(q: string, max = 12): LugarFauna[] {
  const t = sinTildes(q.trim());
  if (t.length < 2) return [];
  return cargarLugares()
    .map((l) => ({ l, i: sinTildes(l.n).indexOf(t) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => Number(a.i !== 0) - Number(b.i !== 0) || (b.l.e ?? 0) - (a.l.e ?? 0) || a.l.n.length - b.l.n.length)
    .slice(0, max)
    .map((x) => x.l);
}

export interface LugarCerca extends LugarFauna {
  km: number;
  /** especies con registros en el mes en sus cuadrículas */
  especies: number;
  /** especies que se esperarían con los mismos 100 registros en todas partes (rarefacción, análisis del 09-11-2026):
   * el recuento bruto sigue al esfuerzo de observación (correlación de rangos 0,82 con los registros; esta, 0,49) */
  esperadas: number;
  /** las más frecuentes del mes, una de cada grupo por turno */
  destacadas: string[];
}

/** Registros a los que se rarefacta la riqueza de cada lugar («especies esperadas en 100 registros»). */
export const REGISTROS_RAREFACCION = 100;

/** Los lugares más cercanos al punto (hasta maxKm) con lo que hay en sus cuadrículas en el mes (0-11). */
export function lugaresCerca(lat: number, lon: number, mes: number, max = 12, maxKm = 30): LugarCerca[] {
  const e = cargarEspana();
  // de los puntos de eBird, uno por cuadrícula de 10 km (el de más especies): los de una misma cuadrícula tienen
  // los mismos datos y en una ciudad llenaban la lista de plazas (Retiro sale; Plaza del Carmen, no)
  const mejorPorCelda = new Map<string, LugarFauna>();
  const aqui = celda(lat, lon);
  const todos = cargarLugares()
    // dentro del contorno Natura 2000 (en una de sus cuadrículas), a 0 km aunque el centro quede lejos
    .map((l) => ({ l, km: l.z && cargarNatura()[l.z]?.celdas.includes(aqui) ? 0 : distanciaKm({ lat, lon }, l) }))
    .filter((x) => x.km <= maxKm);
  for (const { l } of todos)
    if (l.id.startsWith("eb-")) {
      const c = celda(l.lat, l.lon);
      const ya = mejorPorCelda.get(c);
      if (!ya || (l.e ?? 0) > (ya.e ?? 0)) mejorPorCelda.set(c, l);
    }
  const cerca = todos
    .filter((x) => !x.l.id.startsWith("eb-") || mejorPorCelda.get(celda(x.l.lat, x.l.lon)) === x.l)
    .sort((a, b) => a.km - b.km);
  // los puntos de eBird son miles (en una ciudad, decenas a pocos km): se guardan sitios para los espacios
  // protegidos y observatorios más cercanos, que si no quedarían fuera
  const otros = Math.round(max / 3);
  const primeros = cerca.slice(0, max - otros);
  const elegidos = [
    ...primeros,
    ...cerca.filter((x) => !x.l.id.startsWith("eb-") && !primeros.includes(x)).slice(0, otros),
  ];
  return [...elegidos, ...cerca.filter((x) => !elegidos.includes(x))]
    .slice(0, max)
    .sort((a, b) => a.km - b.km)
    .map(({ l, km }) => {
      const porGrupo = new Map<string, { k: string; v: number }[]>();
      const vistas = new Set<string>();
      // la mayor proporción de cada especie en las cuadrículas del lugar, para la rarefacción
      const proporcion = new Map<string, number>();
      for (const c of celdasDe(l)) {
        const d = e?.celdas[c];
        if (!d) continue;
        for (const [k, meses] of Object.entries(d.e)) {
          const v = meses[mes];
          if (v) proporcion.set(k, Math.max(proporcion.get(k) ?? 0, v / 1000));
          if (!v || vistas.has(k)) continue;
          // las invasoras cuentan en el total pero no se destacan
          if (e?.especies[k]?.estado === "invasora") {
            vistas.add(k);
            continue;
          }
          vistas.add(k);
          const clase = e?.especies[k]?.clase ?? "Aves";
          const n = d.m[clase]?.[mes] ?? 0;
          const lista = porGrupo.get(clase) ?? [];
          lista.push({ k, v: (v * n) / (n + 100) });
          porGrupo.set(clase, lista);
        }
      }
      const listas = [...porGrupo.values()].map((xs) => xs.sort((a, b) => b.v - a.v));
      const destacadas: string[] = [];
      for (let i = 0; destacadas.length < 4 && listas.some((xs) => xs[i]); i++)
        for (const xs of listas)
          if (xs[i] && destacadas.length < 4)
            destacadas.push(e?.especies[xs[i].k]?.n ?? e?.especies[xs[i].k]?.c ?? xs[i].k);
      const esperadas = [...proporcion.values()].reduce((a, p) => a + 1 - (1 - p) ** REGISTROS_RAREFACCION, 0);
      return {
        ...l,
        km: Math.round(km * 10) / 10,
        especies: vistas.size,
        esperadas: Math.round(esperadas * 10) / 10,
        destacadas,
      };
    });
}

/** Hasta dónde se nombra el espacio protegido más cercano («a 29 km de Tablas de Daimiel») y, más cerca, hasta
 * dónde una cuadrícula cuenta como parte de él (y se agrupa con las demás del mismo espacio). */
export const KM_NOMBRE = 40;
export const KM_DENTRO = 15;

/** El espacio protegido más cercano a menos de KM_NOMBRE km del punto, con la distancia. */
// índice de los lugares por cuadros de 1°: para nombrar una celda basta mirar su cuadro y los ocho vecinos (más de
// 100 km, por encima de KM_NOMBRE más el radio del espacio más grande); recorrer los 21 000 por cada una de las
// miles de celdas de una especie común tardaba segundos
let indice: Map<string, LugarFauna[]> | undefined;
const cuadro = (lat: number, lon: number) => `${Math.floor(lat)},${Math.floor(lon)}`;
function lugaresAlrededor(lat: number, lon: number): LugarFauna[] {
  if (!indice) {
    indice = new Map();
    for (const l of cargarLugares()) {
      if (l.id.startsWith("eb-") && (l.e ?? 0) < 100) continue; // los puntos pequeños (una plaza) no nombran celdas
      const k = cuadro(l.lat, l.lon);
      indice.set(k, [...(indice.get(k) ?? []), l]);
    }
  }
  const salida: LugarFauna[] = [];
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) salida.push(...(indice.get(cuadro(lat + i, lon + j)) ?? []));
  return salida;
}

export function nombreLugar(
  lat: number,
  lon: number,
  celda?: string,
): { nombre: string; km: number; id: string } | null {
  // dentro de un espacio Natura 2000 (por su contorno real), ese
  const dentro = celda ? espacioDeCelda(celda) : null;
  if (dentro) return { ...dentro, km: 0 };
  let mejor: { nombre: string; km: number; id: string } | null = null;
  for (const a of lugaresAlrededor(lat, lon)) {
    // distancia al borde (aproximado como círculo): dentro de un parque grande cuenta 0
    const km = Math.max(0, distanciaKm({ lat, lon }, a) - a.r);
    if (km < KM_NOMBRE && (!mejor || km < mejor.km)) mejor = { nombre: a.n, km: Math.round(km), id: a.id };
  }
  return mejor;
}

export interface LugarEspecie {
  celda: string;
  lat: number;
  lon: number;
  lugar: { nombre: string; km: number; id: string } | null;
  /** ‰ de su grupo por mes */
  meses: (number | null)[];
  /** observaciones de su grupo por mes (tamaño de muestra) */
  muestra: number[];
  /** cuadrículas de 10 km del mismo lugar (se agrupan por espacio protegido; los datos, los de la mejor) */
  celdas: number;
}

/** Las celdas donde se ve la especie, de más a menos frecuente en el mes (0-11) o en su mejor mes. */
export function lugaresDe(clave: string, mes: number | null, max = 40): LugarEspecie[] {
  const e = cargarEspana();
  if (!e) return [];
  const clase = e.especies[clave]?.clase ?? "Aves";
  const valor = (meses: (number | null)[]) =>
    mes === null ? Math.max(0, ...meses.map((v) => v ?? 0)) : (meses[mes] ?? 0);
  const ordenadas = Object.entries(e.celdas)
    .filter(([celda, c]) => c.e[clave] && /^10kmE\d+N\d+$/.test(celda))
    .map(([celda, c]) => ({ celda, meses: c.e[clave], muestra: c.m[clase] ?? Array(12).fill(0) }))
    .filter((x) => valor(x.meses) > 0)
    .sort((a, b) => valor(b.meses) - valor(a.meses));
  // un lugar por espacio protegido (Gallocanta son siete cuadrículas): manda la mejor, se cuentan las demás
  const porLugar = new Map<string, LugarEspecie>();
  for (const x of ordenadas) {
    const [lat, lon] = centroCelda(x.celda);
    const lugar = nombreLugar(lat, lon, x.celda);
    const k = lugar && lugar.km < KM_DENTRO ? lugar.nombre : x.celda;
    const ya = porLugar.get(k);
    if (ya) ya.celdas++;
    else if (porLugar.size < max)
      porLugar.set(k, {
        ...x,
        lat: Math.round(lat * 1000) / 1000,
        lon: Math.round(lon * 1000) / 1000,
        lugar,
        celdas: 1,
      });
  }
  return [...porLugar.values()];
}

let porId: Map<string, LugarFauna> | undefined;
export function lugarPorId(id: string): LugarFauna | null {
  porId ??= new Map(cargarLugares().map((l) => [l.id, l]));
  return porId.get(id) ?? null;
}

export interface FilaLugar {
  clave: string;
  nombre: string;
  cientifico: string | null;
  clase: string;
  estado?: "invasora" | "aviso";
  meses: (number | null)[];
  muestra: number[];
}

/** El año de un lugar: las especies de sus cuadrículas con su ‰ de cada mes (media ponderada por la muestra de su
 * grupo en cada cuadrícula), las `porGrupo` más frecuentes de cada grupo. */
export function calendarioLugar(l: LugarFauna, porGrupo = 12): { filas: FilaLugar[]; celdas: number } {
  const e = cargarEspana();
  if (!e) return { filas: [], celdas: 0 };
  const suma = new Map<string, { p: number[]; m: number[]; clase: string }>();
  const muestras = new Map<string, number[]>();
  let n = 0;
  for (const c of celdasDe(l)) {
    const d = e.celdas[c];
    if (!d) continue;
    n++;
    for (const [clase, m] of Object.entries(d.m)) {
      const t = muestras.get(clase) ?? Array(12).fill(0);
      muestras.set(
        clase,
        t.map((x, i) => x + (m[i] ?? 0)),
      );
    }
    for (const [k, meses] of Object.entries(d.e)) {
      const clase = e.especies[k]?.clase ?? "Aves";
      const m = d.m[clase] ?? Array(12).fill(0);
      const s = suma.get(k) ?? { p: Array(12).fill(0), m: Array(12).fill(0), clase };
      meses.forEach((v, i) => {
        if (v === null) return;
        s.p[i] += v * m[i];
        s.m[i] += m[i];
      });
      suma.set(k, s);
    }
  }
  const filas: FilaLugar[] = [...suma.entries()].map(([k, s]) => ({
    clave: k,
    nombre: e.especies[k]?.n ?? e.especies[k]?.c ?? k,
    cientifico: e.especies[k]?.c ?? null,
    clase: s.clase,
    estado: e.especies[k]?.estado,
    meses: s.p.map((p, i) => (s.m[i] ? Math.round(p / s.m[i]) : null)),
    muestra: muestras.get(s.clase) ?? Array(12).fill(0),
  }));
  const media = (f: FilaLugar) => f.meses.reduce<number>((a, b) => a + (b ?? 0), 0);
  const elegidas = new Map<string, FilaLugar[]>();
  for (const f of filas.filter((x) => x.estado !== "invasora").sort((a, b) => media(b) - media(a))) {
    const xs = elegidas.get(f.clase) ?? [];
    if (xs.length < porGrupo) xs.push(f);
    elegidas.set(f.clase, xs);
  }
  return { filas: [...elegidas.values()].flat(), celdas: n };
}

/** Lo visto en 30 días cerca del lugar (aves de eBird; mamíferos, reptiles y anfibios de iNaturalist), más
 * recientes antes; las domésticas, fuera (no están en espana.json). */
let recientes: { generado: string; obs: ObsReciente[] } | null | undefined;
export function recientesLugar(l: LugarFauna, margenKm = 5): ObsReciente[] {
  if (recientes === undefined) recientes = leerDatos<{ generado: string; obs: ObsReciente[] }>("espana_recientes.json");
  const conocidas = new Set(Object.values(cargarEspana()?.especies ?? {}).map((e) => e.c));
  return (recientes?.obs ?? [])
    .filter((o) => distanciaKm(l, o) <= l.r + margenKm && conocidas.has(o.c))
    .sort((a, b) => b.f.localeCompare(a.f));
}

interface Ruta {
  id: number;
  n: string;
  ref?: string | null;
  lat: number;
  lon: number;
  km?: number | null;
}
let rutas: { rutas: Ruta[] } | null | undefined;

/** Rutas de senderismo de OpenStreetMap que pasan cerca del lugar (por su centro, hasta `maxKm` del borde). */
export function rutasCerca(l: LugarFauna, maxKm = 10, max = 6): (Ruta & { a: number })[] {
  if (rutas === undefined) rutas = leerDatos("espana_rutas.json");
  return (rutas?.rutas ?? [])
    .map((x) => ({ ...x, a: Math.round(distanciaKm(l, x) * 10) / 10 }))
    .filter((x) => x.a <= l.r + maxKm)
    .sort((a, b) => a.a - b.a)
    .slice(0, max);
}

export interface Rareza {
  c: string;
  n: string | null;
  /** "2026-11-03 09:30" */
  f: string;
  lat: number;
  lon: number;
  l: string | null;
  k: number | null;
  /** revisada y aceptada por los revisores de eBird */
  r: boolean;
  sub: string | null;
  /** provincia */
  p: string | null;
}
let rarezas: { generado: string; obs: Rareza[] } | null | undefined;
export function cargarRarezas(): { generado: string; obs: Rareza[] } | null {
  if (rarezas === undefined) rarezas = leerDatos<{ generado: string; obs: Rareza[] }>("espana_rarezas.json");
  return rarezas ?? null;
}

/** Lo notable de los últimos 7 días a menos de `km` del punto, más reciente antes. */
export function rarezasCerca(lat: number, lon: number, km = 30): (Rareza & { a: number })[] {
  return (cargarRarezas()?.obs ?? [])
    .map((o) => ({ ...o, a: Math.round(distanciaKm({ lat, lon }, o)) }))
    .filter((o) => o.a <= km)
    .sort((a, b) => b.f.localeCompare(a.f));
}

/** Clave de GBIF de una especie por nombre científico (para enlazar a «¿Dónde veo…?»). */
let clavePorCientifico: Map<string, string> | undefined;
export function claveDe(cientifico: string): string | null {
  clavePorCientifico ??= new Map(Object.entries(cargarEspana()?.especies ?? {}).map(([k, e]) => [e.c ?? "", k]));
  return clavePorCientifico.get(cientifico.split(" ").slice(0, 2).join(" ")) ?? null;
}

/** Las cuadrículas donde se registra la especie con su ‰ del mes (0-11) o del mejor mes, y la muestra detrás: las
 * observaciones de su grupo ese mes con los vecinos (la misma base que la frecuencia). Para el mapa de calor y para la
 * capa de fiabilidad de la carta. [celda, lat, lon, ‰, muestra] */
export function celdasDeEspecie(clave: string, mes: number | null): [string, number, number, number, number][] {
  const e = cargarEspana();
  if (!e) return [];
  const clase = e.especies[clave]?.clase ?? "Aves";
  const salida: [string, number, number, number, number][] = [];
  for (const [c, d] of Object.entries(e.celdas)) {
    const meses = d.e[clave];
    if (!meses || !/^10kmE\d+N\d+$/.test(c)) continue;
    const mejor = meses.reduce<number>((a, x, i) => ((x ?? 0) > (meses[a] ?? 0) ? i : a), 0);
    const m = mes === null ? mejor : mes;
    const v = meses[m] ?? 0;
    if (v <= 0) continue;
    const base = d.m[clase] ?? [];
    const muestra = [m - 1, m, m + 1].reduce((a, i) => a + (base[(i + 12) % 12] ?? 0), 0);
    const [lat, lon] = centroCelda(c);
    salida.push([c, Math.round(lat * 1000) / 1000, Math.round(lon * 1000) / 1000, v, muestra]);
  }
  return salida;
}

/** La curva del año en toda España: ‰ de su grupo cada mes (media ponderada por la muestra de cada cuadrícula),
 * en cuántas cuadrículas aparece y la muestra de su grupo detrás. */
export function curvaEspecie(clave: string): { meses: (number | null)[]; celdas: number; muestra: number[] } {
  const e = cargarEspana();
  const p = Array(12).fill(0);
  const m = Array(12).fill(0);
  let n = 0;
  if (!e) return { meses: Array(12).fill(null), celdas: 0, muestra: m };
  const clase = e.especies[clave]?.clase ?? "Aves";
  for (const d of Object.values(e.celdas)) {
    const meses = d.e[clave];
    if (!meses) continue;
    n++;
    const muestra = d.m[clase] ?? [];
    meses.forEach((v, i) => {
      if (v === null) return;
      p[i] += v * (muestra[i] ?? 0);
      m[i] += muestra[i] ?? 0;
    });
  }
  return { meses: p.map((x, i) => (m[i] ? Math.round(x / m[i]) : null)), celdas: n, muestra: m };
}

let actividadEspana: { especies: Record<string, { f: [number, number, number]; n: number }> } | null | undefined;
/** Perfil de actividad medido (noche, crepúsculo, día) de una especie, si lo hay. */
export function actividadDe(cientifico: string | null | undefined): { f: [number, number, number]; n: number } | null {
  if (!cientifico) return null;
  if (actividadEspana === undefined) actividadEspana = leerDatos("espana_actividad.json");
  return actividadEspana?.especies[cientifico] ?? null;
}

/** Lo visto de una especie en 30 días (eBird o iNaturalist), más reciente antes. */
export function recientesDe(cientifico: string | null | undefined): ObsReciente[] {
  if (!cientifico) return [];
  if (recientes === undefined) recientes = leerDatos<{ generado: string; obs: ObsReciente[] }>("espana_recientes.json");
  return (recientes?.obs ?? [])
    .filter((o) => o.c.split(" ").slice(0, 2).join(" ") === cientifico)
    .sort((a, b) => b.f.localeCompare(a.f));
}

let ebirdEspana: { celdas: Record<string, { l: number[]; d: Record<string, (number | null)[]> }> } | null | undefined;
/** Aves: % de listas de eBird con la especie cada mes en toda España (ponderado por listas) y las listas detrás. */
export function deteccionEspecie(clave: string): { pct: (number | null)[]; listas: number[] } | null {
  if (ebirdEspana === undefined) ebirdEspana = leerDatos("espana_ebird.json");
  if (!ebirdEspana) return null;
  const con = Array(12).fill(0);
  const listas = Array(12).fill(0);
  let hay = false;
  for (const x of Object.values(ebirdEspana.celdas)) {
    for (let i = 0; i < 12; i++) {
      if (x.l[i] < 10) continue;
      listas[i] += x.l[i];
      const v = x.d[clave]?.[i];
      if (v) {
        con[i] += (v * x.l[i]) / 100;
        hay = true;
      }
    }
  }
  if (!hay) return null;
  return { pct: con.map((c, i) => (listas[i] ? Math.round((1000 * c) / listas[i]) / 10 : null)), listas };
}

export interface EspecieEnLista {
  k: string;
  n: string | null;
  c: string | null;
  clase: string | null;
  estado: "invasora" | "aviso" | null;
  nota: string | null;
  celdas: number;
}
let listaEspecies: EspecieEnLista[] | undefined;
/** Las especies de España para el buscador, de más a menos cuadrículas (una sola vez por proceso). */
export function listaEspeciesEspana(): EspecieEnLista[] {
  if (listaEspecies) return listaEspecies;
  const e = cargarEspana();
  if (!e) return [];
  const celdas = new Map<string, number>();
  for (const c of Object.values(e.celdas)) for (const k of Object.keys(c.e)) celdas.set(k, (celdas.get(k) ?? 0) + 1);
  listaEspecies = Object.entries(e.especies)
    .map(([k, v]) => ({
      k,
      n: v.n,
      c: v.c,
      clase: v.clase ?? null,
      estado: v.estado ?? null,
      nota: v.nota ?? null,
      celdas: celdas.get(k) ?? 0,
    }))
    .filter((x) => x.celdas > 0)
    .sort((a, b) => b.celdas - a.celdas);
  return listaEspecies;
}

export interface EspecieDelMes {
  k: string;
  n: string | null;
  c: string | null;
  clase: string | null;
  /** ‰ de su grupo en España ese mes y la media del año */
  mes: number;
  media: number;
  celdas: number;
}
let delMes: EspecieDelMes[][] | undefined;
/** Las especies que más suben en un mes respecto a su media del año en toda España (en al menos 150 cuadrículas y
 * con ‰ ≥ 3 ese mes): lo que toca ver ahora, medido con la misma frecuencia que la carta. Los doce meses de una vez,
 * una vez por proceso. */
export function especiesPorMes(max = 8): EspecieDelMes[][] {
  if (delMes) return delMes;
  // desde el 08-11-2026 lo calcula el pipeline (con pruebas); aquí solo se ponen los nombres. Con datos anteriores,
  // el cálculo de antes
  const e = cargarEspana();
  if (e?.sube) {
    const lista = new Map(listaEspeciesEspana().map((x) => [x.k, x]));
    delMes = e.sube.map((mes) =>
      mes.flatMap(([k, v, media]) => {
        const x = lista.get(k);
        return x ? [{ k, n: x.n, c: x.c, clase: x.clase, mes: v, media, celdas: x.celdas }] : [];
      }),
    );
    return delMes;
  }
  const meses: EspecieDelMes[][] = Array.from({ length: 12 }, () => []);
  for (const x of listaEspeciesEspana()) {
    if (x.celdas < 150 || x.estado) continue;
    const curva = curvaEspecie(x.k).meses;
    const conDato = curva.filter((m): m is number => m !== null);
    if (conDato.length < 10) continue;
    const media = conDato.reduce((a, b) => a + b, 0) / conDato.length;
    curva.forEach((v, i) => {
      if (v === null || v < 3 || v < 1.5 * media) return;
      meses[i].push({
        k: x.k,
        n: x.n,
        c: x.c,
        clase: x.clase,
        mes: v,
        media: Math.round(media * 10) / 10,
        celdas: x.celdas,
      });
    });
  }
  delMes = meses.map((m) => m.sort((a, b) => b.mes / b.media - a.mes / a.media).slice(0, max));
  return delMes;
}
