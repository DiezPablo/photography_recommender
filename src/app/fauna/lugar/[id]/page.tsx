// Ficha de un lugar de fauna en España (punto de eBird, espacio protegido u observatorio): qué se ve cada mes en
// sus cuadrículas, fenómenos, aves vistas estos días, cómo llegar y lugares cercanos. Se genera al visitarla (ISR).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MapaEventos from "@/ui/mapa/MapaEventos";
import CalendarioPorGrupo from "@/features/fauna/CalendarioPorGrupo";
import FenomenosEspana from "@/features/fauna/FenomenosEspana";
import ListaRarezas from "@/features/fauna/ListaRarezas";
import GuardarSinConexion from "@/ui/GuardarSinConexion";
import TarjetaHide from "@/features/fauna/TarjetaHide";
import { hidesCerca } from "@/features/fauna/hides";
import LuzYMar from "@/features/fauna/LuzYMar";
import { direccionesSol, rumbo } from "@/lib/sol";
import { fenomenosCerca } from "@/features/fauna/fenomenos";
import {
  actividadPunto,
  calendarioLugar,
  cargarEspana,
  contornoDe,
  lugarPorId,
  lugaresCerca,
  rutasCerca,
  rarezasCerca,
  claveDe,
  recientesLugar,
} from "@/features/fauna/datos";
import { MESES } from "@/lib/fechas";
import { fechaLocal } from "@/lib/sol";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = true;
// una vez al día: «hoy» (luz, mareas, mes actual) y lo visto estos días cambian
export const revalidate = 86400;

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

const fechaCorta = (f: string) => `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1].slice(0, 3)}`;

