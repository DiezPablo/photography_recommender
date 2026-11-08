// Safaris en todo el mundo: parques curados a mano y enriquecidos con iNaturalist, Wikidata, NASA POWER y OSM.
// Servidor y navegador.

export interface FotoSafari {
  url: string;
  autor: string | null;
  licencia: string | null;
  web?: string | null;
  /** punto focal al recortar (object-position), en las fotos elegidas a mano */
  posicion?: string;
}

export interface TaxonSafari {
  taxon: number;
  cientifico: string;
  nombre: string | null;
  grupo: string | null;
  foto: FotoSafari | null;
  /** observaciones verificables en iNaturalist alrededor del parque */
  n?: number;
}

export interface Alojamiento {
  nombre: string;
  tipo: string;
  lat: number;
  lon: number;
  web: string | null;
  telefono: string | null;
  estrellas: string | null;
  osm: string;
}

export interface Parque {
  id: string;
  nombre: string;
  pais: string;
  continente: string;
  wikidata: string | null;
  lat: number;
  lon: number;
  radio_km: number;
  tipos: string[];
  /** meses recomendados (1-12), escritos a mano */
  meses: number[];
  /** taxones de iNaturalist de sus especies estrella */
  estrella: number[];
  tasa: string | null;
  consejo: string;
  web?: string;
  es?: string;
  foto?: FotoSafari | null;
  especies?: Record<string, TaxonSafari[]>;
  conteo_estrella?: Record<string, number>;
  /** frecuencia de avistamientos por mes (‰ de las observaciones de su grupo; safari/frecuencia.py), por taxón */
  frecuencia?: Record<string, (number | null)[]>;
  /** tamaño de muestra de cada mes (fotos de su grupo, con los meses vecinos), por taxón */
  muestra?: Record<string, number[]>;
  /** observaciones de mamíferos por mes, 0-100 (null si hay muy pocas) */
  meses_mamiferos?: number[] | null;
  observaciones?: number;
  clima?: { lluvia_mm: number[]; tmax: (number | null)[] };
  alojamientos?: Alojamiento[];
  /** la foto más votada de cada especie estrella hecha en el propio parque (T20), por taxón */
  fotos_estrella?: Record<string, FotoSafari & { obs?: number }>;
  /** fotos más votadas de mamíferos y aves hechas en el parque, una por especie */
  galeria?: (FotoSafari & { obs?: number; taxon: number; cientifico: string; nombre: string | null })[];
}

export interface EspecieSafari extends TaxonSafari {
  parques: { id: string; n: number }[];
}

export interface Safaris {
  generado: string;
  fuentes: Record<string, string>;
  parques: Parque[];
  especies: EspecieSafari[];
}

export interface Recientes {
  fecha: string;
  desde: string;
  parques: Record<
    string,
    {
      estrella: Record<string, number>;
      mamiferos: { taxon: number; cientifico: string; nombre: string | null; n: number }[];
      observaciones: number;
    }
  >;
}

export const CONTINENTES = ["África", "Asia", "América", "Oceanía", "Europa"] as const;

export const TEXTO_TIPO: Record<string, string> = {
  "4x4": "En 4x4 con guía",
  "a pie": "A pie",
  "en coche propio": "En coche propio",
  globo: "En globo",
  barco: "En barco",
  canoa: "En canoa",
  primates: "Seguimiento de primates",
  nocturno: "Nocturno",
  buceo: "Buceo",
  autobús: "En autobús",
  avioneta: "En avioneta",
  "vehículo de tundra": "En vehículo de tundra",
};

export function nombreTaxon(t: Pick<TaxonSafari, "nombre" | "cientifico">): string {
  return t.nombre ?? t.cientifico;
}

/** Identificador legible para la URL de una especie: «panthera-leo». */
export function slugEspecie(t: Pick<TaxonSafari, "cientifico">): string {
  return t.cientifico.toLowerCase().replace(/[^a-z]+/g, "-");
}

export function enTemporada(p: Pick<Parque, "meses">, mes: number): boolean {
  return p.meses.includes(mes + 1);
}

/**
 * Orden de «mejor ahora»: primero los parques en temporada, luego los que más especies estrella han tenido
 * en los últimos 30 días (si hay datos recientes) o en total.
 */
export function puntuacionAhora(p: Parque, mes: number, recientes?: Recientes | null): number {
  const r = recientes?.parques[p.id];
  const vistas = r
    ? Object.values(r.estrella).reduce((a, b) => a + b, 0)
    : Object.values(p.conteo_estrella ?? {}).reduce((a, b) => a + b, 0) / 50;
  return (enTemporada(p, mes) ? 1000 : 0) + Math.min(999, vistas);
}

