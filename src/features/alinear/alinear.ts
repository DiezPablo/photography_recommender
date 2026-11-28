// La consulta de «La luna o la Vía Láctea sobre un objeto» (specs 025 y 026), siempre en la URL de /luz/alinear: qué
// astro (`astro=luna|via`), el punto (como se copia de cualquier mapa, «40.4773, -3.6874»), la altura del objeto, el
// desnivel y desde cuándo. Puro: lo usan la página y las pruebas.

export type Astro = "luna" | "via";

export interface ConsultaAlinear {
  astro: Astro;
  /** el texto tal cual, para volver a rellenar el formulario */
  punto: string;
  nombre: string;
  lat: number | null;
  lon: number | null;
  altura: number | null;
  desnivel: number;
  /** AAAA-MM-DD */
  desde: string;
  /** qué falla, si algo falla (null si no se ha pedido nada o está bien) */
  error: string | null;
}

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

export const EJEMPLO = { nombre: "Cuatro Torres (Madrid)", punto: "40.4773, -3.6874", altura: 249, desnivel: 90 };
/** un cielo de Bortle 2 (reserva Starlight de La Palma) */
export const EJEMPLO_VIA = {
  astro: "via" as const,
  nombre: "el faro de Fuencaliente",
  punto: "28.45528, -17.84341",
  altura: 24,
};

/** Dos números separados por coma, espacio o punto y coma; acepta la coma decimal si van con «;». */
export function leerPunto(texto: string): { lat: number; lon: number } | null {
  const t = texto.replace(/[°ºNnEe]/g, "").trim();
  const partes = t.includes(";") ? t.split(";").map((x) => x.replace(",", ".")) : t.split(/[\s,]+/);
  const nums = partes.map((x) => Number(x.trim())).filter((x, i) => partes[i].trim() !== "");
  if (nums.length !== 2 || nums.some((x) => !Number.isFinite(x))) return null;
  return { lat: nums[0], lon: nums[1] };
}

const enEspana = (lat: number, lon: number) => lat > 27 && lat < 44.5 && lon > -19 && lon < 5;

export function leerAlinear(q: Params, hoy = new Date()): ConsultaAlinear {
  const punto = uno(q.punto);
  const nombre = uno(q.nombre).slice(0, 80);
  const textoAltura = uno(q.altura).replace(",", ".");
  const altura = Number(textoAltura);
  const desnivel = Number(uno(q.desnivel).replace(",", ".") || 0);
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(uno(q.desde)) ? uno(q.desde) : hoy.toISOString().slice(0, 10);
  const astro: Astro = uno(q.astro) === "via" ? "via" : "luna";
  const base = { astro, punto, nombre, lat: null, lon: null, altura: null, desnivel: 0, desde, error: null };
  if (!punto && !textoAltura) return base;
  const p = leerPunto(punto);
  if (!p)
    return { ...base, error: "No entiendo las coordenadas. Pégalas como «40.4773, -3.6874» (latitud, longitud)." };
  if (!enEspana(p.lat, p.lon)) return { ...base, error: "Ese punto no está en España." };
  if (!(altura >= 5 && altura <= 1000))
    return { ...base, error: "La altura del objeto tiene que estar entre 5 y 1000 metros." };
  if (!Number.isFinite(desnivel) || desnivel < -500 || desnivel > 1500)
    return { ...base, error: "El desnivel tiene que estar entre −500 y 1500 metros." };
  return { ...base, lat: p.lat, lon: p.lon, altura, desnivel: Math.round(desnivel) };
}

export function urlAlinear(c: {
  astro?: Astro;
  punto: string;
  altura: number;
  desnivel?: number;
  nombre?: string;
  desde?: string;
}) {
  const q = new URLSearchParams();
  if (c.astro === "via") q.set("astro", "via");
  if (c.nombre) q.set("nombre", c.nombre);
  q.set("punto", c.punto);
  q.set("altura", String(c.altura));
  if (c.desnivel) q.set("desnivel", String(c.desnivel));
  if (c.desde) q.set("desde", c.desde);
  return `/luz/alinear?${q.toString()}`;
}
