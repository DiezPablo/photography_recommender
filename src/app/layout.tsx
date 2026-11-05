import RegistrarSW from "@/ui/RegistrarSW";
import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Newsreader } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { SITIO } from "@/lib/sitio";
import { BarraInferior, MenuPrincipal, Mundos } from "@/ui/Navegacion";
import "./globals.css";

// Tipografías autoalojadas en el build (sin peticiones a Google desde el navegador)
const ui = Archivo({ subsets: ["latin"], variable: "--f-ui", display: "swap", axes: ["wdth"] });
const serif = Newsreader({ subsets: ["latin"], variable: "--f-serif", display: "swap", style: ["normal", "italic"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Safaris · dónde y cuándo ver cada animal", template: "%s · Safaris" },
  description:
    "Parques nacionales y reservas de todo el mundo: qué fauna se ve y cuándo, lo visto en el último mes, cómo llegar, alojamientos y operadores. Datos abiertos, sin comisiones.",
  metadataBase: new URL(SITIO),
  alternates: { types: { "application/rss+xml": [{ url: "/recientes.xml", title: "Lo visto en el último mes" }] } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eee4" },
    { media: "(prefers-color-scheme: dark)", color: "#13120f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${ui.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <a href="#contenido" className="saltar">
          Ir al contenido
        </a>
        <header className="cabecera">
          <div className="cabecera-in">
            <Link href="/" className="marca" aria-label="Safaris, inicio">
              Safaris<span className="marca-sub">atlas de fauna</span>
            </Link>
            <Suspense fallback={null}>
              <Mundos />
              <MenuPrincipal />
            </Suspense>
          </div>
        </header>
        <div id="contenido">{children}</div>
        <Suspense fallback={null}>
          <BarraInferior />
        </Suspense>
        <footer className="pie">
          <div className="pie-in">
            <div className="pie-marca">
              <p className="marca">Safaris</p>
              <p>
                Dónde y cuándo ver cada animal, en todo el mundo. Sin comisiones ni alojamientos patrocinados: reservas
                directamente con el parque, el lodge o el operador.
              </p>
            </div>
            <nav aria-label="Mapa del sitio">
              <p>Descubrir</p>
              <Link href="/">Destinos</Link>
              <Link href="/especies">Animales</Link>
              <Link href="/safari-en">Calendario</Link>
              <Link href="/migracion">La gran migración</Link>
              <Link href="/temporada-verde">Temporada verde</Link>
              <Link href="/espana">España</Link>
              <a href="/recientes.xml">Lo visto, por RSS</a>
            </nav>
            <nav aria-label="Organizar">
              <p>Organizar</p>
              <Link href="/planificar">Planificar</Link>
              <Link href="/presupuesto">Presupuesto</Link>
              <Link href="/comparar">Comparar parques</Link>
              <Link href="/viaje">Mi viaje</Link>
              <Link href="/guia">Guía</Link>
            </nav>
            <div className="pie-datos">
              <p>Datos abiertos</p>
              <span>
                <a href="https://www.gbif.org/" rel="noopener">
                  GBIF
                </a>
                ,{" "}
                <a href="https://www.inaturalist.org/" rel="noopener">
                  iNaturalist
                </a>
                ,{" "}
                <a href="https://www.wikidata.org/" rel="noopener">
                  Wikidata
                </a>{" "}
                y Wikimedia Commons (fotos con autor y licencia),{" "}
                <a href="https://power.larc.nasa.gov/" rel="noopener">
                  NASA POWER
                </a>
                ,{" "}
                <a href="https://ourairports.com/" rel="noopener">
                  OurAirports
                </a>{" "}
                y ©{" "}
                <a href="https://www.openstreetmap.org/copyright" rel="noopener">
                  colaboradores de OpenStreetMap
                </a>
                .
              </span>
            </div>
          </div>
        </footer>
        <RegistrarSW />
      </body>
    </html>
  );
}
