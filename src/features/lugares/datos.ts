// Lectura de lugares.json (índice común de spots y lugares de fauna, spec 003) en el build: solo servidor.
// La web usa de él la idoneidad de los spots (spec 013) y los enlaces entre los dos catálogos (`cerca`, spec 010).
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

/** Lo común de un lugar de cualquiera de los dos catálogos (spec 003) y los del otro catálogo que tiene cerca. */
export interface LugarComun {
  id: string;
  catalogo: "luz" | "fauna";
  nombre: string;
  tipo: string;
  lat: number;
  lon: number;
  provincia: string;
  cerca: string[];
  luz?: LuzLugar;
}

let indice: Map<string, LugarComun> | undefined;

/** Todos los lugares de lugares.json por identificador (se lee una vez). */
function lugares(): Map<string, LugarComun> {
  if (indice) return indice;
  indice = new Map();
  for (const l of leerDatos<{ lugares: LugarComun[] }>("lugares.json")?.lugares ?? []) indice.set(l.id, l);
  return indice;
}

/** Los lugares del otro catálogo que un lugar tiene a menos de 15 km: desde un spot, los de fauna que más
 * interesan; desde un lugar de fauna, los spots más cercanos (spec 010). */
export function cercaDe(id: string): LugarComun[] {
  const l = lugares().get(id);
  return (l?.cerca ?? []).map((c) => lugares().get(c)).filter((c): c is LugarComun => !!c);
}

/** El bloque `luz` de cada spot, por identificador. */
let luz: Map<string, LuzLugar> | undefined;
export function luzDeLugares(): Map<string, LuzLugar> {
  if (luz) return luz;
  luz = new Map();
  for (const l of lugares().values()) if (l.catalogo === "luz" && l.luz) luz.set(l.id, l.luz);
  return luz;
}
