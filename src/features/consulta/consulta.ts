// La consulta común de Rasante (spec 012): cuándo, dónde y qué, siempre en la URL de /buscar, para que cualquier
// resultado se pueda compartir y funcione sin JavaScript. Puro: lo usan el servidor y el formulario.
import { MESES } from "@/lib/fechas";

export type Que = "luz" | "fauna";
export type Momento = "todos" | "amanecer" | "atardecer" | "noche";

export interface Consulta {
  /** «hoy», «manana», «finde», una fecha AAAA-MM-DD o un mes («octubre») */
  cuando: string;
  que: Que;
  momento: Momento;
  /** comunidad autónoma (nombre como en los datos) o, si hay punto, nada */
  ccaa: string | null;
  lat: number | null;
  lon: number | null;
  /** radio alrededor del punto */
  km: number;
}

export const RADIOS = [25, 50, 100, 200];
export const MOMENTOS: [Momento, string][] = [
  ["todos", "Lo mejor del día"],
  ["amanecer", "Amanecer"],
  ["atardecer", "Atardecer"],
  ["noche", "Noche"],
];

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function leerConsulta(q: Params): Consulta {
  const cuando = uno(q.cuando).toLowerCase();
  const valido =
    ["hoy", "manana", "finde"].includes(cuando) || /^\d{4}-\d{2}-\d{2}$/.test(cuando) || MESES.includes(cuando);
  const lat = Number(uno(q.lat));
  const lon = Number(uno(q.lon));
  const conPunto = uno(q.lat) !== "" && Number.isFinite(lat) && Number.isFinite(lon) && lat > 27 && lat < 44.5;
  const km = Number(uno(q.km));
  const momento = uno(q.momento) as Momento;
  return {
    cuando: valido ? cuando : "hoy",
    que: uno(q.que) === "fauna" ? "fauna" : "luz",
    momento: MOMENTOS.some(([m]) => m === momento) ? momento : "todos",
    ccaa: conPunto ? null : uno(q.ccaa) || null,
    lat: conPunto ? Math.round(lat * 1000) / 1000 : null,
    lon: conPunto ? Math.round(lon * 1000) / 1000 : null,
    km: RADIOS.includes(km) ? km : 100,
  };
}

/** La URL de una consulta, con lo que cambie. Solo lleva lo que no es el valor por defecto. */
export function urlConsulta(c: Consulta, cambios: Partial<Consulta> = {}): string {
  const x = { ...c, ...cambios };
  const p = new URLSearchParams();
  p.set("cuando", x.cuando);
  p.set("que", x.que);
  if (x.momento !== "todos") p.set("momento", x.momento);
  if (x.lat !== null && x.lon !== null) {
    p.set("lat", String(x.lat));
    p.set("lon", String(x.lon));
    p.set("km", String(x.km));
  } else if (x.ccaa) p.set("ccaa", x.ccaa);
  return `/buscar?${p.toString()}`;
}
