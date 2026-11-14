// Lectura de lugares.json (índice común de spots y lugares de fauna, spec 003) en el build: solo servidor.
// Hoy la web solo usa de él la idoneidad de los spots (spec 013); mientras el pipeline no la haya publicado,
// no hay y las páginas que la usan lo dicen.
import "server-only";
import { leerDatos } from "@/lib/datos";

/** Lo que da de sí un spot en cada momento, sin el tiempo (0-10): criterio de orden, no nota validada. */
export interface Idoneidad {
  /** por mes, de enero a diciembre: el sol sale y se pone por un sitio distinto cada mes */
  amanecer: number[];
  atardecer: number[];
  noche: number;
  /** grados de horizonte hacia el sol cada mes y hacia el sur (null sin perfil de relieve) */
  relieve: { amanecer: (number | null)[]; atardecer: (number | null)[]; sur: number | null };
}

export interface LuzLugar {
  cielo_mag: number | null;
  bortle: number | null;
  idoneidad?: Idoneidad;
}

let cache: Map<string, LuzLugar> | undefined;

/** El bloque `luz` de cada spot, por identificador. */
export function luzDeLugares(): Map<string, LuzLugar> {
  if (cache) return cache;
  cache = new Map();
  const doc = leerDatos<{ lugares: { id: string; catalogo: string; luz?: LuzLugar }[] }>("lugares.json");
  for (const l of doc?.lugares ?? []) if (l.catalogo === "luz" && l.luz) cache.set(l.id, l.luz);
  return cache;
}
