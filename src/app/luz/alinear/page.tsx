// La luna llena o la Vía Láctea sobre un objeto (specs 025 y 026, decisiones 0026 y 0027):
// /luz/alinear?[astro=via&]punto=lat,lon&altura=m[&desnivel=m&desde=…]. Con la luna, las salidas y puestas de la luna
// casi llena de los próximos doce meses en las que se ve apoyada en lo alto, y desde dónde a cada distancia; con la Vía
// Láctea, hacia dónde mirar y las noches sin luna en que el núcleo pasa por encima. Sin JavaScript se ve igual.
import type { Metadata } from "next";
import Link from "next/link";
import { EJEMPLO, EJEMPLO_VIA, leerAlinear, urlAlinear } from "@/features/alinear/alinear";
import { type Cita, citas, luz, rumboTexto } from "@/features/alinear/calculo";
import { cieloCerca } from "@/features/alinear/datos";
import FormularioAlinear from "@/features/alinear/FormularioAlinear";
import ResultadoVia from "@/features/alinear/ResultadoVia";
import { ventanasVia } from "@/features/alinear/via";
import { zonaHoraria } from "@/lib/sol";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const c = leerAlinear(await searchParams);
  return { title: titulo(c.astro, c.nombre), description: DESCRIPCION[c.astro] };
}

const titulo = (astro: "luna" | "via", nombre: string) =>
  `${astro === "via" ? "La Vía Láctea" : "La luna"} sobre ${nombre || "un objeto"}`;
const DESCRIPCION = {
  luna: "Cuándo y desde dónde sale o se pone la luna llena justo encima de un edificio o un pico.",
  via: "Qué noches sin luna y desde dónde se ve el núcleo de la Vía Láctea justo encima de un edificio o un pico.",
};

const fecha = (t: Date, tz: string) =>
  t.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
const hora = (t: Date, tz: string) =>
  t.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: tz });
const coord = (x: number) => x.toFixed(5);
const mapa = (lat: number, lon: number) =>
  `https://www.openstreetmap.org/?mlat=${coord(lat)}&mlon=${coord(lon)}#map=16/${coord(lat)}/${coord(lon)}`;

function Resultado({ cita, tz, altura }: { cita: Cita; tz: string; altura: number }) {
  const id = `cita-${cita.instante.getTime()}`;
  return (
    <article className="dia-plan" aria-labelledby={id}>
      <h2 id={id}>
        {fecha(cita.instante, tz)}
        <small>
          {" "}
          · la luna {cita.momento} al {Math.round(cita.iluminacion * 100)} %
        </small>
      </h2>
      <ol className="lista-cerca-catalogo resultados">
        {cita.filas.map((f) => (
          <li key={f.km} className={`item-plan${f.destacada ? " destacada" : ""}`}>
            <b className="que-plan">{hora(f.instante, tz)}</b>
            <span>
              A {f.km} km, al {rumboTexto((f.rumbo + 180) % 360)} del objeto:{" "}
              <a href={mapa(f.lat, f.lon)} rel="noopener">
                {coord(f.lat)}, {coord(f.lon)}
              </a>
              <small>
                Mira hacia el {rumboTexto(f.rumbo)} ({Math.round(f.rumbo)}°), a {f.alturaObjeto.toFixed(1)}° sobre el
                horizonte · {luz(f.sol)} (sol a {Math.round(f.sol)}°)
                {f.destacada ? " · la mejor luz" : ""}
              </small>
              <small>
                La luna mide {Math.round(f.diametroLuna)} m a esa distancia:{" "}
                {Math.round((f.diametroLuna / altura) * 100)} % de la altura del objeto
              </small>
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

export default async function PaginaAlinear({ searchParams }: Props) {
  const c = leerAlinear(await searchParams);
  const listo = c.lat !== null && c.lon !== null && c.altura !== null;
  const tz = listo ? zonaHoraria(c.lon!) : "Europe/Madrid";
  const objeto = listo ? { lat: c.lat!, lon: c.lon!, altura: c.altura!, desnivel: c.desnivel } : null;
  const inicio = new Date(`${c.desde}T00:00:00Z`);
  const via = c.astro === "via";
  const r = objeto && !via ? citas(objeto, inicio) : [];
  const v = objeto && via ? ventanasVia(objeto, inicio, tz) : null;
  return (
    <main className="buscar plan alinear">
      <header className="titular">
        <p className="rotulo">{via ? "Núcleo de la Vía Láctea" : "Luna llena"} · los próximos doce meses</p>
        <h1>{titulo(c.astro, c.nombre)}</h1>
        <p className="entradilla">
          {via
            ? "Dinos dónde está el edificio o el pico y cuánto mide: te decimos hacia dónde mirar, desde dónde y qué noches sin luna pasa el núcleo de la Vía Láctea justo encima."
            : "Dinos dónde está el edificio o el pico y cuánto mide: te decimos qué días sale o se pone la luna llena justo encima y dónde ponerte, según lo lejos que quieras estar."}
        </p>
      </header>
      <FormularioAlinear c={c} />
      {c.error && (
        <p className="vacio" role="alert">
          {c.error}
        </p>
      )}
      {!listo && !c.error && (
        <p className="nota-pie">
          Ejemplos: la luna sobre las{" "}
          <Link href={urlAlinear(EJEMPLO)}>
            {EJEMPLO.nombre}, {EJEMPLO.altura} m
          </Link>
          ; la Vía Láctea sobre <Link href={urlAlinear(EJEMPLO_VIA)}>{EJEMPLO_VIA.nombre} (La Palma)</Link>. Las
          coordenadas se copian de cualquier mapa (en Google Maps, con un clic derecho sobre el sitio).
        </p>
      )}
      {v && <ResultadoVia {...v} cielo={cieloCerca(c.lat!, c.lon!)} tz={tz} />}
      {listo &&
        !via &&
        (r.length ? (
          r.map((x) => <Resultado key={x.instante.getTime()} cita={x} tz={tz} altura={c.altura!} />)
        ) : (
          <p className="vacio">
            Ninguna luna llena queda sobre el objeto con algo de luz en estos doce meses. Prueba con otra fecha de
            inicio o revisa la altura.
          </p>
        ))}
      {listo && !via && (
        <p className="nota-pie">
          Más lejos, la luna sale más grande al lado del objeto, pero hace falta más objetivo y un aire más limpio.
          Cuenta solo la geometría: no sabe si hay edificios, árboles o relieve en medio, ni si el sitio es accesible;
          míralo en el mapa antes de ir. Si tu sitio está más bajo que la base del objeto, pon la diferencia en «Su
          base, más alta que tú»: cambia la hora y la distancia. La hora puede variar un par de minutos por la
          refracción. Cinco días antes, mira en <Link href="/luz">Hoy</Link> si el cielo va despejado hacia la luna.
        </p>
      )}
    </main>
  );
}
