// Zonas de España para empezar (las de prueba de la especificación; safari/espana/zonas.py tiene las mismas).
export interface ZonaEspana {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  radioKm: number;
}

export const ZONAS_ESPANA: ZonaEspana[] = [
  { id: "donana", nombre: "Doñana", lat: 37.0, lon: -6.45, radioKm: 20 },
  { id: "gredos", nombre: "Sierra de Gredos", lat: 40.26, lon: -5.2, radioKm: 15 },
  { id: "picos", nombre: "Picos de Europa", lat: 43.2, lon: -4.85, radioKm: 20 },
  { id: "gallocanta", nombre: "Laguna de Gallocanta", lat: 40.98, lon: -1.5, radioKm: 10 },
];

/** Lo que devuelve /espana/datos/[bloque]: las celdas de un bloque de 100 km y los nombres de sus especies. */
export interface BloqueEspana {
  celdas: Record<string, { m: Record<string, number[]>; e: Record<string, (number | null)[]> }>;
  especies: Record<string, EspecieEspana>;
  cita: string | null;
  /** aves vistas en los últimos 30 días en el bloque (eBird); null si aún no hay datos */
  recientes?: { generado: string; obs: ObsReciente[] } | null;
}

/** Una observación de eBird: la última de la especie (científico) en su provincia, con fecha y lugar. */
export interface ObsReciente {
  c: string;
  f: string;
  lat: number;
  lon: number;
  l: string | null;
}

/** Un lugar de espana_lugares.json: punto de eBird, espacio protegido u observatorio (r: radio en km; e: especies
 * vistas en eBird, solo en los puntos de eBird). */
export interface LugarFauna {
  id: string;
  n: string;
  t: string;
  lat: number;
  lon: number;
  r: number;
  e?: number | null;
}

/** Nombres de una especie en espana.json; `estado`: «invasora» (Catálogo español de especies exóticas invasoras) o
 * «aviso» (con `nota`, p. ej. el lobo, que en GBIF va junto con los perros). Las domésticas no llegan. */
export interface EspecieEspana {
  c: string | null;
  n: string | null;
  clase?: string | null;
  estado?: "invasora" | "aviso";
  nota?: string | null;
}

/** La etiqueta junto al nombre: «invasora» o el aviso. */
export function etiquetaEstado(e: Pick<EspecieEspana, "estado" | "nota"> | undefined): string | null {
  if (e?.estado === "invasora") return "invasora";
  if (e?.estado === "aviso") return e.nota ?? null;
  return null;
}
