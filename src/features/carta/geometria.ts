// Geometría de la carta: las cuadrículas de 10 km de la EEA (EPSG:3035) como polígonos en lat/lon, y un punto a una
// distancia y un rumbo (para dibujar la dirección del sol).
import { laeaInversa } from "@/lib/rejilla";

/** Las cuatro esquinas de una cuadrícula «10kmE335N206» en [lat, lon]. */
export function esquinas(codigo: string): [number, number][] {
  const m = codigo.match(/^10kmE(\d+)N(\d+)$/);
  if (!m) return [];
  const e = Number(m[1]) * 10000;
  const n = Number(m[2]) * 10000;
  return [laeaInversa(e, n), laeaInversa(e + 10000, n), laeaInversa(e + 10000, n + 10000), laeaInversa(e, n + 10000)];
}

/** Punto a `km` de (lat, lon) con rumbo `grados` desde el norte (aproximación esférica, de sobra a esta escala). */
export function destino(lat: number, lon: number, grados: number, km: number): [number, number] {
  const r = Math.PI / 180;
  const d = km / 6371;
  const la1 = lat * r;
  const lo1 = lon * r;
  const b = grados * r;
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(b));
  const lo2 = lo1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return [la2 / r, lo2 / r];
}
