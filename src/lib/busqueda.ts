// Búsqueda por texto tolerante a tildes, mayúsculas y erratas (una letra cambiada, de más, de menos o dos letras
// cambiadas de sitio; dos en palabras largas). Pura: la usan el buscador de la cabecera y la página /buscar.

export type TipoResultado = "parque" | "especie" | "pais";

export interface EntradaBusqueda {
  tipo: TipoResultado;
  /** texto principal (nombre del parque, nombre común, país) */
  t: string;
  /** texto secundario que también se busca (país del parque, nombre científico) */
  s?: string;
  href: string;
  /** detalle que se enseña pero no se busca («12 destinos») */
  d?: string;
  /** miniatura (especies) */
  f?: string;
  /** peso: destacados y especies más buscadas primero a igualdad de coincidencia */
  w?: number;
}

export function normal(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distancia de Damerau-Levenshtein (con transposiciones de letras vecinas), cortando si pasa de `max`. */
export function distancia(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let minimo = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + coste);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      minimo = Math.min(minimo, d[i][j]);
    }
    if (minimo > max) return max + 1;
  }
  return d[a.length][b.length];
}

const erratas = (n: number) => (n >= 8 ? 2 : n >= 4 ? 1 : 0);

/** Qué tal casa una palabra buscada con una palabra del texto: 3 igual, 2 empieza por, 1 con erratas, 0 no. */
function casaPalabra(q: string, w: string, ultima: boolean): number {
  if (w === q) return 3;
  // la última palabra se está escribiendo: basta con que empiece así
  if (ultima && w.startsWith(q)) return 2;
  const max = erratas(q.length);
  if (!max) return 0;
  if (distancia(q, w, max) <= max) return 1;
  if (ultima && w.length > q.length && distancia(q, w.slice(0, q.length), max) <= max) return 1;
  return 0;
}

/** Puntuación de una entrada para una búsqueda ya normalizada (0 = no aparece). */
export function puntuar(q: string, e: EntradaBusqueda): number {
  if (!q) return 0;
  const palabras = q.split(" ");
  const textos = [normal(e.t), ...(e.s ? [normal(e.s)] : [])];
  let mejor = 0;
  for (const [i, texto] of textos.entries()) {
    const ws = texto.split(" ");
    let total = 0;
    for (const [k, p] of palabras.entries()) {
      const casa = Math.max(0, ...ws.map((w) => casaPalabra(p, w, k === palabras.length - 1)));
      if (!casa) {
        total = 0;
        break;
      }
      total += casa;
    }
    if (!total) continue;
    // el texto entero empieza por lo buscado: arriba del todo; el principal pesa más que el secundario
    if (texto.startsWith(q)) total += 4;
    mejor = Math.max(mejor, total * (i === 0 ? 1 : 0.8));
  }
  return mejor ? mejor + (e.w ?? 0) : 0;
}

export function buscar(entradas: EntradaBusqueda[], texto: string, n = 8): EntradaBusqueda[] {
  const q = normal(texto);
  if (q.length < 2) return [];
  return entradas
    .map((e) => ({ e, p: puntuar(q, e) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.e.t.localeCompare(b.e.t, "es"))
    .slice(0, n)
    .map((x) => x.e);
}

export const TIPO_TEXTO: Record<TipoResultado, string> = { parque: "Parque", especie: "Animal", pais: "País" };
