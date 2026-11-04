// Ficha de un lugar de fauna en España (punto de eBird, espacio protegido u observatorio): qué se ve cada mes en
// sus cuadrículas, fenómenos, aves vistas estos días, cómo llegar y lugares cercanos. Se genera al visitarla (ISR).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MapaEventos from "@/ui/mapa/MapaEventos";
import FrecuenciaAvistamientos from "@/features/safaris/componentes/FrecuenciaAvistamientos";
import FenomenosEspana from "@/features/espana/FenomenosEspana";
import { fenomenosCerca } from "@/features/espana/fenomenos";
import {
  calendarioLugar,
  cargarEspana,
  contornoDe,
  lugarPorId,
  lugaresCerca,
  rasanteCerca,
  recientesLugar,
} from "@/features/espana/datos";
import { MESES } from "@/lib/fechas";
import { fechaLocal } from "@/lib/sol";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

const GRUPOS: [string, string][] = [
  ["Aves", "Aves"],
  ["Mammalia", "Mamíferos"],
  ["Reptilia", "Reptiles"],
  ["Amphibia", "Anfibios"],
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = lugarPorId(decodeURIComponent((await params).id));
  if (!l) return {};
  return {
    title: `Fauna en ${l.n}: qué ver y cuándo`,
    description: `${l.n} (${l.t.toLowerCase()}): qué especies se ven cada mes, fenómenos, aves vistas estos días y lugares cercanos para ver fauna.`,
  };
}

const RASANTE = "https://photo-recommender.vercel.app";
const fechaCorta = (f: string) => `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1].slice(0, 3)}`;

