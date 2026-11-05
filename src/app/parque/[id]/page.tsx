import type { Metadata } from "next";
import Link from "next/link";
import { reglasNombres } from "@/features/safaris/nombres";
import { Suscribir } from "@/ui/Suscribir";
import { Frescura } from "@/ui/Frescura";
import AvisoCierre from "@/features/safaris/componentes/AvisoCierre";
import Fenomenos from "@/features/safaris/componentes/Fenomenos";
import TemporadaVerde from "@/features/safaris/componentes/TemporadaVerde";
import { CONSULTADO as TARIFAS_CONSULTADAS, TARIFAS as TARIFAS_LODGES } from "@/features/safaris/temporadaVerde";
import { TASAS } from "@/features/safaris/tasas";
import { REVISADO, practicoDe } from "@/features/safaris/paises";
import FotoGrande from "@/ui/FotoGrande";
import { notFound } from "next/navigation";
import MapaEventos from "@/ui/mapa/MapaEventos";
import AnoSafari from "@/features/safaris/componentes/AnoSafari";
import { CincoGrandes, CombinaCon } from "@/features/safaris/componentes/ComplementosSafari";
import BotonComparar from "@/features/safaris/componentes/BotonComparar";
import ResumenParque from "@/features/safaris/componentes/ResumenParque";
import FrecuenciaAvistamientos from "@/features/safaris/componentes/FrecuenciaAvistamientos";
import IndiceFicha from "@/features/safaris/componentes/IndiceFicha";
import FichaMundo from "@/features/safaris/componentes/FichaMundo";
import OrganizaViaje from "@/features/safaris/componentes/OrganizaViaje";
import VistoAhora from "@/features/safaris/componentes/VistoAhora";
import {
  nivelFrecuencia,
  cargarMundo,
  cargarRecientes,
  exclusionesDe,
  fotoFauna,
  cargarSafaris,
  enlaceResenas,
  urlWeb,
  especiePorTaxon,
  getParque,
  getParqueMundo,
  nombreTaxon,
  slugEspecie,
  TEXTO_TIPO,
} from "@/features/safaris/datos";
import { fechaLocal } from "@/lib/sol";
import { etiquetaWeb } from "@/features/safaris/modelo";
import Credito, { esNd, origenFoto, textoCredito } from "@/ui/Credito";

type Props = { params: Promise<{ id: string }> };

// Solo los 65 del catálogo se generan al compilar; los miles del resto, al visitarlos (ISR), con
// safaris_mundo.json en la función (next.config.ts). Generar también los 150 con más fauna sumaba ~45 MB al
// despliegue de Vercel.
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return (cargarSafaris()?.parques ?? []).map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  const p = getParque(id);
  if (!p) {
    const m = getParqueMundo(id);
    if (!m) return {};
    const pais = m.pais ? cargarMundo()?.paises[m.pais]?.nombre : null;
    return {
      title: `Safari en ${m.nombre}`,
      description: `${m.nombre}${pais ? ` (${pais})` : ""}: qué fauna se ve, cuándo ir, cómo llegar, alojamientos y operadores.`,
    };
  }
  return {
    title: `Safari en ${p.nombre}`,
    description: `${p.nombre} (${p.pais}): cuándo ir, qué se ve, tipos de safari, tasas y alojamientos. ${p.consejo}`,
  };
}

/** alojamientos a la vista; el resto, plegados */
const VISIBLES = 6;

const GRUPOS: [string, string, number][] = [
  ["Mammalia", "Mamíferos", 15],
  ["Aves", "Aves", 8],
  ["Reptilia", "Reptiles", 5],
];

