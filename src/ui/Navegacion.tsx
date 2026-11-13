"use client";
// Navegación por modos: «Luz» (paisaje y cielo) y «Fauna» (España). Un conmutador en la cabecera cambia de modo; el
// menú de escritorio y la barra inferior del móvil enseñan solo las secciones del modo en el que estás. En la
// portada (/) y en las páginas comunes (/fuentes) no hay modo elegido: solo el conmutador.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  IconoAmanecer,
  IconoCalendario,
  IconoCarta,
  IconoHuella,
  IconoInfo,
  IconoLibro,
  IconoMarcador,
  IconoPrismaticos,
  IconoUbicacion,
} from "@/ui/Iconos";

type Activa = (ruta: string, q: URLSearchParams) => boolean;
interface Seccion {
  href: string;
  texto: string;
  corto?: string;
  Icono: (p: { size?: number }) => React.ReactElement;
  activa: Activa;
  movil?: boolean;
}

type Modo = "inicio" | "luz" | "fauna";
const modoDe = (r: string): Modo => (r.startsWith("/luz") ? "luz" : r.startsWith("/fauna") ? "fauna" : "inicio");
const modo = (q: URLSearchParams) => q.get("modo") ?? (q.has("lat") || q.has("zona") ? "aqui" : "inicio");

const LUZ: Seccion[] = [
  {
    href: "/luz",
    texto: "Hoy",
    Icono: IconoAmanecer,
    activa: (r) => r === "/luz" || r.startsWith("/luz/dia") || r.startsWith("/luz/spot"),
    movil: true,
  },
  {
    href: "/luz/calendario",
    texto: "Calendario",
    Icono: IconoCalendario,
    activa: (r) => r.startsWith("/luz/calendario") || r.startsWith("/luz/evento"),
    movil: true,
  },
  {
    href: "/luz/alertas",
    texto: "Avisos",
    Icono: IconoMarcador,
    activa: (r) => r.startsWith("/luz/alertas"),
    movil: true,
  },
  { href: "/luz/metodo", texto: "Método", Icono: IconoInfo, activa: (r) => r.startsWith("/luz/metodo"), movil: true },
];

const FAUNA: Seccion[] = [
  {
    href: "/fauna",
    texto: "Mapa",
    Icono: IconoCarta,
    // la ficha de una especie se abre desde la carta: cuenta como «Mapa»
    activa: (r, q) => r.startsWith("/fauna/especie") || (r === "/fauna" && modo(q) === "inicio"),
    movil: true,
  },
  {
    href: "/fauna?modo=aqui",
    texto: "Cerca de mí",
    corto: "Cerca",
    Icono: IconoUbicacion,
    activa: (r, q) => r.startsWith("/fauna/lugar") || (r === "/fauna" && modo(q) === "aqui"),
    movil: true,
  },
  {
    href: "/fauna?modo=finde",
    texto: "Este finde",
    corto: "Finde",
    Icono: IconoCalendario,
    activa: (r, q) => r === "/fauna" && modo(q) === "finde",
    movil: true,
  },
  {
    href: "/fauna/hides",
    texto: "Hides",
    Icono: IconoHuella,
    activa: (r) => r.startsWith("/fauna/hides"),
    movil: true,
  },
  {
    href: "/fauna/rarezas",
    texto: "Rarezas",
    Icono: IconoPrismaticos,
    activa: (r) => r.startsWith("/fauna/rarezas"),
    movil: true,
  },
  { href: "/fauna/normas", texto: "Normas", Icono: IconoLibro, activa: (r) => r.startsWith("/fauna/normas") },
];

const SECCIONES: Record<Modo, Seccion[]> = { inicio: [], luz: LUZ, fauna: FAUNA };

function useNav() {
  const ruta = usePathname();
  const q = useSearchParams();
  return { ruta, q: new URLSearchParams(q?.toString() ?? ""), modo: modoDe(ruta) };
}

/** Conmutador de modos, junto a la marca (también en el móvil). */
export function Mundos() {
  const { modo } = useNav();
  return (
    <nav className="mundos" aria-label="Modo">
      <Link href="/luz" aria-current={modo === "luz" ? "page" : undefined}>
        Luz
      </Link>
      <Link href="/fauna" aria-current={modo === "fauna" ? "page" : undefined}>
        Fauna
      </Link>
    </nav>
  );
}

export function MenuPrincipal() {
  const { ruta, q, modo } = useNav();
  return (
    <nav className="menu" aria-label="Principal">
      {SECCIONES[modo].map((s) => (
        <Link key={s.href} href={s.href} aria-current={s.activa(ruta, q) ? "page" : undefined}>
          {s.texto}
        </Link>
      ))}
    </nav>
  );
}

export function BarraInferior() {
  const { ruta, q, modo } = useNav();
  const items = SECCIONES[modo].filter((s) => s.movil);
  if (!items.length) return null;
  return (
    <nav className="barra-inferior" aria-label="Secciones">
      {items.map((s) => (
        <Link key={s.href} href={s.href} aria-current={s.activa(ruta, q) ? "page" : undefined}>
          <s.Icono size={22} />
          {s.corto ?? s.texto}
        </Link>
      ))}
    </nav>
  );
}
