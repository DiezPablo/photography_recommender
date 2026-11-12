import type { NextConfig } from "next";

// Las reglas de nombres comunes y las exclusiones de especies (mismos ficheros que el pipeline): las lee el
// servidor al cargar los datos de safaris, así que van con todas las funciones que los leen
const NOMBRES = [
  "./safari/recursos/nombres_safari.csv",
  "./safari/recursos/nombres_propios.txt",
  "./safari/recursos/fotos_especies.csv",
];
const SAFARIS = ["./datos/safaris.json.gz", "./datos/safaris_mundo.json.gz", ...NOMBRES];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las fotos vienen de Wikimedia Commons e iNaturalist ya en miniatura: no hace falta optimizarlas
  images: { unoptimized: true },
  // sinónimos que tuvieron ficha propia: una sola por taxón
  async redirects() {
    // enlaces antiguos a la portada con parámetros: los de la portada de safaris y los de la carta de fauna
    const dePortada = (claves: string[], destination: string) =>
      claves.map((key) => ({ source: "/", has: [{ type: "query" as const, key }], destination, permanent: false }));
    return [
      { source: "/especie/phoeniconaias-minor", destination: "/especie/phoenicopterus-minor", permanent: true },
      // el modo Fauna vivía en /espana (y la carta, en la portada)
      { source: "/espana", destination: "/fauna", permanent: true },
      { source: "/espana/:ruta*", destination: "/fauna/:ruta*", permanent: true },
      // secciones retiradas (decisión 0016)
      { source: "/fauna/mis-especies", destination: "/fauna", permanent: false },
      { source: "/fauna/diario", destination: "/fauna", permanent: false },
      ...dePortada(["ver", "q", "continente", "cuenta", "epoca", "foto", "ninos", "todos"], "/safaris"),
      ...dePortada(["especie", "celda", "mes", "fecha", "c", "z", "sin"], "/fauna"),
    ];
  },
  // Las fichas de los destacados se generan en el build; las de los miles del resto del mundo, al visitarlas
  // (ISR), leyendo los datos comprimidos de datos/*.gz en la función
  outputFileTracingIncludes: {
    // Modo Luz: la ficha de un spot fuera del top del día se genera al visitarla
    "/luz/spot/[id]": [
      "./datos/informe.json.gz",
      "./datos/spots.geojson.gz",
      "./datos/eventos.json.gz",
      "./datos/clima.json.gz",
      "./datos/alineaciones.json.gz",
      "./datos/dron.json.gz",
    ],
    "/parque/[id]": [...SAFARIS, "./datos/safaris_recientes.json.gz", "./safari/recursos/exclusiones.csv"],
    "/parque/[id]/calendario.ics": SAFARIS,
    "/viaje.ics": SAFARIS,
    "/comparar": SAFARIS,
    "/mapa/especie/[clave]": SAFARIS,
    "/mapa/parque/[id]": SAFARIS,
    "/buscar": [...SAFARIS, "./datos/safaris_indice.json.gz"],
    "/fauna/datos/[bloque]": [
      "./datos/espana.json.gz",
      "./datos/espana_recientes.json.gz",
      "./datos/espana_actividad.json.gz",
      "./datos/espana_ebird.json.gz",
    ],
    "/fauna/especie/[clave]": [
      "./datos/espana.json.gz",
      "./datos/espana_ebird.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/espana_recientes.json.gz",
      "./datos/espana_actividad.json.gz",
      ...SAFARIS,
    ],
    "/fauna/especie-datos/[clave]": [
      "./datos/espana.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      ...SAFARIS,
    ],
    "/fauna/cerca": [
      "./datos/espana.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      ...SAFARIS,
    ],
    "/fauna/lugar/[id]": [
      "./datos/espana.json.gz",
      "./datos/espana_rutas.json.gz",
      "./datos/espana_rarezas.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/espana_recientes.json.gz",
      ...SAFARIS,
    ],
    "/fauna": ["./datos/espana.json.gz"],
    "/fauna/lugares-mapa": ["./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz"],
    "/fauna/lugares": ["./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz", ...SAFARIS],
  },
};

export default config;
