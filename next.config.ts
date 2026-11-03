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
    "/espana/datos/[bloque]": ["./datos/espana.json.gz"],
    "/espana/especie/[clave]": ["./datos/espana.json.gz", "./datos/safaris_mundo.json.gz"],
    "/comparar": ["./datos/safaris.json.gz", "./datos/safaris_mundo.json.gz"],
  },
};

export default config;
