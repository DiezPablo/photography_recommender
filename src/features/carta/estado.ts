// Estado de la carta en la URL, para que cada pregunta se pueda hacer sola y compartir: qué especie, qué mes, qué día
// (para la luz y el tiempo), qué cuadrícula está elegida, dónde mira el mapa y qué capas están encendidas.
import { MESES, mesDeParametro } from "@/lib/fechas";

export type Capa = "fauna" | "fiabilidad" | "luz" | "lugares";
export const CAPAS: Capa[] = ["fauna", "fiabilidad", "luz", "lugares"];

export interface EstadoCarta {
  /** clave de GBIF de la especie elegida */
  especie: string | null;
  /** 0-11 */
  mes: number;
  /** AAAA-MM-DD: el día para la luz y la previsión */
  fecha: string;
  /** cuadrícula elegida, «10kmE335N206» */
  celda: string | null;
  centro: [number, number] | null;
  zoom: number | null;
  apagadas: Capa[];
}

export function leerEstado(q: URLSearchParams, hoy: string): EstadoCarta {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(q.get("fecha") ?? "") ? q.get("fecha")! : hoy;
  const mes = mesDeParametro(q.get("mes")) ?? Number(fecha.slice(5, 7)) - 1;
  // «c=40.980,-1.500»: no se usan lat y lon, que en los enlaces antiguos abren «Cerca de mí»
  const [lat, lon] = (q.get("c") ?? "").split(",").map(Number);
  const centro: [number, number] | null =
    q.has("c") && Number.isFinite(lat) && Number.isFinite(lon) && lat > 26 && lat < 45 && lon > -20 && lon < 6
      ? [lat, lon]
      : null;
  const z = Number(q.get("z"));
  const apagadas = (q.get("sin") ?? "").split(",").filter((c): c is Capa => (CAPAS as string[]).includes(c));
  return {
    especie: /^\d+$/.test(q.get("especie") ?? "") ? q.get("especie") : null,
    mes,
    fecha,
    celda: /^10kmE\d+N\d+$/.test(q.get("celda") ?? "") ? q.get("celda") : null,
    centro,
    zoom: Number.isFinite(z) && z >= 3 && z <= 18 ? z : null,
    apagadas,
  };
}

/** Los parámetros de la URL para un estado (los que valen lo de por defecto no se escriben). */
export function parametros(e: EstadoCarta, hoy: string): Record<string, string | null> {
  return {
    especie: e.especie,
    mes: e.mes === Number(e.fecha.slice(5, 7)) - 1 ? null : MESES[e.mes],
    fecha: e.fecha === hoy ? null : e.fecha,
    celda: e.celda,
    c: e.centro ? `${e.centro[0].toFixed(3)},${e.centro[1].toFixed(3)}` : null,
    z: e.zoom ? String(e.zoom) : null,
    sin: e.apagadas.length ? e.apagadas.join(",") : null,
  };
}

/** Fiabilidad del dato según la muestra (observaciones de su grupo con los meses vecinos): los mismos umbrales que
 * el pipeline (safari/espana/estacionalidad.py). */
export type Fiabilidad = "solida" | "media" | "poca" | "ninguna";
export function fiabilidad(muestra: number | null | undefined): Fiabilidad {
  if (!muestra || muestra < 30) return "ninguna";
  if (muestra >= 300) return "solida";
  if (muestra >= 100) return "media";
  return "poca";
}
export const TEXTO_FIABILIDAD: Record<Fiabilidad, string> = {
  solida: "dato sólido",
  media: "dato medio",
  poca: "poca muestra",
  ninguna: "sin muestra suficiente",
};
