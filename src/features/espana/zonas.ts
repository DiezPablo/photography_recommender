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
  especies: Record<string, { c: string | null; n: string | null; clase?: string }>;
  cita: string | null;
}
