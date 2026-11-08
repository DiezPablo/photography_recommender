// Normas y código ético para fotografiar fauna en España: lo que dice la ley (citado), drones y la página oficial
// de cada parque nacional.
import type { Metadata } from "next";
import Link from "next/link";
import { DRONES, LEY, PARQUES_NACIONALES, REVISADO_NORMAS } from "@/features/espana/normas";

export const metadata: Metadata = {
  title: "Normas y código ético para fotografiar fauna en España",
  description:
    "Qué dice la ley sobre molestar a la fauna, nidos, drones y la normativa de cada parque nacional, con un código ético para la fotografía de naturaleza.",
};

export const dynamic = "force-static";

export default function PaginaNormas() {
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">España</Link>
        </p>
        <h1>Normas y código ético</h1>
        <p className="entradilla">
          La foto nunca vale más que el animal. Lo esencial de la ley, los drones y dónde mirar las normas de cada
          espacio, con un código para salir al campo.
        </p>
      </header>

      <section className="seccion">
        <h2 className="rotulo">Código de conducta</h2>
        <ul>
          <li>
            Si el animal cambia de comportamiento por ti (se alerta, deja de comer, se va), estás demasiado cerca.
          </li>
          <li>
            Nada de nidos ni colonias de cría: ni acercarse, ni quitar ramas, ni esperar a la salida de los pollos.
          </li>
          <li>Sin reclamos ni grabaciones en época de cría: estresan y alejan al animal de su territorio.</li>
          <li>No cebes carnívoros ni rapaces fuera de comederos y hides autorizados.</li>
          <li>
            Con especies amenazadas (lince, oso, lobo, urogallo, águila imperial): con guía, a distancia y sin compartir
            puntos.
          </li>
          <li>Por caminos y pistas abiertos; respeta cierres temporales, fincas privadas y al ganado.</li>
          <li>No publiques la ubicación exacta de especies sensibles ni de dormideros y nidos.</li>
        </ul>
      </section>

      <section className="seccion">
        <h2 className="rotulo">Lo que dice la ley</h2>
        <p>
          <a href={LEY.url} target="_blank" rel="noopener">
            {LEY.nombre} ↗
          </a>
          :
        </p>
        <blockquote>
          <p>Art. 54.5 (todas las especies silvestres): «{LEY.art54}»</p>
        </blockquote>
        <blockquote>
          <p>
            Art. 57.1.b (especies del Listado de Especies Silvestres en Régimen de Protección Especial): «{LEY.art57}»
          </p>
        </blockquote>
        <p>
          Fotografiar especies protegidas en el nido o en sus lugares de cría solo es posible con autorización de la
          comunidad autónoma. Las comunidades y los espacios protegidos tienen además sus propias normas: consúltalas
          antes de ir.
        </p>
      </section>

      <section className="seccion">
        <h2 className="rotulo">Drones</h2>
        <p>
          En parques nacionales y en muchos espacios protegidos volar un dron está prohibido o necesita autorización, y
          molesta a la fauna (sobre todo a las rapaces en cría). Antes de volar:
        </p>
        <ul>
          {DRONES.map((d) => (
            <li key={d.url}>
              <a href={d.url} target="_blank" rel="noopener">
                {d.nombre} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="seccion">
        <h2 className="rotulo">Parques nacionales: normas de visita</h2>
        <p>Accesos, horarios, permisos de fotografía y zonas restringidas, en la página oficial de cada parque:</p>
        <ul className="lista-lugares columnas">
          {PARQUES_NACIONALES.map(([n, u]) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noopener">
                {n} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="nota-pie">Enlaces consultados el {REVISADO_NORMAS}.</p>
      </section>
    </main>
  );
}
