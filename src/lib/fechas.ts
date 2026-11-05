// Meses y distancias: utilidades puras que usan servidor y navegador.

export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export const INICIALES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Distancia en línea recta (km) entre dos puntos. */
export function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Meses (1-12) en tramos seguidos, contando el paso de diciembre a enero: [6,7,8,9,10] → «jun-oct»,
 * [12,1,2,6,7] → «jun-jul, dic-feb». */
export function rangoMeses(meses: number[]): string {
  if (meses.length >= 12) return "todo el año";
  const si = new Set(meses);
  if (!si.size) return "";
  const corto = (m: number) => MESES[m - 1].slice(0, 3);
  // empezar en un mes que abra tramo (el anterior no está), para no partir el de diciembre-enero
  const inicio = [...si].sort((a, b) => a - b).find((m) => !si.has(m === 1 ? 12 : m - 1)) ?? 1;
  const tramos: string[] = [];
  let desde: number | null = null;
  for (let i = 0; i < 12; i++) {
    const m = ((inicio - 1 + i) % 12) + 1;
    const siguiente = (m % 12) + 1;
    if (si.has(m) && desde === null) desde = m;
    if (si.has(m) && !si.has(siguiente)) {
      tramos.push(desde === m ? corto(m) : `${corto(desde!)}-${corto(m)}`);
      desde = null;
    }
  }
  return tramos.join(", ");
}

/** Mes de un parámetro de URL: «marzo», «Marzo» o «2» → 2 (0-11); cualquier otra cosa → null. */
export function mesDeParametro(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const i = MESES.indexOf(v.toLowerCase());
  if (i >= 0) return i;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < 12 ? n : null;
}
