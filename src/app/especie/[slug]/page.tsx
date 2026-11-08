import type { Metadata } from "next";
import Link from "next/link";
import { esNd, origenFoto, textoCredito } from "@/ui/Credito";
import { notFound } from "next/navigation";
import MapaEventos from "@/ui/mapa/MapaEventos";
import {
  cifras,
  cargarRecientes,
  cargarSafaris,
  getEspecieSafari,
  cargarMundo,
  getParque,
  nombreTaxon,
  parquesMundoDe,
  slugEspecie,
} from "@/features/safaris/datos";
import { fechaLocal } from "@/lib/sol";
import { claveMundo } from "@/features/carta/mundo";
import { eventosDeEspecie } from "@/features/safaris/eventos";
import ParquesEspecie from "@/features/safaris/componentes/ParquesEspecie";
import { FICHAS, REVISADO_FICHAS, TEXTO_UICN } from "@/features/safaris/fichasEspecie";
import { TASAS } from "@/features/safaris/tasas";
import { EnlaceFuente, textoMeses } from "@/features/safaris/componentes/Fenomenos";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return (cargarSafaris()?.especies ?? []).map((e) => ({ slug: slugEspecie(e) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getEspecieSafari((await params).slug);
  if (!e) return {};
  return {
    title: `Dónde ver ${nombreTaxon(e).toLowerCase()}`,
    description: `Los mejores parques del mundo para ver ${nombreTaxon(e).toLowerCase()} (${e.cientifico}) y cuándo ir.`,
  };
}

// con menos observaciones puede ser un animal de paso, uno mal identificado o de un zoo cercano: no se lista
// (el pipeline aplica el mismo umbral, MIN_OBS_ESPECIE en safari/cli.py)
const MIN_OBS = 20;

export default async function PaginaEspecieSafari({ params }: Props) {
  const e = getEspecieSafari((await params).slug);
  if (!e) notFound();
  const recientes = cargarRecientes();
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  const parques = e.parques
    .map((x) => ({ ...x, p: getParque(x.id)!, mes: recientes?.parques[x.id]?.estrella[String(e.taxon)] ?? 0 }))
    .filter((x) => x.p && x.n >= MIN_OBS);
  const destacados = new Set(parques.map((x) => x.id));
  const mundo = parquesMundoDe(e.cientifico).filter((x) => !destacados.has(x.p.id) && x.n >= MIN_OBS);
  const paises = cargarMundo()?.paises ?? {};
  return (
    <main className="ficha evento cat-fauna especie">
      <nav className="migas rotulo" aria-label="Migas">
        <Link href="/safaris">Destinos</Link>
        <Link href="/especies">Animales</Link>
      </nav>
      <header className="ficha-cab cabecera-especie">
        {e.foto && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.foto.url.replace("/medium.", "/large.")}
              style={e.foto.posicion ? { objectPosition: e.foto.posicion } : undefined}
              alt={nombreTaxon(e)}
              className={esNd(e.foto) ? "foto-nd" : undefined}
            />
            <figcaption>
              {origenFoto(e.foto) ? (
                <a href={origenFoto(e.foto)!} target="_blank" rel="noopener">
                  {textoCredito(e.foto)}
                </a>
              ) : (
                textoCredito(e.foto)
              )}{" "}
              · iNaturalist
            </figcaption>
          </figure>
        )}
        <div>
          <p className="rotulo">
            <span className="punto-cat" aria-hidden /> <i>{e.cientifico}</i>
          </p>
          <h1>{nombreTaxon(e)}</h1>
          <p className="entradilla">
            {parques.length
              ? `Dónde más se ha observado entre los ${cifras().destacados} parques destacados, con su mejor época.`
              : "Hay muy pocas observaciones en los parques de la lista."}
          </p>
          {claveMundo(e.cientifico) && (
            <p>
              <Link className="boton" href={`/mapa?especie=${claveMundo(e.cientifico)}`}>
                Verlo en el mapa del mundo
              </Link>
            </p>
          )}
        </div>
      </header>
      <div className="ficha-grid">
        {FICHAS[e.cientifico] && (
          <section className="seccion ficha-especie-datos" aria-labelledby="para-verla">
            <h2 className="rotulo" id="para-verla">
              Para verla y fotografiarla
            </h2>
            <dl className="datos-foto">
              <div>
                <dt>Estado (UICN)</dt>
                <dd>
                  <span className={`uicn uicn-${FICHAS[e.cientifico].uicn}`}>{FICHAS[e.cientifico].uicn}</span>{" "}
                  {TEXTO_UICN[FICHAS[e.cientifico].uicn]}
                </dd>
              </div>
              <div>
                <dt>Tamaño</dt>
                <dd>{FICHAS[e.cientifico].tamano}</dd>
              </div>
              <div>
                <dt>Cuándo está activa</dt>
                <dd>{FICHAS[e.cientifico].actividad}</dd>
              </div>
              <div>
                <dt>Distancia y focal</dt>
                <dd>{FICHAS[e.cientifico].distancia}</dd>
              </div>
              <div>
                <dt>Qué fotografiar</dt>
                <dd>{FICHAS[e.cientifico].fotogenico.join(" · ")}</dd>
              </div>
              <div>
                <dt>Consejo</dt>
                <dd>{FICHAS[e.cientifico].consejo}</dd>
              </div>
            </dl>
            <p className="nota-pie">
              Estado según la Lista Roja de la UICN; tamaño y conducta, de guías de campo (revisado el {REVISADO_FICHAS}
              ).
            </p>
          </section>
        )}
        {eventosDeEspecie(e.cientifico).length > 0 && (
          <section className="seccion">
            <h2 className="rotulo">Momentos especiales</h2>
            <ul className="lista-respuesta compacta">
              {eventosDeEspecie(e.cientifico).map((ev) => (
                <li key={ev.id}>
                  <Link href={`/parque/${ev.parque}`}>{getParque(ev.parque)?.nombre ?? ev.parque}</Link>:{" "}
                  <b>{ev.titulo}</b> ({textoMeses(ev)}). {ev.descripcion} <EnlaceFuente e={ev} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="seccion">
          <h2 className="rotulo">Mejores parques</h2>
          <ParquesEspecie
            mesHoy={mesHoy}
            filas={parques.map((x) => ({
              id: x.id,
              nombre: x.p.nombre,
              pais: x.p.pais,
              n: x.n,
              recientes: x.mes,
              meses: x.p.meses,
              frecuencia: x.p.frecuencia?.[String(e.taxon)],
              // el paisaje del parque (la foto de la especie sería la misma en todas las filas), en miniatura
              // Wikimedia solo sirve tamaños estándar (120, 250, 330, 500, 960…): 160 da error
              foto: x.p.foto?.url.replace(/\/\d+px-/, "/120px-") ?? null,
              usdDia: TASAS[x.id]?.usdDia || null,
            }))}
          />
        </section>
        <section className="seccion">
          <MapaEventos
            eventos={parques.map((x) => ({
              id: x.id,
              nombre: x.p.nombre,
              lat: x.p.lat,
              lon: x.p.lon,
              radio_km: x.p.radio_km,
              categoria: "fauna",
            }))}
            enlace="/parque"
            etiqueta={`Mapa de dónde ver ${nombreTaxon(e).toLowerCase()}`}
            mundo
          />
        </section>
      </div>
      {mundo.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Más parques del mundo donde se ve</h2>
          <ul className="lista-cercanos">
            {mundo.map(({ p, n }) => (
              <li key={p.id}>
                <Link href={`/parque/${p.id}`}>{p.nombre}</Link>
                <small>
                  {(p.pais && paises[p.pais]?.nombre) ?? "—"} · {n.toLocaleString("es-ES")} observaciones en GBIF
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="nota-pie">
        Dos fuentes distintas: «Mejores parques» cuenta las observaciones de iNaturalist con grado de investigación
        alrededor de cada parque destacado; «Más parques del mundo» cuenta los registros de GBIF (que reúne iNaturalist,
        eBird, museos y censos) dentro de cada parque. Por eso las cifras no se comparan entre una lista y otra. Solo se
        listan parques con al menos {MIN_OBS} observaciones, y todas dependen de cuánta gente va y sube fotos. Foto:{" "}
        {e.foto?.licencia}.
      </p>
    </main>
  );
}
