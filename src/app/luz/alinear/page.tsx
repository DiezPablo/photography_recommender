// La luna llena sobre un objeto (spec 025, decisión 0026): /luz/alinear?punto=lat,lon&altura=m[&desnivel=m&desde=…].
// Para un objeto, las salidas y puestas de la luna casi llena de los próximos doce meses en las que se puede ver
// apoyada en lo alto, y desde dónde a cada distancia. La URL reproduce la consulta; sin JavaScript se ve igual.
import type { Metadata } from "next";
import Link from "next/link";
import { EJEMPLO, leerAlinear, urlAlinear } from "@/features/alinear/alinear";
import { type Cita, citas, luz, rumboTexto } from "@/features/alinear/calculo";
import FormularioAlinear from "@/features/alinear/FormularioAlinear";
import { zonaHoraria } from "@/lib/sol";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const c = leerAlinear(await searchParams);
  return {
    title: c.nombre ? `La luna sobre ${c.nombre}` : "La luna sobre un objeto",
    description: "Cuándo y desde dónde sale o se pone la luna llena justo encima de un edificio o un pico.",
  };
}

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
  const r = listo
    ? citas({ lat: c.lat!, lon: c.lon!, altura: c.altura!, desnivel: c.desnivel }, new Date(`${c.desde}T00:00:00Z`))
    : [];
  return (
    <main className="buscar plan alinear">
      <header className="titular">
        <p className="rotulo">Luna llena · los próximos doce meses</p>
        <h1>{c.nombre ? `La luna sobre ${c.nombre}` : "La luna sobre un objeto"}</h1>
        <p className="entradilla">
          Dinos dónde está el edificio o el pico y cuánto mide: te decimos qué días sale o se pone la luna llena justo
          encima y dónde ponerte, según lo lejos que quieras estar.
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
          Ejemplo:{" "}
          <Link href={urlAlinear(EJEMPLO)}>
            {EJEMPLO.nombre}, {EJEMPLO.altura} m
          </Link>
          . Las coordenadas se copian de cualquier mapa (en Google Maps, con un clic derecho sobre el sitio).
        </p>
      )}
      {listo &&
        (r.length ? (
          r.map((x) => <Resultado key={x.instante.getTime()} cita={x} tz={tz} altura={c.altura!} />)
        ) : (
          <p className="vacio">
            Ninguna luna llena queda sobre el objeto con algo de luz en estos doce meses. Prueba con otra fecha de
            inicio o revisa la altura.
          </p>
        ))}
      {listo && (
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
