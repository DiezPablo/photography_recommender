// Hides fotográficos y salidas guiadas de fauna en España (catálogo escrito a mano, features/fauna/hides.ts).
import type { Metadata } from "next";
import Link from "next/link";
import CatalogoHides from "@/features/fauna/CatalogoHides";
import { HIDES, REVISADO_HIDES } from "@/features/fauna/hides";
import { claveDe } from "@/features/fauna/datos";

export const metadata: Metadata = {
  title: "Hides fotográficos y salidas guiadas de fauna en España",
  description:
    "Hides para fotografiar avutarda, águila imperial, quebrantahuesos, martín pescador o buitre negro y salidas guiadas para ver lobo, oso, lince u orcas, por especie y temporada.",
};

export const dynamic = "force-static";

const PROPONER =
  "https://github.com/DiezPablo/photography_recommender/issues/new?template=propon-hide.yml&title=Hide%3A+";

export default function PaginaHides() {
  const claves = Object.fromEntries(HIDES.flatMap((h) => h.especies.map((e) => [e.c, claveDe(e.c)])));
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/fauna">Fauna</Link>
        </p>
        <h1>Hides y salidas guiadas</h1>
        <p className="entradilla">
          Hides fotográficos y salidas con guía para ver y fotografiar fauna en España, con su temporada y su web. Sin
          comisiones: reservas directamente con cada uno.
        </p>
      </header>
      <CatalogoHides claves={claves} />
      <section className="seccion">
        <h2 className="rotulo">Antes de reservar</h2>
        <ul>
          <li>
            Comprueba que el hide tiene autorización de la comunidad autónoma, sobre todo con especies protegidas.
          </li>
          <li>
            Aquí no hay hides en nidos ni en colonias de cría: fotografiar especies protegidas en el nido necesita
            permiso y suele hacerles daño.
          </li>
          <li>
            Pregunta por la orientación (luz de mañana o de tarde), la distancia al sujeto y si el cristal es espía.
          </li>
          <li>Con lobo, oso o lince: siempre a distancia y con guía; nunca se dan puntos exactos.</li>
          <li>
            Lo que dice la ley y el código ético: <Link href="/fauna/normas">normas para fotografiar fauna</Link>.
          </li>
        </ul>
        <p>
          ¿Falta alguno o hay un dato mal? <a href={PROPONER}>Propón un hide o una salida</a> (se revisa a mano).
        </p>
        <p className="nota-pie">
          Datos de la web de cada operador, consultados el {REVISADO_HIDES}. Precios y temporadas pueden cambiar.
        </p>
      </section>
    </main>
  );
}
