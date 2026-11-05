"use client";
// Navegación en dos mundos: «Safaris» (parques del mundo) y «España» (fauna cerca de casa). Un conmutador en la
// cabecera cambia de mundo; el menú de escritorio y la barra inferior del móvil enseñan solo las secciones del
// mundo en el que estás, y a la derecha va lo tuyo de cada uno («Mi viaje» o «Lo mío»).
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useViajeGuardado } from "@/features/safaris/viaje";
import {
  IconoBrujula,
  IconoCalendario,
  IconoHuella,
  IconoLibro,
  IconoManada,
  IconoMarcador,
  IconoPrismaticos,
  IconoRuta,
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

const enEspana = (r: string) => r.startsWith("/espana");
const modo = (q: URLSearchParams) => q.get("modo") ?? (q.has("lat") || q.has("zona") ? "aqui" : "inicio");

const SAFARIS: Seccion[] = [
  {
    href: "/",
    texto: "Destinos",
    Icono: IconoBrujula,
    activa: (r) => r === "/" || r.startsWith("/parque"),
    movil: true,
  },
  { href: "/especies", texto: "Animales", Icono: IconoHuella, activa: (r) => r.startsWith("/especie"), movil: true },
  {
    href: "/safari-en",
    texto: "Calendario",
    Icono: IconoManada,
    activa: (r) => ["/safari-en", "/migracion", "/temporada-verde"].some((x) => r.startsWith(x)),
    movil: true,
  },
  {
    href: "/planificar",
    texto: "Planificar",
    Icono: IconoRuta,
    activa: (r) => ["/planificar", "/presupuesto", "/comparar"].some((x) => r.startsWith(x)),
    movil: true,
  },
  { href: "/guia", texto: "Guía", Icono: IconoLibro, activa: (r) => r.startsWith("/guia") },
];

const ESPANA: Seccion[] = [
  {
    href: "/espana",
    texto: "Inicio",
    Icono: IconoBrujula,
    activa: (r, q) => r === "/espana" && modo(q) === "inicio",
    movil: true,
  },
  {
    href: "/espana?modo=aqui",
    texto: "Qué veo aquí",
    corto: "Cerca",
    Icono: IconoUbicacion,
    activa: (r, q) => r.startsWith("/espana/lugar") || (r === "/espana" && modo(q) === "aqui"),
    movil: true,
  },
  {
    href: "/espana?modo=finde",
    texto: "Este finde",
    corto: "Finde",
    Icono: IconoCalendario,
    activa: (r, q) => r === "/espana" && modo(q) === "finde",
    movil: true,
  },
  {
    href: "/espana?modo=donde",
    texto: "Buscar especie",
    corto: "Especies",
    Icono: IconoPrismaticos,
    activa: (r, q) => r.startsWith("/espana/especie") || (r === "/espana" && modo(q) === "donde"),
    movil: true,
  },
  { href: "/espana/mapa", texto: "Mapa", Icono: IconoRuta, activa: (r) => r.startsWith("/espana/mapa"), movil: true },
  { href: "/espana/hides", texto: "Hides", Icono: IconoHuella, activa: (r) => r.startsWith("/espana/hides") },
];

function useNav() {
  const ruta = usePathname();
  const q = useSearchParams();
  return { ruta, q: new URLSearchParams(q?.toString() ?? ""), espana: enEspana(ruta) };
}

/** Conmutador entre los dos mundos, junto a la marca (también en el móvil). */
export function Mundos() {
  const { espana } = useNav();
  return (
    <nav className="mundos" aria-label="Sección de la web">
      <Link href="/" aria-current={espana ? undefined : "page"}>
        Safaris
      </Link>
      <Link href="/espana" aria-current={espana ? "page" : undefined}>
        España
      </Link>
    </nav>
  );
}

export function MenuPrincipal() {
  const { ruta, q, espana } = useNav();
  const viaje = useViajeGuardado();
  const secciones = espana ? ESPANA : SAFARIS;
  return (
    <>
      <nav className="menu" aria-label="Principal">
        {secciones.map((s) => (
          <Link key={s.href} href={s.href} aria-current={s.activa(ruta, q) ? "page" : undefined}>
            {s.texto}
          </Link>
        ))}
      </nav>
      {espana ? (
        <Link
          href="/espana/mis-especies"
          className="boton-viaje"
          aria-current={
            ruta.startsWith("/espana/mis-especies") || ruta.startsWith("/espana/diario") ? "page" : undefined
          }
        >
          <IconoMarcador size={17} />
          Lo mío
        </Link>
      ) : (
        <Link href="/viaje" className="boton-viaje" aria-current={ruta.startsWith("/viaje") ? "page" : undefined}>
          <IconoMarcador size={17} />
          Mi viaje
          {viaje && <span className="contador">{viaje.etapas.length}</span>}
        </Link>
      )}
    </>
  );
}

export function BarraInferior() {
  const { ruta, q, espana } = useNav();
  const viaje = useViajeGuardado();
  const items: Seccion[] = espana
    ? ESPANA.filter((s) => s.movil)
    : [
        ...SAFARIS.filter((s) => s.movil),
        { href: "/viaje", texto: "Mi viaje", Icono: IconoMarcador, activa: (r) => r.startsWith("/viaje") },
      ];
  return (
    <nav className="barra-inferior" aria-label="Secciones">
      {items.map((s) => (
        <Link key={s.href} href={s.href} aria-current={s.activa(ruta, q) ? "page" : undefined}>
          <s.Icono size={22} />
          {s.corto ?? s.texto}
          {s.href === "/viaje" && viaje && <span className="contador">{viaje.etapas.length}</span>}
        </Link>
      ))}
    </nav>
  );
}
