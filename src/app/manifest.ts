// Web instalable (spec 004): se puede añadir a la pantalla de inicio y abre a pantalla completa. Con el service
// worker (public/sw.js), las páginas visitadas o guardadas se abren sin conexión.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rasante · dónde ir a fotografiar naturaleza en España",
    short_name: "Rasante",
    description: "La mejor luz y la fauna de cada momento, lugar a lugar, en toda España.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fcfcfa",
    theme_color: "#141413",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Luz de hoy", url: "/luz" },
      { name: "Fauna cerca de mí", url: "/fauna?modo=aqui" },
      { name: "Este finde", url: "/fauna?modo=finde" },
    ],
  };
}
