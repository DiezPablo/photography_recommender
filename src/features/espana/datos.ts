// Datos de España en el servidor: espana.json (descarga de GBIF por cuadrícula de 10 km) y los lugares
// (espana_lugares.json: puntos de eBird, espacios protegidos de Wikidata, observatorios de OSM) para buscar, para
// «cerca de aquí» y para nombrar cada celda; si aún no están, los espacios protegidos del catálogo mundial.
import "server-only";
import { leerDatos } from "@/lib/datos";
import { celda, celdasEnRadio, centroCelda } from "@/lib/rejilla";
import { distanciaKm } from "@/lib/fechas";
import type { Mundo } from "@/features/safaris/modelo";
import { ZONAS_ESPANA, type BloqueEspana, type LugarFauna, type ObsReciente } from "@/features/espana/zonas";

export interface Espana {
  generado: string;
  fuente?: { cita?: string };
  especies: BloqueEspana["especies"];
  celdas: BloqueEspana["celdas"];
}

let espana: Espana | null | undefined;
export function cargarEspana(): Espana | null {
  if (espana === undefined) espana = leerDatos<Espana>("espana.json");
  return espana;
}

let lugares: LugarFauna[] | undefined;
/** Todos los lugares: los de espana_lugares.json o, mientras no exista, las zonas y los parques del catálogo. */
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
    if (propios?.length) lugares = [...zonas, ...propios];
    else {
      const m = leerDatos<Mundo>("safaris_mundo.json");
      const espanaQ = Object.entries(m?.paises ?? {}).find(([, p]) => p.nombre === "España")?.[0];
      lugares = [
        ...zonas,
        ...(m?.parques ?? [])
          .filter((p) => p.pais === espanaQ)
          .map((p) => ({ id: p.id, n: p.nombre, t: "Espacio protegido", lat: p.lat, lon: p.lon, r: p.radio_km ?? 5 })),
      ];
    }
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
  /** las más frecuentes del mes, una de cada grupo por turno */
  destacadas: string[];
}

/** Los lugares más cercanos al punto (hasta maxKm) con lo que hay en sus cuadrículas en el mes (0-11). */
export function lugaresCerca(lat: number, lon: number, mes: number, max = 12, maxKm = 30): LugarCerca[] {
  const e = cargarEspana();
  // de los puntos de eBird, uno por cuadrícula de 10 km (el de más especies): los de una misma cuadrícula tienen
  // los mismos datos y en una ciudad llenaban la lista de plazas (Retiro sale; Plaza del Carmen, no)
  const mejorPorCelda = new Map<string, LugarFauna>();
  const todos = cargarLugares()
    .map((l) => ({ l, km: distanciaKm({ lat, lon }, l) }))
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
      for (const c of celdasEnRadio(l.lat, l.lon, Math.min(l.r, 10))) {
        const d = e?.celdas[c];
        if (!d) continue;
        for (const [k, meses] of Object.entries(d.e)) {
          const v = meses[mes];
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
      return { ...l, km: Math.round(km * 10) / 10, especies: vistas.size, destacadas };
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

export function nombreLugar(lat: number, lon: number): { nombre: string; km: number; id: string } | null {
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
    const lugar = nombreLugar(lat, lon);
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
  for (const c of celdasEnRadio(l.lat, l.lon, Math.min(l.r, 10))) {
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

/** Aves vistas en 30 días cerca del lugar (eBird: la última de cada especie por provincia), más recientes antes. */
let recientes: { generado: string; obs: ObsReciente[] } | null | undefined;
export function recientesLugar(l: LugarFauna, margenKm = 5): ObsReciente[] {
  if (recientes === undefined) recientes = leerDatos<{ generado: string; obs: ObsReciente[] }>("espana_recientes.json");
  return (recientes?.obs ?? [])
    .filter((o) => distanciaKm(l, o) <= l.r + margenKm)
    .sort((a, b) => b.f.localeCompare(a.f));
}
