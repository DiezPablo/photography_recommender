import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las fotos vienen de Wikimedia Commons e iNaturalist ya en miniatura: no hace falta optimizarlas
  images: { unoptimized: true },
  async redirects() {
    // enlaces antiguos a la carta de fauna, que vivía en la portada con sus parámetros
    const dePortada = (claves: string[], destination: string) =>
      claves.map((key) => ({ source: "/", has: [{ type: "query" as const, key }], destination, permanent: false }));
    // los safaris del mundo se retiraron de esta versión (decisión 0021): sus páginas llevan a la portada.
    // Temporales (307), por si vuelven.
    const retiradas = [
      "/safaris",
      "/parque/:ruta*",
      "/safari-en/:ruta*",
      "/especie/:ruta*",
      "/especies",
      "/guia",
      "/comparar",
      "/migracion",
      "/planificar",
      "/presupuesto",
      "/temporada-verde",
      "/viaje",
      "/mapa",
      "/mapa/:ruta*",
      "/buscar",
    ].map((source) => ({ source, destination: "/", permanent: false }));
    return [
      // el modo Fauna vivía en /espana
      { source: "/espana", destination: "/fauna", permanent: true },
      { source: "/espana/:ruta*", destination: "/fauna/:ruta*", permanent: true },
      // secciones retiradas (decisión 0016)
      { source: "/fauna/mis-especies", destination: "/fauna", permanent: false },
      { source: "/fauna/diario", destination: "/fauna", permanent: false },
      ...dePortada(["especie", "celda", "mes", "fecha", "c", "z", "sin"], "/fauna"),
      ...retiradas,
    ];
  },
  // Las fichas que no se generan en el build se generan al visitarlas (ISR), leyendo en la función los datos
  // comprimidos de datos/*.gz: cada ruta lleva solo los que usa
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
    ],
    "/fauna/especie-datos/[clave]": [
      "./datos/espana.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
    ],
    "/fauna/cerca": ["./datos/espana.json.gz", "./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz"],
    "/fauna/lugar/[id]": [
      "./datos/espana.json.gz",
      "./datos/espana_rutas.json.gz",
      "./datos/espana_rarezas.json.gz",
      "./datos/espana_lugares.json.gz",
      "./datos/espana_natura.json.gz",
      "./datos/espana_recientes.json.gz",
      "./datos/espana_listas.json.gz",
    ],
    "/fauna": ["./datos/espana.json.gz"],
    "/fauna/lugares-mapa": ["./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz"],
    "/fauna/lugares": ["./datos/espana_lugares.json.gz", "./datos/espana_natura.json.gz"],
  },
};

export default config;
