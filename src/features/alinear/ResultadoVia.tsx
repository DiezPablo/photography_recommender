// El resultado de «La Vía Láctea sobre…» (spec 026): el cielo de la zona, dónde ponerse según hacia dónde se mire y
// las ventanas de noches sin luna en las que el núcleo pasa por encima del objeto.
import Link from "next/link";
import { rumboTexto } from "@/features/alinear/calculo";
import type { CieloCerca } from "@/features/alinear/datos";
import type { DireccionVia, VentanaVia } from "@/features/alinear/via";

const coord = (x: number) => x.toFixed(5);
const mapa = (lat: number, lon: number) =>
  `https://www.openstreetmap.org/?mlat=${coord(lat)}&mlon=${coord(lon)}#map=16/${coord(lat)}/${coord(lon)}`;
const metros = (m: number) =>
  m >= 1000 ? `${(m / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} km` : `${Math.round(m)} m`;
const diaLargo = (f: string) =>
  new Date(`${f}T12:00:00Z`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const momento = (t: Date, tz: string) =>
  t.toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz });

function Cielo({ cielo }: { cielo: CieloCerca | null }) {
  if (!cielo)
    return (
      <p className="nota-pie">
        No conocemos el cielo de esa zona. El núcleo solo se ve bien lejos de las ciudades: mira un mapa de
        contaminación lumínica antes de ir.
      </p>
    );
  const donde = `${cielo.nombre}, a ${cielo.km.toLocaleString("es-ES", { maximumFractionDigits: 0 })} km`;
  return cielo.bortle >= 5 ? (
    <p className="vacio" role="note">
      Cielo de la zona ≈ Bortle {cielo.bortle} ({cielo.descripcion}), según el spot más cercano ({donde}): con tanta luz
      el núcleo apenas se verá. Busca un objeto en un sitio más oscuro.
    </p>
  ) : (
    <p className="nota-pie">
      Cielo de la zona ≈ Bortle {cielo.bortle} ({cielo.descripcion}), según el spot más cercano ({donde}).
    </p>
  );
}

function Direccion({ d }: { d: DireccionVia }) {
  return (
    <li className={`item-plan${d.destacada ? " destacada" : ""}`}>
      <b className="que-plan">{Math.round(d.altura)}°</b>
      <span>
        Al {rumboTexto((d.rumbo + 180) % 360)} del objeto, mirando al {rumboTexto(d.rumbo)} ({d.rumbo}°): a unos{" "}
        {metros(d.dPropuesta)},{" "}
        <a href={mapa(d.lat, d.lon)} rel="noopener">
          {coord(d.lat)}, {coord(d.lon)}
        </a>
        <small>
          El núcleo pasa a {d.altura.toFixed(0)}° sobre el horizonte
          {d.destacada ? ", de lo más alto que llega aquí" : ""}. Más cerca de {metros(d.dMinima)}, el objeto lo tapa.
        </small>
      </span>
    </li>
  );
}

export default function ResultadoVia({
  direcciones,
  ventanas,
  cielo,
  tz,
}: {
  direcciones: DireccionVia[];
  ventanas: VentanaVia[];
  cielo: CieloCerca | null;
  tz: string;
}) {
  if (!direcciones.length)
    return <p className="vacio">Desde esta latitud el núcleo no sube lo bastante sobre el horizonte.</p>;
  return (
    <>
      <Cielo cielo={cielo} />
      <section className="dia-plan" aria-labelledby="via-donde">
        <h2 id="via-donde">Dónde ponerte</h2>
        <p className="nota-pie">
          El núcleo pasa cada noche por las mismas direcciones a la misma altura, unos cuatro minutos antes que la
          anterior. Elige hacia dónde mirar; la distancia solo cambia lo grande que sale el objeto (la propuesta lo deja
          a un tercio de la altura del núcleo).
        </p>
        <ol className="lista-cerca-catalogo resultados">
          {direcciones.map((d) => (
            <Direccion key={d.rumbo} d={d} />
          ))}
        </ol>
      </section>
      {ventanas.length ? (
        ventanas.map((v) => (
          <article key={v.inicio} className="dia-plan" aria-labelledby={`via-${v.inicio}`}>
            <h2 id={`via-${v.inicio}`}>
              Noches del {diaLargo(v.inicio)} al {diaLargo(v.fin)}
            </h2>
            <ol className="lista-cerca-catalogo resultados">
              {v.tramos.map((x) => (
                <li key={x.direccion.rumbo} className={`item-plan${x.direccion.destacada ? " destacada" : ""}`}>
                  <b className="que-plan">{x.direccion.rumbo}°</b>
                  <span>
                    Mirando al {rumboTexto(x.direccion.rumbo)}: {momento(x.primera, tz)}
                    {x.noches > 1 ? ` … ${momento(x.ultima, tz)}` : ""}
                    <small>
                      {x.noches} {x.noches === 1 ? "noche" : "noches"} sin luna y de noche cerrada · núcleo a{" "}
                      {x.direccion.altura.toFixed(0)}°
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))
      ) : (
        <p className="vacio">
          Ninguna noche sin luna con el núcleo sobre el objeto en estos doce meses. Prueba con otra fecha de inicio.
        </p>
      )}
      <p className="nota-pie">
        Noche cerrada es el sol a más de 18° bajo el horizonte; sin luna, que esté bajo el horizonte o casi nueva. Solo
        es geometría: no sabe si hay algo en medio ni si el sitio es accesible, y el núcleo necesita cielo despejado y
        oscuro. Cinco días antes, mira la nota de noche en <Link href="/luz">Hoy</Link>.
      </p>
    </>
  );
}
