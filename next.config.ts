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
    return [{ source: "/especie/phoeniconaias-minor", destination: "/especie/phoenicopterus-minor", permanent: true }];
  },
  // Las fichas de los destacados se generan en el build; las de los miles del resto del mundo, al visitarlas
  // (ISR), leyendo los datos comprimidos de datos/*.gz en la función
  outputFileTracingIncludes: {
    "/parque/[id]": [...SAFARIS, "./datos/safaris_recientes.json.gz", "./safari/recursos/exclusiones.csv"],
    "/parque/[id]/calendario.ics": SAFARIS,
    "/viaje.ics": SAFARIS,
    "/comparar": SAFARIS,
    "/mapa/especie/[clave]": SAFARIS,
    "/mapa/parque/[id]": SAFARIS,
    "/buscar": [...SAFARIS, "./datos/safaris_indice.json.gz"],
    "/espana/datos/[bloque]": [
      "./datos/espana.json.gz",
      "./datos/espana_recientes.json.gz",
      "./datos/espana_actividad.json.gz",
      "./datos/espana_ebird.json.gz",
    ],
    "/espana/especie/[clave]": [
      "./datos/espana.json.gz",
      "./datos/espana_ebird.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/espana_recientes.json.gz",
      "./datos/espana_actividad.json.gz",
      ...SAFARIS,
    ],
    "/espana/especie-datos/[clave]": [
      "./datos/espana.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      ...SAFARIS,
    ],
    "/espana/cerca": [
      "./datos/espana.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      ...SAFARIS,
    ],
    "/espana/lugar/[id]": [
      "./datos/espana.json.gz",
      "./datos/espana_rutas.json.gz",
      "./datos/espana_rarezas.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/espana_recientes.json.gz",
      ...SAFARIS,
    ],
    "/espana": ["./datos/espana.json.gz"],
    "/espana/lugares-mapa": ["./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz"],
    "/espana/lugares": ["./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz", ...SAFARIS],
  },
};

export default config;
