// Ficha de un parque del mundo que no está en el catálogo escrito a mano: todo sale de datos abiertos
// (Wikidata, GBIF, NASA, OurAirports, OpenStreetMap) y de iNaturalist en directo.
import Link from "next/link";
import { reglasNombres } from "@/features/safaris/nombres";
import { Suscribir } from "@/ui/Suscribir";
import { Frescura } from "@/ui/Frescura";
import AvisoCierre from "@/features/safaris/componentes/AvisoCierre";
import { REVISADO, practicoDe } from "@/features/safaris/paises";
import FotoGrande from "@/ui/FotoGrande";
import CartaParque from "@/features/carta/CartaParque";
import { aeropuertosCarta } from "@/features/carta/aeropuertos";
import { ZONAS_PARQUE, zonasRecomendadas } from "@/features/safaris/zonasParque";
import { INICIALES, MESES } from "@/lib/fechas";
import { CincoGrandes, CombinaCon } from "@/features/safaris/componentes/ComplementosSafari";
import BotonComparar from "./BotonComparar";
import BotonViaje from "./BotonViaje";
import { estanciaDe } from "@/features/safaris/estancias";
import { exclusionesDe, nombreEstrella } from "@/features/safaris/datos";
import ResumenParque from "./ResumenParque";
import IndiceFicha from "./IndiceFicha";
import OrganizaViaje from "@/features/safaris/componentes/OrganizaViaje";
import VistoAhora from "@/features/safaris/componentes/VistoAhora";
import {
  buenaEpoca,
  CLASE,
  type Mundo,
  nombreEspecieMundo,
  type ParqueMundo,
  TEXTO_MOTIVO,
  urlWeb,
} from "@/features/safaris/modelo";

/** Mamíferos que se listan en la ficha (los datos guardan hasta 40 por parque para la carta del mundo). */
const EN_FICHA = 12;

function Barras({ valores, clase, titulo }: { valores: number[]; clase?: string; titulo: (v: number) => string }) {
  const max = Math.max(1, ...valores);
  return (
    <>
      {valores.map((v, i) => (
        <span role="cell" key={i} title={`${MESES[i]}: ${titulo(v)}`} className={`barra-ano ${clase ?? ""}`}>
          <i style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
        </span>
      ))}
    </>
  );
}

