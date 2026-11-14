import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fechaCorta } from "@/features/eventos/datos";
import { claveDe } from "@/features/fauna/datos";
import { fenomenosFauna, getFenomeno, lugaresDelFenomeno } from "@/features/fauna/eventoFauna";
import MapaEventos from "@/ui/mapa/MapaEventos";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  // sin fenómenos publicados aún (datos anteriores a la spec 014), Next necesita al menos un parámetro
  const ids = fenomenosFauna().map((f) => ({ id: f.id }));
  return ids.length ? ids : [{ id: "berrea" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = getFenomeno((await params).id);
  if (!f) return {};
  return { title: `${f.nombre}: dónde y cuándo`, description: f.descripcion };
}

/** La comunidad solo si añade algo: «Zamora (Castilla y León)», pero «Navarra» o «Asturias» a secas. */
function conComunidad(provincia: string | null, ccaa: string | null): boolean {
  return !!ccaa && !!provincia && ccaa !== provincia && !ccaa.endsWith(` de ${provincia}`);
}

export default async function PaginaFenomeno({ params }: Props) {
  const f = getFenomeno((await params).id);
  if (!f) notFound();
  const lugares = lugaresDelFenomeno(f);
  const comunidades = new Set(lugares.map((l) => l.evento.ccaa).filter(Boolean));
  const desde = lugares.map((l) => l.evento.desde).sort()[0];
  const hasta = lugares
    .map((l) => l.evento.hasta)
    .sort()
    .at(-1)!;
  const clave = claveDe(f.especie);
  return (
    <main className="ficha evento cat-fauna fenomeno-fauna">
      <nav className="migas rotulo" aria-label="Migas">
        <Link href="/fauna">Fauna</Link>
      </nav>
      <header className="ficha-cab">
        <p className="rotulo cat-fauna">
          <span className="punto-cat" aria-hidden /> Fauna · {lugares.length} lugares en {comunidades.size} comunidades
        </p>
        <h1>{f.nombre}: dónde y cuándo</h1>
        <p className="entradilla">{f.descripcion}</p>
        <div className="temporada">
          <p>
            <b>Cuándo:</b> del {fechaCorta(desde)} al {fechaCorta(hasta)}, según el lugar. <b>A qué hora:</b> {f.franja}
            .
          </p>
          <p>{f.consejo}</p>
          <p className="nota-pie">
            <a href={f.fuente} target="_blank" rel="noopener">
              Fuente ↗
            </a>
            {clave && (
              <>
                {" · "}
                <Link href={`/fauna/especie/${clave}`}>
                  Ficha de la especie (<i>{f.especie}</i>) →
                </Link>
              </>
            )}
          </p>
        </div>
      </header>

      <section className="seccion">
        <h2 className="rotulo">Dónde</h2>
        <MapaEventos
          eventos={lugares.map(({ evento: e }) => ({
            id: e.id,
            nombre: e.nombre,
            lat: e.lat,
            lon: e.lon,
            radio_km: e.radio_km,
            categoria: e.categoria,
          }))}
          spots={[]}
          etiqueta={`Mapa de ${f.nombre}`}
        />
        <ol className="lugares-fenomeno">
          {lugares.map(({ evento: e, fiabilidad }) => (
            <li key={e.id}>
              <h3>
                <Link href={`/luz/evento/${e.id}`}>{e.lugar}</Link>
              </h3>
              <p className="meta">
                <span>
                  {e.provincia}
                  {conComunidad(e.provincia, e.ccaa) ? ` (${e.ccaa})` : ""}
                </span>
                <span>
                  del {fechaCorta(e.desde)} al {fechaCorta(e.hasta)} · mejor hacia el {fechaCorta(e.pico)}
                </span>
              </p>
              <p>
                {e.descripcion} {e.consejo}
              </p>
              <p className="fiabilidad">
                <b>Fiabilidad:</b> {fiabilidad}.
              </p>
            </li>
          ))}
        </ol>
        <p className="nota-pie">
          Los lugares están escogidos a mano; el orden y la fiabilidad salen de lo que se registra de la especie en las
          cuadrículas de 10 km de cada lugar en esas fechas (GBIF): mide dónde hay más registros, no la probabilidad de
          verla. Las fechas son las habituales y cambian cada año con el tiempo.
        </p>
      </section>
    </main>
  );
}
