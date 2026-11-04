import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las fotos vienen de Wikimedia Commons e iNaturalist ya en miniatura: no hace falta optimizarlas
  images: { unoptimized: true },
  // Las fichas de los destacados se generan en el build; las de los miles del resto del mundo, al visitarlas
  // (ISR), leyendo los datos comprimidos de datos/*.gz en la función
  outputFileTracingIncludes: {
    "/parque/[id]": ["./datos/safaris.json.gz", "./datos/safaris_mundo.json.gz", "./datos/safaris_recientes.json.gz"],
    "/parque/[id]/calendario.ics": ["./datos/safaris.json.gz", "./datos/safaris_mundo.json.gz"],
    "/viaje.ics": ["./datos/safaris.json.gz", "./datos/safaris_mundo.json.gz"],
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
      "./datos/safaris_mundo.json.gz",
    ],
    "/espana/especie-datos/[clave]": [
      "./datos/espana.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/safaris_mundo.json.gz",
    ],
    "/espana/cerca": [
      "./datos/espana.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/safaris_mundo.json.gz",
    ],
    "/espana/lugar/[id]": [
      "./datos/espana.json.gz",
      "./datos/espana_rutas.json.gz",
      "./datos/espana_rarezas.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/espana_recientes.json.gz",
      "./datos/safaris_mundo.json.gz",
    ],
    "/espana/lugares-mapa": ["./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz"],
    "/espana/lugares": [
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/safaris_mundo.json.gz",
    ],
    "/comparar": ["./datos/safaris.json.gz", "./datos/safaris_mundo.json.gz"],
  },
};

export default config;
