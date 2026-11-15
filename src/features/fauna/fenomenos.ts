// Fenómenos de fauna cerca de un lugar o de una especie: la berrea, las grullas, el paso del Estrecho… Desde la
// spec 014 no hay lista propia: son los eventos de fauna de `eventos.json` (escritos a mano en
// rasante/recursos/eventos_naturaleza.csv). Puro: el servidor pasa la lista (eventoFauna.ts) y aquí solo se filtra,
// para que también lo usen los componentes de cliente. Las especies sensibles (lince, oso) van solo por zona.
import type { EventoNaturaleza } from "@/features/eventos/modelo";

/** Última revisión a mano de los eventos de fauna del CSV (fechas, lugares y fuentes): la vigila
 * .github/scripts/revision_datos.py, que avisa al año. */
export const REVISADO_FENOMENOS = "15-11-2026";

export interface Fenomeno {
  id: string;
  titulo: string;
  descripcion: string;
  /** centro de la zona y su radio */
  lat: number;
  lon: number;
  radioKm: number;
  /** meses 1-12 */
  meses: number[];
  pico?: number[];
  /** nombre científico, para «¿Dónde veo…?» */
  especie?: string;
  /** aves que entran y salen de un dormidero: se dan la salida y la puesta del sol del mes */
  dormidero?: string;
  fuentes: string[];
}

/** Un evento de fauna visto como fenómeno (meses en vez de fechas, un solo texto). */
export function fenomenoDe(e: EventoNaturaleza): Fenomeno {
  const meses: number[] = [];
  const fin = Number(e.hasta.slice(0, 2));
  for (let m = Number(e.desde.slice(0, 2)); ; m = (m % 12) + 1) {
    meses.push(m);
    if (m === fin) break;
  }
  return {
    id: e.id,
    titulo: e.nombre,
    descripcion: `${e.descripcion} ${e.consejo}`,
    lat: e.lat,
    lon: e.lon,
    radioKm: e.radio_km,
    meses,
    pico: [Number(e.pico.slice(0, 2))],
    especie: e.especie ?? undefined,
    dormidero: e.dormidero ?? undefined,
    fuentes: e.fuentes ?? [],
  };
}

const RADIO_TIERRA = 6371;
function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2;
  const y = Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(x + y));
}

/** Fenómenos cuya zona toca el círculo (lat, lon, radio); con `mes` (1-12), solo los de ese mes. */
export function fenomenosCerca(lista: Fenomeno[], lat: number, lon: number, radioKm = 0, mes?: number): Fenomeno[] {
  return lista.filter(
    (f) => km({ lat, lon }, f) <= f.radioKm + radioKm && (mes === undefined || f.meses.includes(mes)),
  );
}

/** Fenómenos de una especie (por nombre científico, sin subespecie). */
export function fenomenosDe(lista: Fenomeno[], cientifico: string | null | undefined): Fenomeno[] {
  if (!cientifico) return [];
  const sp = cientifico.split(" ").slice(0, 2).join(" ");
  return lista.filter((f) => f.especie === sp);
}