export default async function PaginaLugar({ params }: Props) {
  const id = decodeURIComponent((await params).id);
  const l = lugarPorId(id);
  if (!l) notFound();
  const hoy = fechaLocal(new Date());
  const mesHoy = Number(hoy.slice(5, 7)) - 1;
  const { filas } = calendarioLugar(l);
  const recientes = recientesLugar(l).slice(0, 25);
  const fenomenos = fenomenosCerca(l.lat, l.lon, l.r);
  const cerca = lugaresCerca(l.lat, l.lon, mesHoy, 9)
    .filter((x) => x.id !== l.id)
    .slice(0, 8);
  const rutas = rutasCerca(l);
  const hides = hidesCerca(l.lat, l.lon, 60).slice(0, 6);
  const actividad = actividadPunto(l.id);
  const rarezas = rarezasCerca(l.lat, l.lon, 30).slice(0, 12);
  const sol = direccionesSol(hoy, l.lat, l.lon);
  const espana = cargarEspana();
  const cita = espana?.fuente?.cita;
  const probables = filas.filter((f) => (f.meses[mesHoy] ?? 0) >= 5).length;
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
          <Link href="/fauna">Fauna</Link> · {l.t}
        </p>
        <h1>{l.n}</h1>
        <p className="entradilla">
          {probables} especies frecuentes en los registros de {MESES[mesHoy]}
          {l.e ? ` · ${l.e} aves vistas en eBird` : ""}
          {fenomenos.some((f) => f.meses.includes(mesHoy + 1)) ? " · hay un fenómeno de temporada ahora" : ""}
        </p>
        {actividad && (
          <p className="actividad-ebird">
            {actividad.l7 > 0 ? (
              <>
                <b>
                  {actividad.l7} {actividad.l7 === 1 ? "lista" : "listas"} de eBird en los últimos 7 días
                </b>{" "}
                ({actividad.l30} en 30).
              </>
            ) : (
              <>
                {actividad.l30} {actividad.l30 === 1 ? "lista" : "listas"} de eBird en los últimos 30 días.
              </>
            )}{" "}
            La última, el {fechaCorta(actividad.u)}
            {actividad.e > 0 ? `, con ${actividad.e} especies` : ""}.
          </p>
        )}
        <p className="enlaces-lugar">
          <Link
            className="boton"
            href={`/fauna?lat=${l.lat.toFixed(3)}&lon=${l.lon.toFixed(3)}&radio=${l.r <= 5 ? 5 : l.r <= 10 ? 10 : 20}&lugar=${encodeURIComponent(l.n)}`}
          >
            Qué veo aquí un día concreto, con luz y tiempo →
          </Link>{" "}
          <span className="enlaces-secundarios">
            <a href={`https://www.openstreetmap.org/directions?to=${l.lat}%2C${l.lon}`} target="_blank" rel="noopener">
              Cómo llegar ↗
            </a>
            {enlace && (
              <a href={enlace.href} target="_blank" rel="noopener">
                {enlace.texto} ↗
              </a>
            )}
            <GuardarSinConexion />
          </span>
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
        rumbos={[
          ...(sol.sale !== null
            ? [{ grados: sol.sale, etiqueta: `Sale el sol (${rumbo(sol.sale)})`, color: "#e3a020" }]
            : []),
          ...(sol.pone !== null
            ? [{ grados: sol.pone, etiqueta: `Se pone el sol (${rumbo(sol.pone)})`, color: "#b0533c" }]
            : []),
        ]}
      />
      {contornoDe(l) && (
        <p className="nota-pie credito-contorno">
          Contorno: Red Natura 2000, <a href="https://www.eea.europa.eu/">Agencia Europea de Medio Ambiente</a> (CC BY
          4.0).
        </p>
      )}

      <FenomenosEspana fenomenos={fenomenos} mesHoy={mesHoy} />

      <CalendarioPorGrupo
        mesHoy={mesHoy}
        grupos={GRUPOS.map(([clase, titulo]) => ({
          clase,
          titulo,
          filas: filas
            .filter((f) => f.clase === clase)
            .map((f) => ({ nombre: f.nombre, href: `/fauna/especie/${f.clave}`, meses: f.meses, muestra: f.muestra })),
        })).filter((g) => g.filas.length)}
      />
      {!filas.length && <p className="nota-pie">Aún no hay datos de especies para este lugar.</p>}

      {recientes.length > 0 && (
        <details className="seccion plegable">
          <summary className="rotulo">Visto estos días cerca ({recientes.length})</summary>
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
        </details>
      )}

      {hides.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Hides y salidas guiadas cerca</h2>
          <ul className="lista-hides">
            {hides.map((h) => (
              <TarjetaHide key={h.id} h={h} km={h.km} />
            ))}
          </ul>
          <p className="nota-pie">
            <Link href="/fauna/hides">Todos los hides y salidas →</Link>
          </p>
        </section>
      )}

      <details className="seccion plegable">
        <summary className="rotulo">Luz y mareas hoy</summary>
        <LuzYMar lat={l.lat} lon={l.lon} fecha={hoy} />
      </details>

      {rarezas.length > 0 && (
        <details className="seccion plegable">
          <summary className="rotulo">Rarezas a menos de 30 km esta semana ({rarezas.length})</summary>
          <ListaRarezas
            obs={rarezas}
            claves={Object.fromEntries(rarezas.map((o) => [o.c, claveDe(o.c)]))}
            conDistancia
          />
          <p className="nota-pie">
            Observaciones notables de <a href="https://ebird.org">eBird</a>.{" "}
            <Link href="/fauna/rarezas">Todas las de España →</Link>
          </p>
        </details>
      )}

      {rutas.length > 0 && (
        <details className="seccion plegable">
          <summary className="rotulo">Rutas de senderismo cerca ({rutas.length})</summary>
          <ul className="lista-lugares">
            {rutas.map((x) => (
              <li key={x.id}>
                <a href={`https://www.openstreetmap.org/relation/${x.id}`} target="_blank" rel="noopener">
                  {x.ref && !x.n.includes(x.ref) ? `${x.ref} · ${x.n}` : x.n}
                </a>{" "}
                <small>
                  {x.km ? `${x.km.toLocaleString("es-ES")} km · ` : ""}su centro a {x.a.toLocaleString("es-ES")} km
                </small>
              </li>
            ))}
          </ul>
          <p className="nota-pie">Rutas señalizadas de OpenStreetMap (ODbL).</p>
        </details>
      )}

      {cerca.length > 0 && (
        <details className="seccion plegable">
          <summary className="rotulo">Otros lugares cerca ({cerca.length})</summary>
          <ul className="lista-lugares">
            {cerca.map((c) => (
              <li key={c.id}>
                <Link href={`/fauna/lugar/${encodeURIComponent(c.id)}`}>{c.n}</Link>{" "}
                <small>
                  {c.t} · a {c.km.toLocaleString("es-ES")} km
                  {c.especies ? ` · ${c.especies} especies este mes` : ""}
                </small>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="nota-pie">
        Frecuencia relativa: qué parte de las observaciones de su grupo en esas cuadrículas y ese mes son de cada
        especie (refleja también dónde y cuándo va la gente). {cita}. Lugares: eBird, Wikidata (CC0) y OpenStreetMap
        (ODbL).
      </p>
    </main>
  );
}