/**
 * Enlace de Google Maps para leer reseñas (no hay reseñas abiertas y gratuitas): la búsqueda del nombre centrada
 * en el sitio. Con «nombre lat,lon» en la consulta Google no encontraba nada.
 */
export function enlaceResenas(a: Pick<Alojamiento, "nombre" | "lat" | "lon">): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(a.nombre)}/@${a.lat},${a.lon},13z`;
}

/** Web de OSM con esquema: «www.lodge.com» sin «https://» era un enlace relativo que no llevaba a ningún sitio. */
export function urlWeb(v: string | null | undefined): string | null {
  if (!v) return null;
  const u = v.split(";")[0].trim();
  if (!u || u.includes(" ") || !u.includes(".")) return null;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

// ---- Todos los parques del mundo (Wikidata + GBIF + OurAirports + NASA + OSM)

export interface LugarOsm {
  nombre: string;
  lat: number;
  lon: number;
  km: number;
  web?: string | null;
  telefono?: string | null;
  email?: string | null;
  osm?: string;
  tipo?: string;
  poblacion?: string | null;
}

export interface Llegar {
  aeropuertos: {
    nombre: string;
    iata: string;
    ciudad: string | null;
    km: number;
    internacional: boolean;
    lat?: number;
    lon?: number;
  }[];
  pistas: { nombre: string; km: number }[];
  n_pistas: number;
}

export interface ParqueMundo {
  id: string;
  /** el id con el Q de Wikidata que tenía antes de las URLs limpias (T05), para redirigir */
  id_antiguo?: string;
  qid: string | null;
  nombre: string;
  clase: string;
  pais: string | null;
  lat: number;
  lon: number;
  radio_km: number;
  area_km2: number | null;
  iucn: string | null;
  unesco: boolean;
  wdpa: string | null;
  web: string | null;
  wiki: string | null;
  foto: FotoSafari | null;
  destacado: boolean;
  obs: number;
  n_mamiferos: number;
  /** [clave de GBIF, observaciones] */
  mamiferos: [number, number][];
  aves: [number, number][];
  estrella: Record<string, number>;
  /** observaciones de mamíferos por mes (GBIF) */
  meses: number[];
  lluvia_mm: number[] | null;
  meses_secos: number[];
  epoca?: { meses: number[]; motivo: MotivoEpoca | null };
  puntuacion: number;
  /** A destacados, B destinos de fauna, C el resto (safari.refinar); falta en datos anteriores */
  nivel?: Nivel;
  /** país y continente del catálogo curado, si Wikidata no los da */
  pais_nombre?: string;
  continente?: string;
  llegar: Llegar;
  osm?: { alojamientos: LugarOsm[]; operadores: LugarOsm[]; puertas: LugarOsm[]; pueblos: LugarOsm[] };
  /** agencias y operadores de la ciudad del aeropuerto de acceso (OSM) */
  operadores_ciudad?: { ciudad: string; lista: (LugarOsm & { safari: boolean })[] };
  /** ciudad desde la que se organiza (la de los operadores), aunque OSM no tenga ninguno */
  acceso?: { ciudad: string; lat: number; lon: number };
}

export interface Pais {
  nombre: string | null;
  /** código ISO 3166-1 alfa-2 */
  iso?: string | null;
  continente: string | null;
  moneda: string | null;
  idiomas: string[];
}

export interface Mundo {
  generado: string;
  fuentes: Record<string, string>;
  paises: Record<string, Pais>;
  /** clave de GBIF → nombre científico y común */
  especies: Record<string, { c: string | null; n: string | null }>;
  /** clave de GBIF de las especies estrella → nombre científico del catálogo */
  estrella: Record<string, string>;
  parques: ParqueMundo[];
}

/** Fila del índice ligero que carga el buscador en el navegador. */
export interface FilaIndice {
  id: string;
  n: string;
  p: string | null;
  c: string | null;
  la: number;
  lo: number;
  r: number;
  s: number;
  m: number;
  e: number[];
  sec: number[];
  d: boolean;
  f: string | null;
  /** temporada recomendada (solo los destacados), meses 1-12 */
  t?: number[];
  /** mejor época de todos los parques (meses 1-12) y de dónde sale */
  ep?: number[];
  em?: MotivoEpoca | null;
  /** A destacados, B destinos de fauna, C el resto de espacios protegidos (ocultos por defecto) */
  nv?: Nivel;
}

export type Nivel = "A" | "B" | "C";

/** Los de nivel C (espacios protegidos con poca fauna emblemática) no se proponen salvo que se busquen. */
export function esDestino(f: Pick<FilaIndice, "nv">): boolean {
  return f.nv !== "C";
}

/** Parques que caben en el comparador. */
export const MAX_COMPARAR = 4;

export type MotivoEpoca = "recomendada" | "estación seca" | "menos lluvia" | "más avistamientos";

export const TEXTO_MOTIVO: Record<MotivoEpoca, string> = {
  recomendada: "Temporada recomendada",
  "estación seca": "Estación seca, la mejor para ver fauna en los trópicos",
  "menos lluvia": "Los meses menos lluviosos (no hay estación seca)",
  "más avistamientos": "Los meses con más mamíferos observados",
};

export const CLASE: Record<string, string> = {
  "parque nacional": "Parque nacional",
  "reserva de caza": "Reserva de caza",
  "refugio de fauna": "Refugio de fauna",
  "reserva de fauna": "Reserva de fauna",
  "área de gestión de fauna": "Área de gestión de fauna",
  "área de conservación": "Área de conservación",
  "reserva de la biosfera": "Reserva de la biosfera",
  "área protegida": "Área protegida",
  "reserva natural": "Reserva natural",
};

/** «Los meses con más avistamientos» solo valen si forman una estación: de 2 a 6 meses en 1 o 2 tramos. En
 * parques templados con observaciones repartidas salían cosas como «enero» o «mar-may, sep-dic» (ruido). */
export function estacionClara(meses: number[]): boolean {
  const si = new Set(meses);
  const tramos = meses.filter((m) => !si.has(m === 1 ? 12 : m - 1)).length || 1;
  return meses.length >= 2 && meses.length <= 6 && tramos <= 2;
}

/** Buena época: la calculada para cada parque; en datos antiguos, la temporada escrita a mano o los meses secos. */
export function buenaEpoca(f: Pick<FilaIndice, "t" | "sec" | "la" | "ep" | "em">): number[] | null {
  if (f.ep?.length) return f.em === "más avistamientos" && !estacionClara(f.ep) ? null : f.ep;
  if (f.t?.length) return f.t;
  if (Math.abs(f.la) <= 23.5 && f.sec.length > 0 && f.sec.length < 12) return f.sec;
  return null;
}

/** «Oso Pardo» → «Oso pardo» (los nombres comunes de GBIF e iNaturalist mezclan mayúsculas). */
export function capitalizar(nombre: string): string {
  return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
}

export function nombreEspecieMundo(m: Pick<Mundo, "especies">, clave: number | string, reglas?: ReglasNombres): string {
  const e = m.especies[String(clave)];
  if (reglas) return nombreComunCon(e?.c, e?.n, reglas) ?? e?.c ?? "Especie sin nombre común";
  return e?.n ? limpiarNombre(e.n) : (e?.c ?? "Especie sin nombre común");
}

/** Erratas frecuentes en los nombres comunes en español de GBIF: «Damán de el cabo», «Facόquero» (con una ó
 * griega), «Bífalo africano», «Equidna de hocico corto equidna australiano». */
export function limpiarNombre(n: string): string {
  return n
    .normalize("NFC")
    .replace(/ό/g, "ó")
    .replace(/ά/g, "á")
    .replace(/έ/g, "é")
    .replace(/ί/g, "í")
    .replace(/ύ/g, "ú")
    .replace(/\bde el\b/gi, "del")
    .replace(/\bde de\b/gi, "de")
    .replace(/^Bífalo\b/, "Búfalo")
    .replace(/Facóqero/g, "Facóquero")
    .replace(/^Equidna de hocico corto.*$/, "Equidna de hocico corto")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- Frecuencia de avistamientos (‰ de las fotos de su grupo ese mes): niveles para la web

export interface NivelFrecuencia {
  clave: "muy-frecuente" | "frecuente" | "ocasional" | "escaso" | "raro" | "sin-datos";
  texto: string;
}

/** Umbrales calibrados con el Mara y Kruger: el león es ~100 ‰, el leopardo 20-50 ‰, el rinoceronte negro ~10 ‰. */
export function nivelFrecuencia(permil: number | null | undefined): NivelFrecuencia {
  if (permil === null || permil === undefined) return { clave: "sin-datos", texto: "sin datos" };
  if (permil >= 50) return { clave: "muy-frecuente", texto: "muy frecuente" };
  if (permil >= 20) return { clave: "frecuente", texto: "frecuente" };
  if (permil >= 5) return { clave: "ocasional", texto: "ocasional" };
  if (permil >= 1) return { clave: "escaso", texto: "escaso" };
  return { clave: "raro", texto: "raro" };
}

/** La palabra y la cifra (decisión de la auditoría, 08-11-2026): «frecuente (32 ‰)». La palabra se lee rápido; la
 * cifra recuerda que es lo que se registra (‰ de su grupo), no la probabilidad de verla. */
export function textoFrecuencia(permil: number | null | undefined): string {
  const n = nivelFrecuencia(permil);
  return permil === null || permil === undefined ? n.texto : `${n.texto} (${Math.round(permil)} ‰)`;
}

/** «Sudáfrica» → «sudafrica»: para direcciones como /safari-en/sudafrica. */
export function slugTexto(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Países de un parque del catálogo («Sudáfrica y Botsuana» → los dos). */
export function paisesDe(p: Pick<Parque, "pais">): string[] {
  return p.pais.split(" y ");
}

// ---- Confianza: cuántas fotos del grupo hay detrás de cada nivel

export interface Confianza {
  clave: "alta" | "media" | "baja";
  texto: string;
}

/** Con menos de 30 fotos del grupo no se da nivel (safari/frecuencia.py); de 30 a 99, confianza baja. */
export function confianza(n: number | null | undefined): Confianza | null {
  if (n === null || n === undefined || n < 30) return null;
  if (n >= 300) return { clave: "alta", texto: "confianza alta" };
  if (n >= 100) return { clave: "media", texto: "confianza media" };
  return { clave: "baja", texto: "confianza baja" };
}

// Dominios de autoridades gestoras (gobiernos, servicios de parques, ONG que gestionan el parque por contrato)
const AUTORIDADES =
  /(\.gov(\.[a-z]{2})?|\.gob\.[a-z]{2}|\.go\.[a-z]{2}|\.gouv\.[a-z]{2}|nps\.gov|parcs\.canada\.ca|sanparks\.org|kznwildlife\.com|parksnorthwest\.co\.za|ugandawildlife\.org|visitrwanda\.com|akagera\.org|africanparks\.org|gorongosa\.org|zimparks\.org\.zw|conaf\.cl|parksaustralia\.gov\.au)$/i;

/** «Web oficial» solo si el dominio es de la autoridad que gestiona el parque; si no, «Más información». */
export function etiquetaWeb(url: string | null | undefined): string {
  if (!url) return "Más información";
  try {
    return AUTORIDADES.test(new URL(url).hostname.replace(/\.$/, "")) ? "Web oficial" : "Más información";
  } catch {
    return "Más información";
  }
}

/** Reglas de nombres comunes (safari/recursos/nombres_safari.csv y nombres_propios.txt, las mismas del pipeline). */
export interface ReglasNombres {
  diccionario: Record<string, string>;
  propios: string[];
}

/** El nombre común que se enseña: el del diccionario o el bruto limpio (sin guion blando, «de el» → «del»,
 * mayúscula solo en la inicial y en los nombres propios). null si no hay o es el científico. */
export function nombreComunCon(
  cientifico: string | null | undefined,
  bruto: string | null | undefined,
  reglas: ReglasNombres,
): string | null {
  if (cientifico) {
    const sp = cientifico.split(" ").slice(0, 2).join(" ");
    const d = reglas.diccionario[cientifico] ?? reglas.diccionario[sp];
    if (d) return d;
  }
  if (!bruto) return null;
  const limpio = limpiarNombre(bruto.replace(/­/g, "").replace(/\s+/g, " ").trim());
  if (!limpio || (cientifico && limpio.toLowerCase() === cientifico.toLowerCase())) return null;
  const propios = new Set(reglas.propios);
  const texto = limpio
    .split(" ")
    .map((w, i) =>
      i === 0
        ? w
        : w
            .split("-")
            .map((x) =>
              propios.has(x) || propios.has(x[0]?.toUpperCase() + x.slice(1).toLowerCase()) ? x : x.toLowerCase(),
            )
            .join("-"),
    )
    .join(" ")
    .replace(/\bde El\b(?! [A-ZÁÉÍÓÚ])/g, "de el")
    .replace(/\bde el\b/g, "del");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Nombre corto de un aeropuerto, el suyo y no el de la ciudad que da OurAirports: el de Kilimanjaro (JRO) figura
 * en «Arusha», y eso hacía leer «Arusha (JRO)» cuando Arusha tiene su propio aeropuerto (ARK). */
export function nombreAeropuerto(a: { nombre: string; ciudad: string | null }): string {
  const corto = a.nombre
    .replace(/\b(International|Regional|Domestic)\b/gi, "")
    .replace(/\b(Airport|Airfield|Aerodrome|Airstrip)\b/gi, "")
    .replace(/\b(Aeropuerto|Aeroporto|Aéroport)( Internacional| International| Internacional de| de)?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return corto || a.ciudad || a.nombre;
}
