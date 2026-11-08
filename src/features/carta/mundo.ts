// Datos de la carta del mundo (solo servidor), de safaris_mundo.json: los mamíferos registrados en cada parque (GBIF,
// todo el año). El pipeline guarda los más registrados de cada parque (12 hasta el 08-11-2026, ahora 40:
// `MAX_MAMIFEROS` en safari/mundo_cli.py), así que una especie sale en los parques donde está en esa lista. La frecuencia es el ‰ de todos los registros de mamíferos del parque (`obs`) que
// son de la especie, y esa es la muestra. No hay frecuencia por mes en los 3400 parques: el mes marca la temporada
// recomendada (época seca o la del catálogo).
import "server-only";
import { cargarMundo, nombreEstrella } from "@/features/safaris/datos";
import { nombreAeropuerto } from "@/features/safaris/modelo";

export interface EspecieMundo {
  k: string;
  n: string | null;
  c: string;
  /** parques donde se ha registrado */
  parques: number;
}

let especies: EspecieMundo[] | undefined;
/** Los mamíferos que están en la lista de algún parque, de más a menos parques. */
export function especiesMundo(): EspecieMundo[] {
  if (especies) return especies;
  const m = cargarMundo();
  if (!m) return [];
  const cuenta = new Map<string, number>();
  for (const p of m.parques) for (const [k] of p.mamiferos) cuenta.set(String(k), (cuenta.get(String(k)) ?? 0) + 1);
  especies = [...cuenta.entries()]
    .filter(([, n]) => n >= 2)
    .map(([k, n]) => {
      const c = m.especies[k]?.c ?? m.estrella[k] ?? k;
      const nombre = nombreEstrella(k);
      return { k, n: nombre === c ? null : nombre, c, parques: n };
    })
    .sort((a, b) => b.parques - a.parques);
  return especies;
}

/** [id, ‰ de los registros de mamíferos del parque, muestra (registros de mamíferos), registros de la especie] */
export type ParqueEspecie = [string, number, number, number];

export function parquesDeEspecie(clave: string): ParqueEspecie[] {
  const m = cargarMundo();
  if (!m) return [];
  const salida: ParqueEspecie[] = [];
  for (const p of m.parques) {
    const fila = p.mamiferos.find(([k]) => String(k) === clave);
    if (!fila) continue;
    const muestra = p.obs;
    if (!muestra) continue;
    salida.push([p.id, Math.round((1000 * fila[1]) / muestra), muestra, fila[1]]);
  }
  return salida;
}

export interface FichaParqueCarta {
  id: string;
  nombre: string;
  pais: string | null;
  clase: string;
  foto: { url: string; web: string | null; autor: string | null; licencia: string | null } | null;
  muestra: number;
  /** los mamíferos más registrados (los 12 primeros): [clave, nombre, registros, ‰] */
  mamiferos: [string, string, number, number][];
  /** registros de mamíferos por mes (GBIF) y lluvia por mes (NASA POWER) */
  meses: number[];
  lluvia: number[] | null;
  /** temporada recomendada (meses 1-12) y de dónde sale */
  epoca: number[];
  motivo: string | null;
  aeropuerto: { nombre: string; iata: string; km: number; internacional: boolean } | null;
  destacado: boolean;
}

export function fichaParque(id: string): FichaParqueCarta | null {
  const m = cargarMundo();
  const p = m?.parques.find((x) => x.id === id);
  if (!m || !p) return null;
  const muestra = p.obs;
  const aeropuertos = [...(p.llegar?.aeropuertos ?? [])].sort((a, b) => a.km - b.km);
  // el más cercano, y si no es internacional, también vale: se dice
  const a = aeropuertos[0];
  return {
    id: p.id,
    nombre: p.nombre,
    pais: p.pais_nombre ?? (p.pais ? (m.paises[p.pais]?.nombre ?? null) : null),
    clase: p.clase,
    foto: p.foto
      ? {
          url: p.foto.url,
          web: p.foto.web ?? null,
          autor: p.foto.autor ?? null,
          licencia: p.foto.licencia ?? null,
        }
      : null,
    muestra,
    mamiferos: [...p.mamiferos]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 12)
      .map(([k, n]) => [String(k), nombreEstrella(k), n, muestra ? Math.round((1000 * n) / muestra) : 0]),
    meses: p.meses,
    lluvia: p.lluvia_mm,
    epoca: p.epoca?.meses ?? p.meses_secos,
    motivo: p.epoca?.motivo ?? (p.meses_secos.length ? "estación seca" : null),
    aeropuerto: a ? { nombre: nombreAeropuerto(a), iata: a.iata, km: a.km, internacional: a.internacional } : null,
    destacado: p.destacado,
  };
}

/** Clave de GBIF de un mamífero del mundo por su nombre científico (para enlazar a la carta), si está en algún parque. */
export function claveMundo(cientifico: string): string | null {
  return especiesMundo().find((e) => e.c === cientifico)?.k ?? null;
}

let maximo: number | undefined;
/** Cuántos mamíferos guarda como mucho cada parque en los datos publicados (para decirlo en la carta). */
export function mamiferosPorParque(): number {
  maximo ??= Math.max(0, ...(cargarMundo()?.parques ?? []).map((p) => p.mamiferos.length));
  return maximo;
}