export default async function PaginaLugar({ params }: Props) {
  const id = decodeURIComponent((await params).id);
  const l = lugarPorId(id);
  if (!l) notFound();
  const hoy = fechaLocal(new Date());
  const mesHoy = Number(hoy.slice(5, 7)) - 1;
  const { filas, celdas } = calendarioLugar(l);
  const recientes = recientesLugar(l).slice(0, 25);
  const fenomenos = fenomenosCerca(l.lat, l.lon, l.r);
  const cerca = lugaresCerca(l.lat, l.lon, mesHoy, 9)
    .filter((x) => x.id !== l.id)
    .slice(0, 8);
  const { spots, rutas } = rasanteCerca(l);
  const espana = cargarEspana();
  const cita = espana?.fuente?.cita;
  const nombreEs = new Map(Object.values(espana?.especies ?? {}).map((x) => [x.c, x.n]));
  const enlace = l.id.startsWith("eb-")
    ? { href: `https://ebird.org/hotspot/${l.id.slice(3)}`, texto: "Ficha en eBird" }
    : l.id.startsWith("wd-")
      ? { href: `https://www.wikidata.org/wiki/${l.id.slice(3)}`, texto: "Wikidata" }
      : null;
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · <Link href="/espana">España</Link> · {l.t}
        </p>
        <h1>{l.n}</h1>
        <p className="entradilla">
          {l.e ? `${l.e} especies de aves vistas aquí en eBird. ` : ""}Qué se ve cada mes en sus{" "}
          {celdas === 1 ? "cuadrícula" : `${celdas} cuadrículas`} de 10 km
          {l.z ? " (las que toca su contorno de la Red Natura 2000)" : ""}, con datos de GBIF.
        </p>
        <p className="enlaces-lugar">
          <Link
            className="boton"
            href={`/espana?lat=${l.lat.toFixed(3)}&lon=${l.lon.toFixed(3)}&radio=${l.r <= 5 ? 5 : l.r <= 10 ? 10 : 20}&lugar=${encodeURIComponent(l.n)}`}
          >
            Qué veo aquí un día concreto, con luz y tiempo →
          </Link>{" "}
          <a href={`https://www.openstreetmap.org/directions?to=${l.lat}%2C${l.lon}`} target="_blank" rel="noopener">
            Cómo llegar ↗
          </a>
          {enlace && (
            <>
              {" · "}
              <a href={enlace.href} target="_blank" rel="noopener">
                {enlace.texto} ↗
              </a>
            </>
          )}
        </p>
      </header>

      <MapaEventos
        etiqueta={l.n}
        eventos={[
          {
            id: l.id,
            nombre: l.n,
            lat: l.lat,
            lon: l.lon,
            radio_km: l.r,
            categoria: "fauna",
            href: null,
            forma: contornoDe(l),
          },
        ]}
      />

      <FenomenosEspana fenomenos={fenomenos} mesHoy={mesHoy} />

      {GRUPOS.map(([clase, titulo]) => {
        const fs = filas.filter((f) => f.clase === clase);
        if (!fs.length) return null;
        return (
          <div key={clase}>
            <FrecuenciaAvistamientos
              titulo={`${titulo}: qué se ve cada mes`}
              mesHoy={mesHoy}
              unidad="observaciones"
              filas={fs.map((f) => ({
                nombre: f.nombre,
                href: `/espana?modo=donde&k=${f.clave}`,
                meses: f.meses,
                muestra: f.muestra,
              }))}
            />
          </div>
        );
      })}
      {!filas.length && <p className="nota-pie">Aún no hay datos de especies para este lugar.</p>}

      {recientes.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Visto estos días cerca</h2>
          <ul className="lista-recientes">
            {recientes.map((o) => (
              <li key={`${o.c}-${o.f}`}>
                {nombreEs.get(o.c) ? (
                  <>
                    <b>{nombreEs.get(o.c)}</b> <i>{o.c}</i>
                  </>
                ) : (
                  <i>{o.c}</i>
                )}{" "}
                · {fechaCorta(o.f)}
                {o.l ? ` en ${o.l.replace(/--/g, " · ")}` : ""}
              </li>
            ))}
          </ul>
          <p className="nota-pie">
            A menos de {l.r + 5} km: aves de <a href="https://ebird.org">eBird</a> (Cornell Lab of Ornithology, la
            última de cada especie en la provincia) y mamíferos, reptiles y anfibios de{" "}
            <a href="https://www.inaturalist.org">iNaturalist</a> (sin especies sensibles).
          </p>
        </section>
      )}

      {(spots.length > 0 || rutas.length > 0) && (
        <section className="seccion">
          <h2 className="rotulo">Fotografía y senderismo cerca</h2>
          {spots.length > 0 && (
            <>
              <h3>Spots de fotografía</h3>
              <ul className="lista-lugares">
                {spots.map((x) => (
                  <li key={x.id}>
                    <a href={`${RASANTE}/spot/${x.id}`} target="_blank" rel="noopener">
                      {x.n}
                    </a>{" "}
                    <small>a {x.km.toLocaleString("es-ES")} km</small>
                  </li>
                ))}
              </ul>
            </>
          )}
          {rutas.length > 0 && (
            <>
              <h3>Rutas de senderismo</h3>
              <ul className="lista-lugares">
                {rutas.map((x) => (
                  <li key={x.id}>
                    <a href={`${RASANTE}/ruta/${encodeURIComponent(x.id)}`} target="_blank" rel="noopener">
                      {x.n}
                    </a>{" "}
                    <small>
                      sale a {x.km.toLocaleString("es-ES")} km
                      {x.d ? ` · ${x.d}` : ""}
                      {x.c ? " · circular" : ""}
                    </small>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="nota-pie">
            De <a href={RASANTE}>Rasante</a>, la web hermana de previsión para fotografía de paisaje: luz de cada día y
            rutas de OpenStreetMap, FEDME y Caminos Naturales.
          </p>
        </section>
      )}

      {cerca.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Otros lugares cerca</h2>
          <ul className="lista-lugares">
            {cerca.map((c) => (
              <li key={c.id}>
                <Link href={`/espana/lugar/${encodeURIComponent(c.id)}`}>{c.n}</Link>{" "}
                <small>
                  {c.t} · a {c.km.toLocaleString("es-ES")} km
                  {c.especies ? ` · ${c.especies} especies este mes` : ""}
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="nota-pie">
        Frecuencia relativa: qué parte de las observaciones de su grupo en esas cuadrículas y ese mes son de cada
        especie (refleja también dónde y cuándo va la gente). {cita}. Lugares: eBird, Wikidata (CC0) y OpenStreetMap
        (ODbL).
      </p>
    </main>
  );
}
