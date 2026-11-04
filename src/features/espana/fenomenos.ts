// Calendario de fenómenos de fauna en España, escrito a mano con su fuente: la berrea, las grullas, el paso del
// Estrecho, los flamencos… Sale en la ficha de cada lugar cercano, en «¿Qué veo aquí?» si cae en el mes y en
// «¿Dónde veo…?» de su especie. Las especies sensibles (lince, oso) solo por zona: nunca puntos.
// Revisión anual con .github/scripts/revision_datos.py.

export const REVISADO_FENOMENOS = "04-11-2026";

export interface Fenomeno {
  id: string;
  titulo: string;
  descripcion: string;
  /** centro de la zona y su radio */
  lat: number;
  lon: number;
  radioKm: number;
  /** meses 1-12 */
  meses: number[];
  pico?: number[];
  /** nombre científico, para «¿Dónde veo…?» */
  especie?: string;
  fuentes: string[];
}

const WIKI = "https://es.wikipedia.org/wiki/";

export const FENOMENOS: Fenomeno[] = [
  {
    id: "gallocanta-grullas",
    titulo: "Grullas en Gallocanta",
    descripcion:
      "Decenas de miles de grullas pasan en otoño y a final del invierno, y muchas se quedan a invernar. Al amanecer salen de la laguna a comer y al atardecer vuelven: es el mejor momento, desde los caminos y observatorios del perímetro.",
    lat: 40.98,
    lon: -1.5,
    radioKm: 12,
    meses: [10, 11, 12, 1, 2, 3],
    pico: [11, 2],
    especie: "Grus grus",
    fuentes: [`${WIKI}Laguna_de_Gallocanta`, `${WIKI}Grus_grus`],
  },
  {
    id: "monfrague-berrea",
    titulo: "Berrea del ciervo en Monfragüe",
    descripcion:
      "El celo del ciervo: los machos braman y se enfrentan, sobre todo al amanecer y al atardecer. Se escucha desde los miradores y carreteras del parque; no se sale de los caminos.",
    lat: 39.83,
    lon: -6.03,
    radioKm: 15,
    meses: [9, 10],
    pico: [9],
    especie: "Cervus elaphus",
    fuentes: [`${WIKI}Parque_nacional_de_Monfrag%C3%BCe`, `${WIKI}Berrea`],
  },
  {
    id: "cabaneros-berrea",
    titulo: "Berrea del ciervo en Cabañeros",
    descripcion:
      "La raña de Cabañeros es uno de los mejores sitios de España para ver y oír la berrea; el parque organiza rutas guiadas en la temporada.",
    lat: 39.4,
    lon: -4.48,
    radioKm: 15,
    meses: [9, 10],
    pico: [9],
    especie: "Cervus elaphus",
    fuentes: [`${WIKI}Parque_nacional_de_Caba%C3%B1eros`, `${WIKI}Berrea`],
  },
  {
    id: "estrecho-migracion",
    titulo: "Paso de aves por el Estrecho",
    descripcion:
      "Rapaces y cigüeñas cruzan entre Europa y África por el punto más estrecho: hacia el sur de agosto a octubre (el grueso en septiembre) y de vuelta en primavera. Mejor con viento de poniente, desde los observatorios de Tarifa.",
    lat: 36.03,
    lon: -5.6,
    radioKm: 20,
    meses: [2, 3, 4, 5, 8, 9, 10],
    pico: [9],
    fuentes: ["https://www.fundacionmigres.org/"],
  },
  {
    id: "fuente-de-piedra-flamencos",
    titulo: "Flamencos criando en Fuente de Piedra",
    descripcion:
      "La colonia de cría de flamenco común más importante de la península (cuando la laguna tiene agua). Desde el centro de visitantes y el mirador, sin acercarse a la colonia.",
    lat: 37.11,
    lon: -4.77,
    radioKm: 5,
    meses: [2, 3, 4, 5, 6, 7],
    pico: [4, 5],
    especie: "Phoenicopterus roseus",
    fuentes: [`${WIKI}Laguna_de_Fuente_de_Piedra`],
  },
  {
    id: "gredos-cabra-montes",
    titulo: "Celo de la cabra montés en Gredos",
    descripcion:
      "En noviembre y diciembre los machos bajan a los rebaños de hembras y se enfrentan a cornadas. En la zona de la Plataforma y el circo de Gredos se dejan ver de cerca.",
    lat: 40.26,
    lon: -5.2,
    radioKm: 15,
    meses: [11, 12],
    pico: [11],
    especie: "Capra pyrenaica",
    fuentes: [`${WIKI}Sierra_de_Gredos`],
  },
  {
    id: "andujar-lince",
    titulo: "Lince ibérico en Sierra de Andújar",
    descripcion:
      "En el celo (diciembre-febrero, sobre todo enero) el lince se mueve más y es cuando más se ve, siempre de lejos y desde las pistas públicas. Especie amenazada: aquí solo la zona, sin puntos.",
    lat: 38.2,
    lon: -4.05,
    radioKm: 20,
    meses: [12, 1, 2],
    pico: [1],
    especie: "Lynx pardinus",
    fuentes: [`${WIKI}Parque_natural_de_la_Sierra_de_And%C3%BAjar`],
  },
  {
    id: "somiedo-oso",
    titulo: "Oso pardo en Somiedo",
    descripcion:
      "En primavera (celo) y en otoño (comiendo frutos) es más fácil verlos, a mucha distancia y con telescopio desde los miradores. Especie amenazada: aquí solo la zona.",
    lat: 43.1,
    lon: -6.25,
    radioKm: 15,
    meses: [4, 5, 6, 9, 10],
    pico: [5],
    especie: "Ursus arctos",
    fuentes: [`${WIKI}Parque_natural_de_Somiedo`],
  },
  {
    id: "ebro-invernada",
    titulo: "Invernada en el delta del Ebro",
    descripcion:
      "Decenas de miles de patos, flamencos, garzas y limícolas pasan el invierno en los arrozales inundados y las lagunas del delta.",
    lat: 40.7,
    lon: 0.75,
    radioKm: 15,
    meses: [11, 12, 1, 2],
    fuentes: [`${WIKI}Parque_natural_del_Delta_del_Ebro`],
  },
  {
    id: "donana-invernada",
    titulo: "Invernada en Doñana",
    descripcion:
      "Las marismas reciben en invierno a cientos de miles de ánsares y patos del norte de Europa; con lluvia, la marisma se inunda y se llena de aves.",
    lat: 37.0,
    lon: -6.45,
    radioKm: 25,
    meses: [11, 12, 1, 2],
    fuentes: [`${WIKI}Parque_nacional_y_natural_de_Do%C3%B1ana`],
  },
];

const RADIO_TIERRA = 6371;
function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2;
  const y = Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(x + y));
}

/** Fenómenos cuya zona toca el círculo (lat, lon, radio); con `mes` (1-12), solo los de ese mes. */
export function fenomenosCerca(lat: number, lon: number, radioKm = 0, mes?: number): Fenomeno[] {
  return FENOMENOS.filter(
    (f) => km({ lat, lon }, f) <= f.radioKm + radioKm && (mes === undefined || f.meses.includes(mes)),
  );
}

/** Fenómenos de una especie (por nombre científico, sin subespecie). */
export function fenomenosDe(cientifico: string | null | undefined): Fenomeno[] {
  if (!cientifico) return [];
  const sp = cientifico.split(" ").slice(0, 2).join(" ");
  return FENOMENOS.filter((f) => f.especie === sp);
}
