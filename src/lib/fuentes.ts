// Fuentes de datos de Rasante, con su licencia: una sola lista para la página /fuentes y para «Método».
// El detalle (uso comercial, qué está por confirmar) está en docs/datos/fuentes.md.

export type ModoFuente = "luz" | "fauna";

export interface Fuente {
  /** para qué se usa, en dos o tres palabras */
  uso: string;
  nombre: string;
  url: string;
  licencia: string;
  modos: ModoFuente[];
}

export const FUENTES: Fuente[] = [
  {
    uso: "Previsión, mareas y climatología",
    nombre: "Open-Meteo (con ECMWF IFS, ERA5 y CAMS)",
    url: "https://open-meteo.com/",
    licencia: "CC BY 4.0",
    modos: ["luz", "fauna"],
  },
  {
    uso: "Sol, luna y Vía Láctea",
    nombre: "Cálculo propio (astral, Meeus)",
    url: "https://astral.readthedocs.io/",
    licencia: "—",
    modos: ["luz", "fauna"],
  },
  {
    uso: "Relieve y horizonte",
    nombre: "Terrain Tiles (Mapzen, AWS Open Data)",
    url: "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
    licencia: "Abierto, con atribución a sus fuentes",
    modos: ["luz"],
  },
  {
    uso: "Spots y espacios protegidos",
    nombre: "Wikidata",
    url: "https://www.wikidata.org/",
    licencia: "CC0",
    modos: ["luz", "fauna"],
  },
  {
    uso: "Mapa, miradores, cumbres y observatorios",
    nombre: "© colaboradores de OpenStreetMap",
    url: "https://www.openstreetmap.org/copyright",
    licencia: "ODbL",
    modos: ["luz", "fauna"],
  },
  {
    uso: "Fotos",
    nombre: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/",
    licencia: "La de cada foto, con su autor",
    modos: ["luz"],
  },
  {
    uso: "Contaminación lumínica",
    nombre: "World Atlas of Artificial Night Sky Brightness 2025, D. Lorenz",
    url: "https://djlorenz.github.io/astronomy/lp/",
    licencia: "Sin licencia publicada; el «≈ Bortle» es una aproximación nuestra, no del autor",
    modos: ["luz"],
  },
  {
    uso: "Auroras (índice Kp)",
    nombre: "NOAA Space Weather Prediction Center",
    url: "https://www.swpc.noaa.gov/",
    licencia: "Dominio público",
    modos: ["luz"],
  },
  {
    uso: "Nubes ahora (satélite)",
    nombre: "EUMETSAT",
    url: "https://view.eumetsat.int",
    licencia: "Libre con atribución",
    modos: ["luz"],
  },
  {
    uso: "Marcador de aciertos (METAR)",
    nombre: "Iowa Environmental Mesonet",
    url: "https://mesonet.agron.iastate.edu/",
    licencia: "Dominio público",
    modos: ["luz"],
  },
  {
    uso: "Dron: zonas de vuelo",
    nombre: "ENAIRE Drones",
    url: "https://drones.enaire.es/",
    licencia: "Datos públicos; orientativo",
    modos: ["luz"],
  },
  {
    uso: "Espacios protegidos, Red Natura 2000 y cuadrícula de 10 km",
    nombre: "Agencia Europea de Medio Ambiente",
    url: "https://www.eea.europa.eu/",
    licencia: "CC BY 4.0",
    modos: ["luz", "fauna"],
  },
  {
    uso: "Provincias y mapa topográfico",
    nombre: "Instituto Geográfico Nacional (CNIG)",
    url: "https://www.ign.es",
    licencia: "CC BY 4.0",
    modos: ["luz", "fauna"],
  },
  {
    uso: "Países vecinos",
    nombre: "Natural Earth",
    url: "https://www.naturalearthdata.com/",
    licencia: "Dominio público",
    modos: ["luz", "fauna"],
  },
  {
    uso: "Qué se registra, por cuadrícula y mes",
    nombre: "GBIF",
    url: "https://www.gbif.org/",
    licencia: "La de cada conjunto de datos",
    modos: ["fauna"],
  },
  {
    uso: "Frecuencia de detección de aves",
    nombre: "EOD – eBird Observation Dataset (Cornell Lab of Ornithology, vía GBIF)",
    url: "https://doi.org/10.15468/aomfnb",
    licencia: "CC BY 4.0",
    modos: ["fauna"],
  },
  {
    uso: "Aves vistas estos días, rarezas y puntos de observación",
    nombre: "eBird (Cornell Lab of Ornithology)",
    url: "https://ebird.org",
    licencia: "Condiciones de uso de eBird (no comercial)",
    modos: ["fauna"],
  },
  {
    uso: "Mamíferos, reptiles y anfibios vistos estos días; horas de actividad",
    nombre: "iNaturalist",
    url: "https://www.inaturalist.org",
    licencia: "La de cada observación",
    modos: ["fauna"],
  },
];

export function fuentesDe(modo: ModoFuente): Fuente[] {
  return FUENTES.filter((f) => f.modos.includes(modo));
}
