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
      // «/buscar» era de los safaris; desde la spec 012 es la consulta común
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
      // la fauna cerca de cada spot (spec 010)
      "./datos/lugares.json.gz",
    ],
    "/fauna/datos/[bloque]": [
      "./datos/fauna_cuadricula.json.gz",
      "./datos/fauna_recientes.json.gz",
      "./datos/fauna_actividad.json.gz",
      "./datos/fauna_ebird.json.gz",
    ],
    "/fauna/especie/[clave]": [
      "./datos/fauna_cuadricula.json.gz",
      "./datos/fauna_ebird.json.gz",
      "./datos/fauna_lugares.json.gz",
      "./datos/fauna_natura.json.gz",
      "./datos/fauna_recientes.json.gz",
      "./datos/fauna_actividad.json.gz",
      // los fenómenos de fauna salen de eventos.json (spec 014)
      "./datos/eventos.json.gz",
    ],
    "/fauna/especie-datos/[clave]": [
      "./datos/fauna_cuadricula.json.gz",
      "./datos/fauna_lugares.json.gz",
      "./datos/fauna_natura.json.gz",
    ],
    "/fauna/cerca": [
      "./datos/fauna_cuadricula.json.gz",
      "./datos/fauna_lugares.json.gz",
      "./datos/fauna_natura.json.gz",
      // la actividad de eBird elige el punto de cada cuadrícula y da la de la región (spec 021)
      "./datos/fauna_listas.json.gz",
      "./datos/fauna_ebird_regiones.json.gz",
    ],
    "/fauna/lugar/[id]": [
      "./datos/fauna_cuadricula.json.gz",
      "./datos/fauna_rarezas.json.gz",
      "./datos/fauna_lugares.json.gz",
      "./datos/fauna_natura.json.gz",
      "./datos/fauna_recientes.json.gz",
      "./datos/fauna_listas.json.gz",
      "./datos/fauna_ebird_regiones.json.gz",
      "./datos/fauna_especies_punto.json.gz",
      "./datos/eventos.json.gz",
      // la luz cerca de cada lugar, con su nota de hoy (spec 010)
      "./datos/lugares.json.gz",
      "./datos/informe.json.gz",
      "./datos/spots.geojson.gz",
    ],
    "/fauna": ["./datos/fauna_cuadricula.json.gz", "./datos/eventos.json.gz"],
    // la consulta común (spec 012): luz con previsión o lo habitual, y fauna cerca
    "/buscar": [
      "./datos/informe.json.gz",
      "./datos/spots.geojson.gz",
      "./datos/clima.json.gz",
      "./datos/lugares.json.gz",
      "./datos/eventos.json.gz",
      "./datos/fauna_cuadricula.json.gz",
      "./datos/fauna_lugares.json.gz",
      "./datos/fauna_natura.json.gz",
      "./datos/fauna_listas.json.gz",
    ],
    // el plan de varios días (spec 016): lo mismo que la consulta, más los puntos de eBird para elegir el de fauna
    "/plan": [
      "./datos/informe.json.gz",
      "./datos/spots.geojson.gz",
      "./datos/clima.json.gz",
      "./datos/lugares.json.gz",
      "./datos/eventos.json.gz",
      "./datos/fauna_cuadricula.json.gz",
      "./datos/fauna_lugares.json.gz",
      "./datos/fauna_natura.json.gz",
      "./datos/fauna_listas.json.gz",
    ],
    "/fauna/lugares-mapa": ["./datos/fauna_lugares.json.gz", "./datos/fauna_natura.json.gz"],
    "/fauna/lugares": ["./datos/fauna_lugares.json.gz", "./datos/fauna_natura.json.gz"],
  },
};

export default config;
