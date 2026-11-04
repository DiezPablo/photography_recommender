// Ficha de una especie en España: cuándo se ve (curva del año), dónde (mejores lugares), sus momentos especiales,
// a qué hora está activa, cómo fotografiarla, hides y salidas, y lo visto estos días. ISR, una vez al día.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FrecuenciaAvistamientos from "@/features/safaris/componentes/FrecuenciaAvistamientos";
import FenomenosEspana from "@/features/espana/FenomenosEspana";
import TarjetaHide from "@/features/espana/TarjetaHide";
import BotonVista from "@/features/espana/BotonVista";
import { fenomenosDe } from "@/features/espana/fenomenos";
import { hidesDe } from "@/features/espana/hides";
import { fotografiaDe } from "@/features/espana/fotografia";
import {
  actividadDe,
  cargarEspana,
  curvaEspecie,
  deteccionEspecie,
  lugaresDe,
  recientesDe,
} from "@/features/espana/datos";
import { MESES, rangoMeses } from "@/lib/fechas";
import { fechaLocal } from "@/lib/sol";

type Props = { params: Promise<{ clave: string }> };

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

const GRUPO: Record<string, string> = { Aves: "Ave", Mammalia: "Mamífero", Reptilia: "Reptil", Amphibia: "Anfibio" };
// especies que se persiguen o se cogen: nada reciente con lugar (como en el pipeline)
const SENSIBLES = new Set([
  "Lynx pardinus",
  "Ursus arctos",
  "Canis lupus",
  "Galemys pyrenaicus",
  "Testudo graeca",
  "Testudo hermanni",
  "Mustela lutreola",
  "Aquila adalberti",
  "Tetrao urogallus",
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clave } = await params;
  const e = cargarEspana()?.especies[clave];
  if (!e) return {};
  const nombre = e.n ?? e.c ?? "Especie";
  return {
    title: `Dónde y cuándo ver ${nombre.toLowerCase()} en España`,
    description: `${nombre} (${e.c}): en qué meses se ve, los mejores lugares, momentos especiales, cómo fotografiarla y hides en España.`,
  };
}

