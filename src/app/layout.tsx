import RegistrarSW from "@/ui/RegistrarSW";
import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import BuscadorGlobal from "@/ui/BuscadorGlobal";
import SelectorMes from "@/ui/SelectorMes";
import { Suspense } from "react";
import { SITIO } from "@/lib/sitio";
import { Logo } from "@/ui/Iconos";
import { BarraInferior, MenuPrincipal, Mundos } from "@/ui/Navegacion";
import "./globals.css";

// Tipografías autoalojadas en el build (sin peticiones a Google desde el navegador)
const ui = Archivo({ subsets: ["latin"], variable: "--f-ui", display: "swap", axes: ["wdth"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Rasante · dónde ir a fotografiar naturaleza en España", template: "%s · Rasante" },
  description:
    "Dónde y cuándo ir a fotografiar en España: la mejor luz de amanecer, atardecer y noche en cada spot, y la fauna que se ve en cada lugar y época. Datos abiertos, gratis.",
  metadataBase: new URL(SITIO),
  alternates: {
    types: { "application/rss+xml": [{ url: "/recientes.xml", title: "Safaris: lo visto en el último mes" }] },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#151816" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${ui.variable} ${mono.variable}`}>
      <body>
        <a href="#contenido" className="saltar">
          Ir al contenido
        </a>
        <header className="cabecera">
          <div className="cabecera-in">
            <Link href="/" className="marca" aria-label="Rasante, inicio">
              <Logo />
              <span className="marca-texto">Rasante</span>
            </Link>
            <Suspense fallback={null}>
              <Mundos />
              <MenuPrincipal />
            </Suspense>
            <Suspense fallback={null}>
              <SelectorMes />
            </Suspense>
            <BuscadorGlobal />
          </div>
        </header>
        <div id="contenido">{children}</div>
        <Suspense fallback={null}>
          <BarraInferior />
        </Suspense>
        <footer className="pie">
          <div className="pie-in">
            <div className="pie-marca">
              <p className="marca">Rasante</p>
              <p>
                Dónde ir a fotografiar naturaleza en España: el lugar y el momento. Gratis, con datos abiertos, sin
                cuentas ni comisiones.
              </p>
            </div>
            <nav aria-label="Luz y cielo">
              <p>Luz y cielo</p>
              <Link href="/luz">Los mejores spots de hoy</Link>
              <Link href="/luz/calendario">Calendario</Link>
              <Link href="/luz/alertas">Avisos en tu calendario</Link>
              <Link href="/luz/metodo">Cómo se puntúa</Link>
            </nav>
            <nav aria-label="Fauna">
              <p>Fauna</p>
              <Link href="/fauna">Mapa de fauna</Link>
              <Link href="/fauna?modo=aqui">Cerca de mí</Link>
              <Link href="/fauna?modo=finde">Este finde</Link>
              <Link href="/fauna/hides">Hides</Link>
              <Link href="/fauna/rarezas">Rarezas</Link>
              <Link href="/fauna/normas">Normas</Link>
              <Link href="/safaris">Safaris por el mundo</Link>
            </nav>
            <div className="pie-datos">
              <p>Datos abiertos</p>
              <span>
                <a href="https://open-meteo.com/" rel="noopener">
                  Open-Meteo
                </a>{" "}
                (previsión, CC BY 4.0),{" "}
                <a href="https://djlorenz.github.io/astronomy/lp/" rel="noopener">
                  atlas de D. Lorenz
                </a>{" "}
                (contaminación lumínica),{" "}
                <a href="https://ebird.org/" rel="noopener">
                  eBird
                </a>
                ,{" "}
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