export default async function PaginaParque({ params }: Props) {
  const id = (await params).id;
  const p = getParque(id);
  const mundo = cargarMundo();
  const enMundo = getParqueMundo(id);
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  if (!p) {
    if (!enMundo || !mundo) notFound();
    const conFicha = Object.fromEntries((cargarSafaris()?.especies ?? []).map((e) => [e.cientifico, slugEspecie(e)]));
    return <FichaMundo p={enMundo} mundo={mundo} mesHoy={mesHoy} conFicha={conFicha} />;
  }
  const datos = cargarSafaris()!;
  const recientes = cargarRecientes()?.parques[p.id];
  // cabecera con fauna (su especie estrella); el paisaje de Commons, solo si no hay foto de fauna
  const fauna = fotoFauna(p);
  const fotoHero = fauna?.foto ?? p.foto ?? null;
  const estrella = p.estrella.map(especiePorTaxon).filter((e) => e !== undefined);
  const conFicha = datos.especies.map((e) => e.taxon);
  const respaldo = (recientes?.mamiferos ?? []).map((m) => ({ ...m, foto: null }));
  const alojamientos = p.alojamientos ?? [];
  const puntos = [
    { id: p.id, nombre: p.nombre, lat: p.lat, lon: p.lon, radio_km: p.radio_km, categoria: "fauna", href: null },
    ...alojamientos.map((a) => ({
      id: a.osm,
      nombre: `${a.nombre} (${a.tipo})`,
      lat: a.lat,
      lon: a.lon,
      radio_km: 0.3,
      categoria: "otono",
      href: urlWeb(a.web) ?? `https://www.openstreetmap.org/${a.osm}`,
    })),
  ];
  return (
    <main className="ficha evento cat-fauna safari">
      <header className={`ficha-hero${fotoHero ? "" : " sin-foto"}`}>
        {fotoHero && (
          <FotoGrande
            src={fotoHero.url}
            alt={fauna ? `${fauna.especie}, especie estrella de ${p.nombre}` : `Paisaje de ${p.nombre}`}
          />
        )}
        <div className="ficha-hero-texto">
          <nav className="migas rotulo" aria-label="Migas">
            <Link href="/">Destinos</Link>
            <span>{p.continente}</span>
            <span>{p.pais}</span>
          </nav>
          <h1>{p.nombre}</h1>
          <p className="entradilla">{p.consejo}</p>
          <p className="chips">
            {p.tipos.map((t) => (
              <span key={t} className="chip">
                {TEXTO_TIPO[t] ?? t}
              </span>
            ))}
          </p>
          <p className="enlaces">
            <BotonComparar id={p.id} />
            {p.web && (
              <a href={p.web} target="_blank" rel="noopener">
                {etiquetaWeb(p.web)} ↗
              </a>
            )}
            {p.es && (
              <a href={p.es} target="_blank" rel="noopener">
                Wikipedia ↗
              </a>
            )}
            <a
              href={`https://www.inaturalist.org/observations?lat=${p.lat}&lng=${p.lon}&radius=${p.radio_km}`}
              target="_blank"
              rel="noopener"
            >
              Observaciones en iNaturalist ↗
            </a>
          </p>
        </div>
        {fotoHero && (
          <figcaption>
            {fauna ? `${fauna.especie} · ` : ""}
            {origenFoto(fotoHero) ? (
              <a href={origenFoto(fotoHero)!} rel="noopener">
                {textoCredito(fotoHero)}
              </a>
            ) : (
              textoCredito(fotoHero)
            )}
          </figcaption>
        )}
      </header>

      <IndiceFicha
        secciones={[
          ["resumen", "Resumen"],
          ["que-se-ve", "Qué se ve"],
          ["cuando", "Cuándo ir"],
          ["mapa", "Mapa"],
          ["organiza", "Organizar"],
          ...(alojamientos.length ? ([["dormir", "Dónde dormir"]] as [string, string][]) : []),
        ]}
      />

      <AvisoCierre id={p.id} mesHoy={mesHoy} ahora />
      <ResumenParque
        id={p.id}
        epoca={p.meses}
        mesHoy={mesHoy}
        especies={estrella
          .map((e) => {
            // con frecuencia por mes, ordenadas por lo probable que es verlas este mes
            const f = p.frecuencia?.[String(e.taxon)]?.[mesHoy];
            const n = nivelFrecuencia(f);
            return {
              nombre: nombreTaxon(e),
              n: f ?? (p.conteo_estrella?.[String(e.taxon)] ?? 0) / 1000,
              href: `/especie/${slugEspecie(e)}`,
              nivel: n.clave === "sin-datos" ? undefined : n.texto,
            };
          })
          .sort((a, b) => b.n - a.n)}
        tasaTexto={p.tasa}
        mundo={enMundo}
        pais={p.pais}
      />

      {estrella.length > 0 && (
        <section className="seccion" id="que-se-ve">
          <h2 className="rotulo">Especies estrella</h2>
          <ul className="rejilla-especies rejilla-estrella">
            {estrella.map((e) => {
              const n = p.conteo_estrella?.[String(e.taxon)] ?? 0;
              const mes = recientes?.estrella[String(e.taxon)] ?? 0;
              return (
                <li key={e.taxon} className="tarjeta-especie">
                  {e.foto ? (
                    <span className="con-credito">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.foto.url}
                        alt={`${nombreTaxon(e)} (foto de iNaturalist)`}
                        loading="lazy"
                        className={esNd(e.foto) ? "foto-nd" : undefined}
                      />
                      <Credito foto={e.foto} />
                    </span>
                  ) : (
                    <span className="sin-foto" aria-hidden />
                  )}
                  <div>
                    <h3>
                      <Link href={`/especie/${slugEspecie(e)}`}>{nombreTaxon(e)}</Link>
                    </h3>
                    <p>
                      <i>{e.cientifico}</i>
                    </p>
                    <p className="meta">
                      {n.toLocaleString("es-ES")} observaciones aquí
                      {mes > 0 && ` · ${mes} en el último mes`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <FrecuenciaAvistamientos
        mesHoy={mesHoy}
        filas={estrella
          .filter((e) => p.frecuencia?.[String(e.taxon)])
          .map((e) => ({
            nombre: nombreTaxon(e),
            href: `/especie/${slugEspecie(e)}`,
            meses: p.frecuencia![String(e.taxon)],
            muestra: p.muestra?.[String(e.taxon)],
          }))}
      />

      <div className="ficha-grid">
        <section className="seccion" id="cuando">
          <h2 className="rotulo">Cuándo ir</h2>
          <AnoSafari p={p} mesActual={mesHoy} />
          <AvisoCierre id={p.id} mesHoy={mesHoy} />
          <Fenomenos parque={p.id} mesHoy={mesHoy} />
          <TemporadaVerde p={p} mesActual={mesHoy} />
          <p className="nota-pie">
            Temporada: la recomendada para ver fauna. Mamíferos vistos: observaciones de iNaturalist por mes (reflejan
            también cuándo va más gente). Clima: climatología de la NASA (POWER).
          </p>
          <Suscribir
            ruta={`/parque/${p.id}/calendario.ics`}
            texto="Cada año, la buena época en tu calendario y un aviso dos meses antes para reservar."
          />
        </section>
        <VistoAhora
          lat={p.lat}
          lon={p.lon}
          radioKm={p.radio_km}
          respaldo={respaldo}
          conFicha={conFicha}
          excluir={exclusionesDe(p.id)}
          reglas={reglasNombres()}
        />
      </div>

      {p.especies && (
        <details className="seccion plegable" id="lo-que-se-ve">
          <summary className="rotulo">Lo que más se ve (todas las especies)</summary>
          <div className="grupos-safari">
            {GRUPOS.map(([g, titulo, max]) =>
              p.especies?.[g]?.length ? (
                <div key={g}>
                  <h3>{titulo}</h3>
                  <ol className="lista-especies-safari">
                    {p.especies[g].slice(0, max).map((e) => (
                      <li key={e.taxon}>
                        {conFicha.includes(e.taxon) ? (
                          // por el taxón, no por el nombre: iNaturalist y el catálogo usan sinónimos distintos
                          // (Phoeniconaias / Phoenicopterus minor) y salían dos fichas
                          <Link href={`/especie/${slugEspecie(especiePorTaxon(e.taxon) ?? e)}`}>{nombreTaxon(e)}</Link>
                        ) : (
                          nombreTaxon(e)
                        )}{" "}
                        <small>{e.n?.toLocaleString("es-ES")}</small>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null,
            )}
          </div>
          <p className="nota-pie">
            Especies con más observaciones verificadas en iNaturalist en unos {p.radio_km} km alrededor.
          </p>
        </details>
      )}

      <div className="ficha-grid">
        <details className="seccion plegable">
          <summary className="rotulo">Tasas, permisos y reservas</summary>
          <h2 className="rotulo">Tasas y permisos</h2>
          <p>{p.tasa ?? "Las tasas cambian a menudo: consúltalas en la web oficial del parque antes de reservar."}</p>
          {p.tasa && <p className="nota-pie">Orientativo: comprueba la tarifa vigente en la web oficial.</p>}
          <h2 className="rotulo">Reservar</h2>
          <ul className="lista-reservar">
            <li>
              <b>Entrada y permisos:</b>{" "}
              {p.web ? (
                <a href={p.web} target="_blank" rel="noopener">
                  {etiquetaWeb(p.web) === "Web oficial" ? "web oficial del parque" : "web del parque"} ↗
                </a>
              ) : (
                "en la autoridad de parques del país"
              )}
              .
            </li>
            <li>
              <b>Alojamiento:</b> directamente con el lodge o campamento (abajo, con su web) suele salir igual o más
              barato que en una agencia y la comisión se queda en el destino.
            </li>
            <li>
              <b>Operador o guía:</b> mira <Link href="/guia#operador">cómo elegir un operador de safari</Link>.
            </li>
          </ul>
        </details>
        <section className="seccion" id="mapa">
          <h2 className="rotulo">Mapa</h2>
          <MapaEventos eventos={puntos} etiqueta={`Mapa de ${p.nombre}`} mundo />
        </section>
      </div>

      {enMundo && mundo && <CincoGrandes p={enMundo} mundo={mundo} />}

      {enMundo && mundo && (
        <OrganizaViaje
          p={enMundo}
          pais={
            (enMundo.pais ? mundo.paises[enMundo.pais] : undefined) ?? {
              nombre: p.pais,
              continente: p.continente,
              moneda: null,
              idiomas: [],
            }
          }
          nombre={p.nombre}
          conAlojamientos={alojamientos.length === 0}
        />
      )}

      {alojamientos.length > 0 && (
        <section className="seccion" id="dormir">
          <h2 className="rotulo">Dónde dormir</h2>
          <ul className="lista-alojamientos">
            {alojamientos.slice(0, VISIBLES).map((a) => (
              <li key={a.osm}>
                <b>{a.nombre}</b> <small>{a.tipo}</small>
                <span className="enlaces">
                  {urlWeb(a.web) && (
                    <a href={urlWeb(a.web)!} target="_blank" rel="noopener">
                      Web y reservas ↗
                    </a>
                  )}
                  {a.telefono && <a href={`tel:${a.telefono.split(";")[0]}`}>{a.telefono.split(";")[0]}</a>}
                  <a href={enlaceResenas(a)} target="_blank" rel="noopener">
                    Reseñas ↗
                  </a>
                </span>
              </li>
            ))}
          </ul>
          {alojamientos.length > VISIBLES && (
            <details className="mas-alojamientos">
              <summary>Ver {alojamientos.length - VISIBLES} más</summary>
              <ul className="lista-alojamientos">
                {alojamientos.slice(VISIBLES).map((a) => (
                  <li key={a.osm}>
                    <b>{a.nombre}</b> <small>{a.tipo}</small>
                    <span className="enlaces">
                      {urlWeb(a.web) && (
                        <a href={urlWeb(a.web)!} target="_blank" rel="noopener">
                          Web y reservas ↗
                        </a>
                      )}
                      {a.telefono && <a href={`tel:${a.telefono.split(";")[0]}`}>{a.telefono.split(";")[0]}</a>}
                      <a href={enlaceResenas(a)} target="_blank" rel="noopener">
                        Reseñas ↗
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="nota-pie">
            Lodges, campamentos y hoteles con nombre en OpenStreetMap dentro del parque o cerca. No cobramos comisión ni
            hay alojamientos patrocinados; las reseñas se abren en Google Maps.
          </p>
        </section>
      )}

      {enMundo && mundo && <CombinaCon p={enMundo} mundo={mundo} nombre={p.nombre} />}

      <Frescura
        datos={[
          ...(cargarRecientes()
            ? [
                {
                  que: "Lo visto en el último mes",
                  cuando: cargarRecientes()!.fecha,
                  fuente: "iNaturalist (se actualiza dos veces al día)",
                },
              ]
            : []),
          {
            que: "Frecuencia por mes, especies, clima y alojamientos",
            cuando: datos.generado,
            fuente: "iNaturalist, NASA POWER y OpenStreetMap (cada semana)",
          },
          ...(TARIFAS_LODGES.some((t) => t.parque === p.id)
            ? [
                {
                  que: "Precio de los lodges por mes",
                  cuando: TARIFAS_CONSULTADAS,
                  fuente: "tarifas publicadas, a mano",
                },
              ]
            : []),
          { que: "Mejor época, estancia y consejos", cuando: "escrito a mano", fuente: "catálogo de destacados" },
          ...(TASAS[p.id]
            ? [{ que: "Tasa de entrada", cuando: TASAS[p.id].vigencia, fuente: "Fuente", url: TASAS[p.id].fuente }]
            : []),
          ...(practicoDe(p.pais)
            ? [
                {
                  que: "Visado, salud y dinero",
                  cuando: practicoDe(p.pais)?.revisado ?? REVISADO,
                  fuente: "revisado a mano",
                },
              ]
            : []),
        ]}
      />
      <p className="nota-pie">
        Fuentes: {Object.values(datos.fuentes).join(" · ")}. Respeta las distancias, no pidas al guía salirse de las
        pistas para acercarse a los animales y no hagas actividades con fauna en cautividad (paseos con leones,
        elefantes montados).
      </p>
    </main>
  );
}
