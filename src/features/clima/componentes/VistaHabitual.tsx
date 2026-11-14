// «Lo habitual» de un mes (spec 013): el ranking de spots cuando no hay previsión, con el mismo listado y mapa
// que el ranking del día. Selector de mes y de momento con enlaces (funciona sin JavaScript).
import Link from "next/link";
import { cargarClima } from "@/features/clima/datos";
import {
  filasHabituales,
  NOMBRE_HABITUAL,
  rutaHabitual,
  type TipoHabitual,
  TIPOS_HABITUAL,
  urlHabitual,
} from "@/features/clima/habitual";
import CieloNocheMes from "@/features/eventos/componentes/CieloNocheMes";
import Mapa from "@/features/spots/componentes/MapaSpots";
import Ranking from "@/features/spots/componentes/Ranking";
import { TOP_HTML } from "@/features/spots/ranking";
import { MESES } from "@/lib/fechas";

const CUANTOS: Record<TipoHabitual, [string, string]> = {
  amanecer: ["cuántos amaneceres", "salen buenos"],
  atardecer: ["cuántos atardeceres", "salen buenos"],
  noche: ["cuántas noches", "salen despejadas"],
};

export default function VistaHabitual({ mes, tipo }: { mes: number; tipo: TipoHabitual }) {
  const clima = cargarClima();
  const filas = filasHabituales(mes, tipo);
  const top = filas.slice(0, TOP_HTML);
  return (
    <main className="portada habitual">
      <div className="columna">
        <header className="titular">
          <p className="rotulo">Lo habitual · sin previsión</p>
          <h1>
            {NOMBRE_HABITUAL[tipo]} en {MESES[mes]}: dónde suele ir mejor
          </h1>
          <p className="entradilla">
            La previsión llega a cinco días. Para cualquier otra fecha, esto es lo que suele pasar: {CUANTOS[tipo][0]}{" "}
            de {MESES[mes]} {CUANTOS[tipo][1]} en la zona de cada spot
            {clima ? ` (${clima.desde.slice(0, 4)}-${clima.hasta.slice(0, 4)})` : ""} y lo que da de sí el lugar
            {tipo === "noche" ? " (cielo oscuro y sur despejado)" : " (relieve hacia donde está el sol ese mes)"}. Es
            una orientación para elegir zona, no una nota: <Link href="/luz">cuando falten pocos días</Link>, manda la
            previsión.
          </p>
          <nav className="selector-habitual" aria-label="Momento">
            {TIPOS_HABITUAL.map((t) => (
              <Link key={t} href={rutaHabitual(mes, t)} aria-current={t === tipo ? "page" : undefined}>
                {NOMBRE_HABITUAL[t]}
              </Link>
            ))}
          </nav>
          <nav className="selector-habitual meses" aria-label="Mes">
            {MESES.map((m, i) => (
              <Link key={m} href={rutaHabitual(i, tipo)} aria-current={i === mes ? "page" : undefined}>
                {m.slice(0, 3)}
              </Link>
            ))}
          </nav>
        </header>
        {tipo === "noche" && <CieloNocheMes mes={mes} />}
        {filas.length === 0 ? (
          <p className="vacio">
            Aún no hay datos para esta página: se publican con el próximo cálculo de la previsión.
          </p>
        ) : (
          <section aria-label="Ranking" className="bloque-ranking">
            <h2 className="rotulo">
              Lo habitual · {NOMBRE_HABITUAL[tipo].toLowerCase()} · {MESES[mes]}
            </h2>
            <Ranking
              filas={top}
              total={filas.length}
              urlTodos={urlHabitual(mes, tipo)}
              mostrarMomento={false}
              comunidades={[...new Set(filas.map((f) => f.ccaa).filter((c): c is string => !!c))].sort()}
            />
          </section>
        )}
      </div>
      {filas.length > 0 && (
        <Mapa
          puntos={top.map((f) => ({
            id: f.id,
            nombre: f.nombre,
            lat: f.lat,
            lon: f.lon,
            nota: f.nota,
            cifra: f.cifra,
            clase: f.clase,
            texto: `${NOMBRE_HABITUAL[tipo]} · ${MESES[mes]}`,
          }))}
          urlTodos={urlHabitual(mes, tipo)}
        />
      )}
    </main>
  );
}
