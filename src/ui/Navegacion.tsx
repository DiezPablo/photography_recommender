"use client";
// Navegación: un solo menú (Descubrir, Especies, Cuándo ir, España, Planificar, Guía) con «Mi viaje» a la derecha; en el
// móvil, barra inferior con iconos. Comparar y Presupuesto se abren desde donde se usan (fichas, planificador,
// Mi viaje), no compiten en el menú.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useViajeGuardado } from "@/features/safaris/viaje";
import {
  IconoBrujula,
  IconoHuella,
  IconoLibro,
  IconoManada,
  IconoMarcador,
  IconoRuta,
  IconoUbicacion,
} from "@/ui/Iconos";

const SECCIONES = [
  { href: "/", texto: "Descubrir", Icono: IconoBrujula, activa: (r: string) => r === "/" || r.startsWith("/parque") },
  { href: "/especies", texto: "Especies", Icono: IconoHuella, activa: (r: string) => r.startsWith("/especie") },
  {
    href: "/safari-en",
    texto: "Cuándo ir",
    Icono: IconoManada,
    activa: (r: string) => ["/safari-en", "/migracion", "/temporada-verde"].some((x) => r.startsWith(x)),
  },
  { href: "/espana", texto: "España", Icono: IconoUbicacion, activa: (r: string) => r.startsWith("/espana") },
  {
    href: "/planificar",
    texto: "Planificar",
    Icono: IconoRuta,
    activa: (r: string) => ["/planificar", "/presupuesto", "/comparar"].some((x) => r.startsWith(x)),
  },
  { href: "/guia", texto: "Guía", Icono: IconoLibro, activa: (r: string) => r.startsWith("/guia") },
];

export function MenuPrincipal() {
  const ruta = usePathname();
  const viaje = useViajeGuardado();
  return (
    <>
      <nav className="menu" aria-label="Principal">
        {SECCIONES.map((s) => (
          <Link key={s.href} href={s.href} aria-current={s.activa(ruta) ? "page" : undefined}>
            {s.texto}
          </Link>
        ))}
      </nav>
      <Link href="/viaje" className="boton-viaje" aria-current={ruta.startsWith("/viaje") ? "page" : undefined}>
        <IconoMarcador size={17} />
        Mi viaje
        {viaje && <span className="contador">{viaje.etapas.length}</span>}
      </Link>
    </>
  );
}

export function BarraInferior() {
  const ruta = usePathname();
  const viaje = useViajeGuardado();
  const items = [
    SECCIONES[0],
    SECCIONES[1],
    SECCIONES[3],
    SECCIONES[4],
    { href: "/viaje", texto: "Mi viaje", Icono: IconoMarcador, activa: (r: string) => r.startsWith("/viaje") },
  ];
  return (
    <nav className="barra-inferior" aria-label="Secciones">
      {items.map((s) => (
        <Link key={s.href} href={s.href} aria-current={s.activa(ruta) ? "page" : undefined}>
          <s.Icono size={22} />
          {s.texto}
          {s.href === "/viaje" && viaje && <span className="contador">{viaje.etapas.length}</span>}
        </Link>
      ))}
    </nav>
  );
}
