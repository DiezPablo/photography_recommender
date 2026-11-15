// La ficha de un evento de naturaleza (paisaje o fauna): cuándo, dónde, para la foto, el tiempo habitual y los
// spots cercanos. La usan /luz/evento/[id] (paisaje) y /fauna/evento/[id] (fauna, spec 014).
import Link from "next/link";
import BarraAnual from "@/features/eventos/componentes/BarraAnual";
import MapaEventos from "@/ui/mapa/MapaEventos";
import ClimaSpot from "@/features/clima/componentes/ClimaSpot";
import { fenomenoDeEvento } from "@/features/fauna/eventoFauna";
import {
  ambito,
  cargarEventos,
  rutaCalendario,
  fechaCorta,
  fechaLarga,
  type EventoNaturaleza,
  MESES,
  mesDe,
  proximaTemporada,
  spotsCerca,
} from "@/features/eventos/datos";

export default function FichaEvento({ e }: { e: EventoNaturaleza }) {
  const eventos = cargarEventos();
  if (!eventos) return null;
  const hoy = eventos.desde;
  const temporada = proximaTemporada(e, hoy);
  const lunasNuevas = eventos.luna.filter(
    (l) => l.fase === "nueva" && l.fecha >= temporada.desde && l.fecha <= temporada.hasta,
  );
  const spots = spotsCerca(e);
  const fenomeno = fenomenoDeEvento(e.id);

  return (
    <main className={`ficha evento cat-${e.categoria}`}>
      <nav className="migas rotulo" aria-label="Migas">
        {ambito(e) === "fauna" && <Link href="/fauna">Fauna</Link>}
        <Link href={rutaCalendario(ambito(e))}>Calendario</Link>
        <Link href={rutaCalendario(ambito(e), mesDe(e.pico))}>{MESES[mesDe(e.pico)]}</Link>
      </nav>
      <header className="ficha-cab">
        <p className={`rotulo cat-${e.categoria}`}>
          <span className="punto-cat" aria-hidden /> {eventos.categorias[e.categoria]} · {e.lugar}
          {e.provincia && ` (${e.provincia})`}
        </p>
        <h1>{e.nombre}</h1>
        <p className="entradilla">{e.descripcion}</p>
        {fenomeno && (
          <p className="enlace-fenomeno">
            <Link href={`/fauna/evento/${fenomeno.id}`}>
              {fenomeno.nombre}: los {fenomeno.eventos.length} lugares →
            </Link>
          </p>
        )}
        <div className="temporada">
          <p>
            {temporada.ahora ? (
              <>
                <b>Ahora mismo</b>, hasta el {fechaLarga(temporada.hasta)}
              </>
            ) : (
              <>
                <b>Próxima temporada:</b> del {fechaLarga(temporada.desde, false)} al {fechaLarga(temporada.hasta)}
              </>
            )}
            . Mejor hacia el {fechaCorta(e.pico)}.
          </p>
          <BarraAnual evento={e} mesActual={Number(hoy.slice(5, 7)) - 1} />
        </div>
      </header>

      <div className="ficha-grid">
        <section className="seccion">
          <h2 className="rotulo">Dónde</h2>
          <MapaEventos
            eventos={[
              { id: e.id, nombre: e.nombre, lat: e.lat, lon: e.lon, radio_km: e.radio_km, categoria: e.categoria },
            ]}
            spots={spots}
            etiqueta={`Mapa de ${e.nombre}`}
          />
          <p className="leyenda-mapa">
            <span>
              <i className="leyenda-area" /> zona, unos {e.radio_km} km alrededor
            </span>
            {spots.length > 0 && (
              <span>
                <i className="leyenda-spot" /> spots
              </span>
            )}
          </p>
        </section>
        <section className="seccion">
          <h2 className="rotulo">Para la foto</h2>
          <p>{e.consejo}</p>
          {e.dormidero && (
            <p>
              <b>Dormidero:</b> {e.dormidero}
            </p>
          )}
          {lunasNuevas.length > 0 && (
            <p>
              Noches más oscuras de la temporada (luna nueva):{" "}
              {lunasNuevas.map((l) => fechaLarga(l.fecha, false)).join(", ")}.
            </p>
          )}
          <p className="nota-pie">
            Las fechas son las habituales y cambian cada año con el tiempo. Confirma antes de ir con el espacio natural
            o la oficina de turismo, respeta los accesos y no salgas de los caminos con la fauna.
          </p>
          {(e.fuentes?.length ?? 0) > 0 && (
            <p className="nota-pie">
              {e.fuentes!.map((u, i) => (
                <span key={u}>
                  {i > 0 ? " · " : ""}
                  <a href={u} target="_blank" rel="noopener">
                    {e.fuentes!.length > 1 ? `Fuente ${i + 1} ↗` : "Fuente ↗"}
                  </a>
                </span>
              ))}
            </p>
          )}
        </section>
      </div>

      <ClimaSpot lat={e.lat} lon={e.lon} mes={mesDe(e.pico)} titulo="El tiempo habitual en la zona" />

      {spots.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Spots en la zona</h2>
          <ul className="lista-cercanos">
            {spots.map((s) => (
              <li key={s.id}>
                <Link href={`/luz/spot/${s.id}`}>{s.nombre}</Link>
                <small>
                  {s.tipo ? `${s.tipo} · ` : ""}a {Math.round(s.km)} km
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
