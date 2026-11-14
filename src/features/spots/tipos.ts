import type { Momento } from "@/features/spots/modelo";

/** Fila del ranking y punto del mapa: lo mínimo que viaja al navegador. */
export interface FilaRanking {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  tipo: string | null;
  nota: number;
  clase: string;
  /** en «lo habitual» (spec 013) no hay nota: se enseña este texto («38 %») en su lugar */
  cifra?: string;
  momento: Momento;
  hora: string;
  motivos: string[];
  /** fotógrafos distintos en Commons: desempata y da contexto */
  autores: number;
  dudosa: boolean;
  provincia: string | null;
  ccaa: string | null;
  /** miniatura de Commons (la primera foto de la galería) */
  foto: string | null;
}