export default function FichaMundo({
  p,
  mundo,
  mesHoy,
  conFicha,
}: {
  p: ParqueMundo;
  mundo: Mundo;
  mesHoy: number;
  /** nombre científico del catálogo → slug de su página de especie */
  conFicha: Record<string, string>;
}) {
  const pais = p.pais ? mundo.paises[p.pais] : undefined;
  const epoca = buenaEpoca({ la: p.lat, sec: p.meses_secos, ep: p.epoca?.meses, em: p.epoca?.motivo });
  const motivo = epoca ? (p.epoca?.motivo ?? "estación seca") : null;
  const estrella = Object.entries(p.estrella)
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1]);
  return (
    <main className="ficha evento cat-fauna safari">
      <header className={`ficha-hero${p.foto ? "" : " sin-foto"}`}>
        {p.foto && <FotoGrande src={p.foto.url} />}
        <div className="ficha-hero-texto">
          <nav className="migas rotulo" aria-label="Migas">
            <Link href="/">Destinos</Link>
            {pais?.continente && <span>{pais.continente}</span>}
            {pais?.nombre && <span>{pais.nombre}</span>}
          </nav>
          <p className="rotulo">
            <span className="punto-cat" aria-hidden /> {CLASE[p.clase] ?? p.clase}
            {pais?.nombre && ` · ${pais.nombre}`}
          </p>
          <h1>{p.nombre}</h1>
          <p className="chips">
            {p.area_km2 && <span className="chip">{p.area_km2.toLocaleString("es-ES")} km²</span>}
            {p.iucn && <span className="chip">UICN: {p.iucn}</span>}
            {p.unesco && <span className="chip">Patrimonio Mundial</span>}
            <span className="chip">{p.n_mamiferos >= 200 ? "200+" : p.n_mamiferos} especies de mamíferos</span>
          </p>
          <p className="entradilla">
            {p.obs.toLocaleString("es-ES")} observaciones de mamíferos registradas desde 2010.
          </p>
          <p className="enlaces">
            <Link href={`/mapa?parque=${p.id}`}>En el mapa</Link>
            <BotonViaje id={p.id} nombre={p.nombre} noches={estanciaDe(p.id, p.radio_km).ideal} mesHoy={mesHoy} />
            <BotonComparar id={p.id} />
            <a href="#organiza">Organiza tu viaje ↓</a>
            <a
              href={`https://www.inaturalist.org/observations?lat=${p.lat}&lng=${p.lon}&radius=${p.radio_km}`}
              target="_blank"
              rel="noopener"
            >
              Observaciones en iNaturalist ↗
            </a>
          </p>
        </div>
        {p.foto && (
          <figcaption>
            {p.foto.web ? (
              <a href={p.foto.web} rel="noopener">
                {p.foto.autor ?? "Wikimedia Commons"}
              </a>
            ) : (
              p.foto.autor
            )}
            {p.foto.licencia && ` · ${p.foto.licencia}`}
          </figcaption>
        )}
      </header>

      <IndiceFicha
        secciones={[
          ["resumen", "Resumen"],
          ["que-se-ve", "Qué se ve"],
          ["cuando", "Cuándo ir"],
          ["organiza", "Organizar"],
          ["mapa", "Mapa"],
        ]}
      />

      <ResumenParque
        id={p.id}
        epoca={epoca}
        mesHoy={mesHoy}
        especies={
          estrella.length
            ? estrella.map(([k, n]) => {
                const slug = conFicha[mundo.estrella[k]];
                return { nombre: nombreEstrella(k), n, href: slug ? `/especie/${slug}` : undefined };
              })
            : // sin especies estrella (Madagascar, islas…): los mamíferos más vistos
              p.mamiferos
                .slice(0, EN_FICHA)
                .map(([k, n]) => ({ nombre: nombreEspecieMundo(mundo, k, reglasNombres()), n }))
        }
        mundo={p}
        pais={pais?.nombre}
        motivo={motivo ? TEXTO_MOTIVO[motivo] : null}
      />

      {estrella.length > 0 && (
        <section className="seccion" id="que-se-ve">
          <h2 className="rotulo">Especies estrella que se ven aquí</h2>
          <p className="enlaces-especies">
            {estrella.map(([k, n]) => {
              const cientifico = mundo.estrella[k];
              const s = conFicha[cientifico];
              const texto = `${nombreEstrella(k)} (${n.toLocaleString("es-ES")})`;
              return s ? (
                <Link key={k} href={`/especie/${s}`}>
                  {texto}
                </Link>
              ) : (
                <span key={k}>{texto}</span>
              );
            })}
          </p>
        </section>
      )}

      <div className="ficha-grid">
        <section className="seccion" id="cuando">
          <h2 className="rotulo">Cuándo ir</h2>
          <AvisoCierre id={p.id} mesHoy={mesHoy} />
          <div className="ano-safari" role="table" aria-label="El año en el parque">
            <div role="row" className="fila-ano cabecera-ano">
              <span role="rowheader" />
              {INICIALES.map((m, i) => (
                <span role="columnheader" key={i} className={i === mesHoy ? "actual" : undefined}>
                  {m}
                </span>
              ))}
            </div>
            {epoca && (
              <div role="row" className="fila-ano">
                <span role="rowheader">Mejor época</span>
                {MESES.map((m, i) => (
                  <span role="cell" key={m} className={epoca.includes(i + 1) ? "temporada-si" : "temporada-no"} />
                ))}
              </div>
            )}
            <div role="row" className="fila-ano">
              <span role="rowheader">Mamíferos vistos</span>
              <Barras valores={p.meses} titulo={(v) => `${v} observaciones`} />
            </div>
            {p.lluvia_mm && (
              <div role="row" className="fila-ano">
                <span role="rowheader">Lluvia</span>
                <Barras valores={p.lluvia_mm} clase="lluvia" titulo={(v) => `${v} mm`} />
              </div>
            )}
          </div>
          <p className="nota-pie">
            Mamíferos vistos: observaciones de GBIF por mes (reflejan también cuándo va más gente). Lluvia: climatología
            de la NASA (POWER).
          </p>
          {epoca && epoca.length < 12 && (
            <Suscribir
              ruta={`/parque/${p.id}/calendario.ics`}
              texto="Cada año, la buena época en tu calendario y un aviso dos meses antes para reservar."
            />
          )}
        </section>
        <VistoAhora
          lat={p.lat}
          lon={p.lon}
          radioKm={p.radio_km}
          respaldo={[]}
          conFicha={[]}
          excluir={exclusionesDe(p.id)}
          reglas={reglasNombres()}
        />
      </div>

      <section className="seccion">
        <h2 className="rotulo" id="lo-que-se-ve">
          Lo que más se ve
        </h2>
        <div className="grupos-safari">
          {(
            [
              ["Mamíferos", p.mamiferos.slice(0, EN_FICHA)],
              ["Aves", p.aves],
            ] as const
          ).map(([titulo, lista]) =>
            lista.length ? (
              <div key={titulo}>
                <h3>{titulo}</h3>
                <ol className="lista-especies-safari">
                  {lista.map(([k, n]) => (
                    <li key={k}>
                      <a href={`https://www.gbif.org/species/${k}`} target="_blank" rel="noopener">
                        {nombreEspecieMundo(mundo, k, reglasNombres())}
                      </a>{" "}
                      <small>{n.toLocaleString("es-ES")}</small>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null,
          )}
        </div>
        <p className="nota-pie">Especies con más observaciones en GBIF desde 2010 en unos {p.radio_km} km alrededor.</p>
      </section>

      <CincoGrandes p={p} mundo={mundo} />

      <OrganizaViaje p={p} pais={pais} nombre={p.nombre} />

      <CombinaCon p={p} mundo={mundo} nombre={p.nombre} />

      <section className="seccion" id="mapa">
        <h2 className="rotulo">Mapa</h2>
        <CartaParque
          id={p.id}
          nombre={p.nombre}
          lat={p.lat}
          lon={p.lon}
          radioKm={p.radio_km}
          zonas={ZONAS_PARQUE[p.id] ?? []}
          recomendadas={zonasRecomendadas(p.id)}
          alojamientos={(p.osm?.alojamientos ?? []).map((a) => ({
            nombre: a.nombre,
            tipo: a.tipo ?? "alojamiento",
            lat: a.lat,
            lon: a.lon,
            href: urlWeb(a.web) ?? (a.osm ? `https://www.openstreetmap.org/${a.osm}` : null),
          }))}
          aeropuertos={aeropuertosCarta(p.llegar?.aeropuertos ?? [])}
          mesHoy={mesHoy}
        />
      </section>

      <Frescura
        datos={[
          {
            que: "Especies, observaciones por mes, accesos y alojamientos",
            cuando: mundo.generado,
            fuente: "GBIF, NASA POWER, OurAirports y OpenStreetMap (cada día, por tandas)",
          },
          { que: "Mejor época", cuando: mundo.generado, fuente: "calculada con la lluvia y las observaciones" },
          ...(practicoDe(p.pais_nombre ?? pais?.nombre)
            ? [
                {
                  que: "Visado, salud y dinero",
                  cuando: practicoDe(p.pais_nombre ?? pais?.nombre)?.revisado ?? REVISADO,
                  fuente: "revisado a mano",
                },
              ]
            : []),
        ]}
      />
      <p className="nota-pie">
        Fuentes:{" "}
        {Object.values(mundo.fuentes)
          .filter((f) => !f.startsWith("http"))
          .join(" · ")}
        . ¿Vas a organizarlo? Mira también <Link href="/guia">cómo elegir operador y lodge</Link>.
      </p>
    </main>
  );
}