export default async function PaginaEspecie({ params }: Props) {
  const { clave } = await params;
  if (!/^\d+$/.test(clave)) notFound();
  const espana = cargarEspana();
  const e = espana?.especies[clave];
  if (!e) notFound();
  const nombre = e.n ?? e.c ?? "Especie";
  const hoy = fechaLocal(new Date());
  const mesHoy = Number(hoy.slice(5, 7)) - 1;
  const curva = curvaEspecie(clave);
  const deteccion = e.clase === "Aves" ? deteccionEspecie(clave) : null;
  const buenos = curva.meses.flatMap((v, i) => ((v ?? 0) >= 20 ? [i + 1] : []));
  const lugares = lugaresDe(clave, null, 12);
  const foto = fotografiaDe(e.c);
  const act = actividadDe(e.c);
  const hides = hidesDe(e.c);
  const sensible = e.c ? SENSIBLES.has(e.c) : false;
  const recientes = sensible ? [] : recientesDe(e.c).slice(0, 8);
  const tramos = ["de noche", "al amanecer y al atardecer", "de día"];
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · <Link href="/espana">España</Link> · {GRUPO[e.clase ?? ""] ?? "Especie"}
        </p>
        <h1>{nombre}</h1>
        <p className="entradilla">
          <i>{e.c}</i>. Registrada en {curva.celdas.toLocaleString("es-ES")} cuadrículas de 10 km de España
          {buenos.length ? `; mejor época: ${rangoMeses(buenos)}` : ""}.
        </p>
        <p>
          <BotonVista clave={clave} especie={{ n: nombre, c: e.c, clase: e.clase ?? null }} />{" "}
          <Link className="boton" href={`/espana?modo=donde&k=${clave}`}>
            Mapa: dónde verla cada mes →
          </Link>
        </p>
        {e.estado === "invasora" && (
          <p className="aviso-plan">Especie exótica invasora (Catálogo español): no es fauna autóctona.</p>
        )}
        {e.nota && <p className="aviso-plan">Ojo: {e.nota}.</p>}
        {sensible && (
          <p className="aviso-plan">
            Especie sensible: aquí solo zonas y meses, nunca puntos ni avistamientos recientes. Obsérvala con guía, a
            distancia y sin molestar.
          </p>
        )}
      </header>

      <FrecuenciaAvistamientos
        titulo="Cuándo se ve en España, mes a mes"
        unidad="observaciones"
        mesHoy={mesHoy}
        filas={[{ nombre, meses: curva.meses, muestra: curva.muestra }]}
      />

      {deteccion && (
        <p className="nota-pie">
          En eBird sale en el {deteccion.pct.map((p, i) => (p === null ? null : `${p} %`))[mesHoy] ?? "–"} de las listas
          de España en {MESES[mesHoy]}; su mejor mes,{" "}
          {MESES[deteccion.pct.reduce<number>((a, v, i) => ((v ?? 0) > (deteccion.pct[a] ?? 0) ? i : a), 0)]} (
          {Math.max(...deteccion.pct.map((v) => v ?? 0))} %). En los mejores sitios el porcentaje es mucho mayor.
        </p>
      )}

      <FenomenosEspana fenomenos={fenomenosDe(e.c)} mesHoy={mesHoy} titulo="Momentos especiales" />

      {(foto || act) && (
        <section className="seccion">
          <h2 className="rotulo">Para fotografiarla</h2>
          {foto && (
            <p>
              Unos {foto.cm} cm ·{" "}
              {foto.dificultad === 1 ? "fácil" : foto.dificultad === 2 ? "dificultad media" : "difícil"}. {foto.consejo}
            </p>
          )}
          {act && (
            <p>
              Más activa {tramos[act.f.indexOf(Math.max(...act.f))]}
              {act.f.filter((x) => x >= 0.7).length > 1
                ? ` (también ${act.f
                    .map((x, i) => (x >= 0.7 && x < Math.max(...act.f) ? tramos[i] : null))
                    .filter(Boolean)
                    .join(" y ")})`
                : ""}
              , según la hora de {act.n} observaciones en iNaturalist comparadas con las de su grupo.
            </p>
          )}
        </section>
      )}

      {lugares.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Dónde verla</h2>
          <ol className="lista-lugares">
            {lugares.map((l) => {
              const mejor = l.meses.reduce<number>((a, v, i) => ((v ?? 0) > (l.meses[a] ?? 0) ? i : a), 0);
              return (
                <li key={l.celda}>
                  {l.lugar && l.lugar.km < 15 ? (
                    <Link href={`/espana/lugar/${encodeURIComponent(l.lugar.id)}`}>{l.lugar.nombre}</Link>
                  ) : l.lugar ? (
                    `A ${l.lugar.km} km de ${l.lugar.nombre}`
                  ) : (
                    `Cuadrícula en ${l.lat.toFixed(2)}, ${l.lon.toFixed(2)}`
                  )}{" "}
                  <small>
                    {l.celdas > 1 ? `${l.celdas} cuadrículas · ` : ""}mejor en {MESES[mejor]}
                  </small>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {hides.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Hides y salidas guiadas</h2>
          <ul className="lista-hides">
            {hides.map((h) => (
              <TarjetaHide key={h.id} h={h} />
            ))}
          </ul>
        </section>
      )}

      {recientes.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Vista estos días</h2>
          <ul className="lista-lugares">
            {recientes.map((o) => (
              <li key={`${o.f}-${o.lat}-${o.lon}`}>
                {Number(o.f.slice(8, 10))} {MESES[Number(o.f.slice(5, 7)) - 1].slice(0, 3)}
                {o.l ? ` · ${o.l.replace(/--/g, " · ")}` : ` · cerca de ${o.lat}, ${o.lon}`}{" "}
                <small>({o.s === "i" ? "iNaturalist" : "eBird"})</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="nota-pie">
        Frecuencia relativa en su grupo (GBIF por cuadrícula de 10 km): refleja también dónde y cuándo va la gente.{" "}
        {espana?.fuente?.cita}.
      </p>
    </main>
  );
}
