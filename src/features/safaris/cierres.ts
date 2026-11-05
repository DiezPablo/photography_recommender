// Parques (o sus zonas principales) que cierran parte del año: los de tigres de la India en el monzón, Kaziranga
// por las crecidas, Gorongosa y Mana Pools en lo peor de las lluvias… Escrito a mano con las fuentes que se
// citan (consultadas el 28-10-2026); las fechas exactas cambian algo cada año. Meses 1-12: los que pasan la
// mayor parte cerrados. Con esto la web no propone un parque cerrado (planificador, «Safari en julio»).

/** Fecha de la última revisión (la comprueba .github/scripts/revision_datos.py). */
export const REVISADO_CIERRES = "28-10-2026";

export type TipoCierre =
  /** el parque entero */
  | "parque"
  /** las zonas donde se ve la fauna (núcleo); quedan zonas secundarias abiertas */
  | "zona"
  /** el parque abre, pero cierran casi todos los campamentos o servicios */
  | "campamentos";

export interface Cierre {
  meses: number[];
  tipo: TipoCierre;
  texto: string;
  fuente: string;
}

const NTCA = "https://www.thehitavada.com/Encyc/2026/5/26/buffer-zones-to-remain-open-for-tourists-during-monsoon.html";
const MP = "https://www.outlooktraveller.com/whats-new/mp-to-shut-6-tiger-reserves-till-october-for-this-reason";
const NUCLEO =
  "Zonas núcleo cerradas por el monzón (del 1 de julio al 30 de septiembre); solo abren las de amortiguamiento.";

export const CIERRES: Record<string, Cierre> = {
  kanha: { meses: [7, 8, 9], tipo: "zona", texto: NUCLEO, fuente: MP },
  bandhavgarh: { meses: [7, 8, 9], tipo: "zona", texto: NUCLEO, fuente: MP },
  "parque-nacional-de-pench": { meses: [7, 8, 9], tipo: "zona", texto: NUCLEO, fuente: MP },
  tadoba: {
    meses: [7, 8, 9],
    tipo: "zona",
    texto: "Zona núcleo cerrada por el monzón (del 30 de junio al 30 de septiembre en 2026); el resto sigue abierto.",
    fuente: "https://test.uniindia.com/news/west/tadoba-core-safari-closes-till-sept-30/3894044.html",
  },
  ranthambore: { meses: [7, 8, 9], tipo: "zona", texto: `${NUCLEO} En Ranthambore, las zonas 1 a 5.`, fuente: NTCA },
  corbett: {
    meses: [7, 8, 9],
    tipo: "zona",
    texto:
      "Por el monzón cierran Bijrani (de julio a mediados de octubre) y Dhikala (de mediados de junio a mediados de noviembre); Jhirna abre todo el año.",
    fuente:
      "https://www.etvbharat.com/en/state/corbett-rajaji-tiger-reserves-set-to-open-for-tourists-from-november-15-enn25102701615",
  },
  kaziranga: {
    meses: [5, 6, 7, 8, 9],
    tipo: "parque",
    texto: "Cerrado por las crecidas del Brahmaputra de mayo a septiembre; reabre a primeros de octubre.",
    fuente: "https://theprint.in/india/kaziranga-reopens-for-tourists-after-annual-monsoon-closure/3061035/",
  },
  yala: {
    meses: [9],
    tipo: "zona",
    texto:
      "Los bloques 1 y 2 (los de los leopardos) cierran cada año unas semanas entre septiembre y mediados de octubre; las fechas cambian.",
    fuente: "https://newsfirst.lk/2026/09/07/yala-national-park-blocks-1-and-2-to-close-temporarily-from-september-14",
  },
  katmai: {
    meses: [10, 11, 12, 1, 2, 3, 4, 5],
    tipo: "campamentos",
    texto: "Brooks Camp (los osos y el salmón) solo tiene servicios del 1 de junio al 17 de septiembre.",
    fuente: "https://www.nps.gov/katm/planyourvisit/hours.htm",
  },
  "mana-pools": {
    meses: [1, 2, 3],
    tipo: "parque",
    texto:
      "En lo peor de las lluvias (enero-marzo) los caminos quedan intransitables y casi todo cierra; muchos campamentos cierran de noviembre a abril.",
    fuente: "https://allafrica.com/stories/202603300136.html",
  },
  gorongosa: {
    meses: [1, 2, 3],
    tipo: "parque",
    texto: "Cerrado por las lluvias de mediados de diciembre a finales de marzo; algunas pistas tardan más en reabrir.",
    fuente: "https://rhinoafrica.com/en/destinations/gorongosa-national-park/2934",
  },
  ruaha: {
    meses: [4, 5],
    tipo: "campamentos",
    texto:
      "El parque abre, pero casi todos los campamentos cierran en lo peor de las lluvias (mediados de marzo a mayo).",
    fuente: "https://www.chaloafrica.com/accommodation/laba-jongomero-ruaha-national-park-tanzania/",
  },
};

/** El cierre del parque ese mes (1-12), si lo hay. */
export function cierreEn(id: string, mes: number): Cierre | null {
  const c = cierreDe(id);
  return c && c.meses.includes(mes) ? c : null;
}

/** «julio a septiembre»: los meses del cierre seguidos (también de diciembre a enero). */
export function textoMesesCierre(c: Cierre, nombres: string[]): string {
  const si = new Set(c.meses);
  const inicio = c.meses.find((m) => !si.has(m === 1 ? 12 : m - 1)) ?? c.meses[0];
  const fin = ((inicio - 1 + c.meses.length - 1) % 12) + 1;
  return c.meses.length === 1 ? nombres[inicio - 1] : `${nombres[inicio - 1]} a ${nombres[fin - 1]}`;
}

export const TEXTO_TIPO_CIERRE: Record<TipoCierre, string> = {
  parque: "Cerrado",
  zona: "Zonas principales cerradas",
  campamentos: "Casi todo cerrado",
};

/** El cierre de un parque por su id, también con el id antiguo que llevaba el Q de Wikidata (T05). */
export function cierreDe(id: string): Cierre | null {
  return CIERRES[id] ?? CIERRES[id.replace(/-q\d+$/, "")] ?? null;
}
