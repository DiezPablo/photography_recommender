// Comparador de parques: hasta 4 lado a lado para decidir. Para el mes elegido: quién gana en cada cosa (fauna,
// llegada, coste, temporada), qué es probable ver en cada uno y lo práctico. Dinámica: depende de los parques y
// del mes.
import type { Metadata } from "next";
import Link from "next/link";
import { etiquetaWeb, nombreAeropuerto } from "@/features/safaris/modelo";
import { textoCredito } from "@/ui/Credito";
import { INICIALES, MESES } from "@/lib/fechas";
import { fechaLocal } from "@/lib/sol";
import AnadirComparar from "@/features/safaris/componentes/AnadirComparar";
import {
  cargarMundo,
  cargarSafaris,
  getParque,
  getParqueMundo,
  confianza,
  nivelFrecuencia,
  nombreEstrella,
  slugEspecie,
} from "@/features/safaris/datos";
import { buenaEpoca, CLASE, MAX_COMPARAR, type ParqueMundo, TEXTO_MOTIVO, urlWeb } from "@/features/safaris/modelo";
import { TASAS, tasaPorPersona } from "@/features/safaris/tasas";
import { ahorro, indicePrecios } from "@/features/safaris/temporadaVerde";
import { POR_TU_CUENTA, practicoDe, TEXTO_POR_TU_CUENTA } from "@/features/safaris/paises";
import { EDAD_MINIMA, SIN_MALARIA } from "@/features/safaris/familias";
import { estanciaDe } from "@/features/safaris/estancias";
import { cierreEn, TEXTO_TIPO_CIERRE } from "@/features/safaris/cierres";

export const metadata: Metadata = {
  title: "Comparar parques",
  description:
    "Compara parques de safari para un mes: qué animales es probable ver, mejor época, lluvia, cómo llegar, tasas, temporada verde y lo práctico.",
};

type Props = { searchParams: Promise<{ p?: string; mes?: string }> };

const MAX_ESPECIES = 14;

function km(n: number): string {
  return `${Math.round(n).toLocaleString("es-ES")} km`;
}

export default async function PaginaComparar({ searchParams }: Props) {
  const q = await searchParams;
  const ids = [...new Set((q.p ?? "").split(",").filter(Boolean))].slice(0, MAX_COMPARAR);
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  const mes = q.mes !== undefined && Number(q.mes) >= 0 && Number(q.mes) <= 11 ? Number(q.mes) : mesHoy;
  const mundo = cargarMundo();
  const catalogo = cargarSafaris();
  const parques = ids.map(getParqueMundo).filter((p): p is ParqueMundo => p !== undefined);
  const conFicha = new Map((catalogo?.especies ?? []).map((e) => [e.cientifico, slugEspecie(e)]));
  const taxon = new Map((catalogo?.especies ?? []).map((e) => [e.cientifico, e.taxon]));
  const url = (cambios: { p?: string[]; mes?: number }) =>
    `/comparar?p=${(cambios.p ?? parques.map((p) => p.id)).join(",")}&mes=${cambios.mes ?? mes}`;
  const nombreMes = MESES[mes];

  // época de cada parque: la curada en los destacados; si no, la calculada
  const epoca = (p: ParqueMundo) => {
    const curada = getParque(p.id)?.meses;
    return curada?.length
      ? curada
      : buenaEpoca({ la: p.lat, sec: p.meses_secos, ep: p.epoca?.meses, em: p.epoca?.motivo });
  };
  // frecuencia de una especie estrella ese mes (solo en los destacados): ‰ de las fotos de su grupo
  const frecuencia = (p: ParqueMundo, k: string) => {
    const t = mundo ? taxon.get(mundo.estrella[k]) : undefined;
    const f = t !== undefined ? getParque(p.id)?.frecuencia?.[String(t)] : undefined;
    return f ? f[mes] : undefined;
  };
  // fotos del grupo detrás de ese nivel (tamaño de muestra)
  const muestraDe = (p: ParqueMundo, k: string) => {
    const t = mundo ? taxon.get(mundo.estrella[k]) : undefined;
    return t !== undefined ? getParque(p.id)?.muestra?.[String(t)]?.[mes] : undefined;
  };
  const internacional = (p: ParqueMundo) => p.llegar.aeropuertos.find((x) => x.internacional);
  const tasa = (p: ParqueMundo) => (TASAS[p.id] ? tasaPorPersona(TASAS[p.id], 1, mes + 1) : null);
  const precioMes = (p: ParqueMundo) => indicePrecios(p.id)?.meses[mes] ?? null;
  const paisDe = (p: ParqueMundo) => (p.pais && mundo?.paises[p.pais]?.nombre) ?? p.pais_nombre ?? "";

  // especies estrella de alguno de los parques, las más vistas en el conjunto primero
  const total = new Map<string, number>();
  for (const p of parques)
    for (const [k, n] of Object.entries(p.estrella)) if (n >= 3) total.set(k, (total.get(k) ?? 0) + n);
  const especies = [...total.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ESPECIES)
    .map(([k]) => k);
  const nEstrella = (p: ParqueMundo) => Object.values(p.estrella).filter((n) => n >= 3).length;

  // quién gana en cada cosa (solo si hay con qué comparar)
  const gana = <T,>(
    titulo: string,
    valor: (p: ParqueMundo) => T | null,
    mejor: (a: T, b: T) => number,
    texto: (p: ParqueMundo, v: T) => string,
  ) => {
    const con = parques.map((p) => ({ p, v: valor(p) })).filter((x): x is { p: ParqueMundo; v: T } => x.v !== null);
    if (con.length < 2) return null;
    con.sort((a, b) => mejor(a.v, b.v));
    // empatados con el primero: si empatan todos, no hay nada que decidir
    const top = con.filter((x) => mejor(x.v, con[0].v) === 0);
    if (top.length === con.length) return null;
    return { titulo, nombres: top.map((x) => x.p.nombre).join(", "), texto: texto(top[0].p, top[0].v) };
  };
  const ganadores = [
    gana(
      "Más especies emblemáticas",
      nEstrella,
      (a, b) => b - a,
      (_, v) => `${v} con observaciones`,
    ),
    gana(
      "Aeropuerto internacional más cerca",
      (p) => internacional(p)?.km ?? null,
      (a, b) => a - b,
      (p, v) => `${nombreAeropuerto(internacional(p)!)} a ${km(v)}`,
    ),
    gana(
      "Entrada más barata",
      tasa,
      (a, b) => a - b,
      (_, v) => `${Math.round(v)} USD por persona y día`,
    ),
    gana(
      `Lodges más baratos en ${nombreMes}`,
      precioMes,
      (a, b) => a - b,
      (_, v) => `${Math.round(v * 100)} % de su temporada alta`,
    ),
    gana(
      "Más alojamientos",
      (p) => p.osm?.alojamientos.length ?? null,
      (a, b) => b - a,
      (_, v) => `${v >= 30 ? "30 o más" : v} en OpenStreetMap`,
    ),
  ].filter((x) => x !== null);
  const enEpoca = parques.filter((p) => epoca(p)?.includes(mes + 1) && !cierreEn(p.id, mes + 1));

  const fila = (
    titulo: string,
    celda: (p: ParqueMundo) => React.ReactNode,
    clase?: (p: ParqueMundo) => string | undefined,
  ) => (
    <tr>
      <th scope="row">{titulo}</th>
      {parques.map((p) => (
        <td key={p.id} className={clase?.(p)}>
          {celda(p)}
        </td>
      ))}
    </tr>
  );
  const seccion = (titulo: string) => (
    <tr className="separador">
      <th scope="rowgroup" colSpan={parques.length + 1}>
        {titulo}
      </th>
    </tr>
  );

  return (
    <main className="calendario safaris comparar">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · hasta {MAX_COMPARAR} parques
        </p>
        <h1>Comparar parques{parques.length ? ` en ${nombreMes}` : ""}</h1>
        <p className="entradilla">
          Lo que decide entre un parque y otro, lado a lado y para el mes en que vas. Añade parques desde aquí o con «+
          Comparar» en cada ficha.
        </p>
      </header>
      <AnadirComparar ids={parques.map((p) => p.id)} mes={q.mes !== undefined ? mes : undefined} />

      {parques.length === 0 ? (
        <p>
          Aún no has elegido parques. Prueba con{" "}
          <Link href="/comparar?p=serengeti,masai-mara,kruger">Serengeti, Masái Mara y Kruger</Link>.
        </p>
      ) : (
        <>
          <nav className="nav-respuestas meses-comparar" aria-label="Mes del viaje">
            {MESES.map((m, i) => (
              <Link key={m} href={url({ mes: i })} aria-current={i === mes ? "page" : undefined}>
                {m}
              </Link>
            ))}
          </nav>

          {parques.length > 1 && (
            <section className="seccion ganadores" aria-label="Quién gana en cada cosa">
              <p className="ganador">
                <span className="rotulo">En su mejor época en {nombreMes}</span>
                <b>{enEpoca.length ? enEpoca.map((p) => p.nombre).join(", ") : "Ninguno"}</b>
              </p>
              {ganadores.map((g) => (
                <p className="ganador" key={g.titulo}>
                  <span className="rotulo">{g.titulo}</span>
                  <b>{g.nombres}</b>
                  <small>{g.texto}</small>
                </p>
              ))}
            </section>
          )}

          <div className="tabla-desliza">
            <table className="tabla-comparar comparador">
              <thead>
                <tr>
                  <td />
                  {parques.map((p) => (
                    <th key={p.id} scope="col">
                      {p.foto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.foto.url} alt={p.nombre} title={textoCredito(p.foto)} loading="lazy" />
                      )}
                      <Link href={`/parque/${p.id}`}>{p.nombre}</Link>
                      <small>{paisDe(p)}</small>
                      <Link className="quitar" href={url({ p: parques.filter((x) => x !== p).map((x) => x.id) })}>
                        Quitar
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seccion("Cuándo ir")}
                {fila(
                  `En ${nombreMes}`,
                  (p) => {
                    const c = cierreEn(p.id, mes + 1);
                    if (c) return <span title={c.texto}>{TEXTO_TIPO_CIERRE[c.tipo]}</span>;
                    const ep = epoca(p);
                    return ep ? (ep.includes(mes + 1) ? "Buena época" : "Fuera de su mejor época") : "Sin datos";
                  },
                  (p) => (cierreEn(p.id, mes + 1) ? "no" : epoca(p)?.includes(mes + 1) ? "mejor" : "no"),
                )}
                {fila("Mejor época", (p) => {
                  const ep = epoca(p);
                  const curada = getParque(p.id)?.meses;
                  return (
                    <>
                      <span className="mini-ano" aria-label={ep ? ep.map((m) => MESES[m - 1]).join(", ") : "sin datos"}>
                        {INICIALES.map((l, i) => (
                          <i key={i} className={`${ep?.includes(i + 1) ? "si" : ""} ${i === mes ? "este" : ""}`}>
                            {l}
                          </i>
                        ))}
                      </span>
                      {(curada?.length || p.epoca?.motivo) && (
                        <small>{TEXTO_MOTIVO[curada?.length ? "recomendada" : p.epoca!.motivo!]}</small>
                      )}
                    </>
                  );
                })}
                {fila(`Lluvia en ${nombreMes}`, (p) => (p.lluvia_mm ? `${Math.round(p.lluvia_mm[mes])} mm` : "–"))}

                {seccion(`Qué se ve${parques.some((p) => getParque(p.id)) ? ` en ${nombreMes}` : ""}`)}
                {especies.map((k) => {
                  const s = mundo ? conFicha.get(mundo.estrella[k]) : undefined;
                  const nombre = nombreEstrella(k);
                  const max = Math.max(...parques.map((p) => p.estrella[k] ?? 0));
                  return (
                    <tr key={k}>
                      <th scope="row">{s ? <Link href={`/especie/${s}`}>{nombre}</Link> : nombre}</th>
                      {parques.map((p) => {
                        const n = p.estrella[k] ?? 0;
                        const f = frecuencia(p, k);
                        const nivel = f !== undefined ? nivelFrecuencia(f) : null;
                        if (n < 3)
                          return (
                            <td key={p.id} className="no">
                              –
                            </td>
                          );
                        return (
                          <td key={p.id}>
                            {nivel && nivel.clave !== "sin-datos" ? (
                              <span
                                className={`f-texto-${nivel.clave}`}
                                title={(() => {
                                  const c = confianza(muestraDe(p, k));
                                  return c ? `${c.texto} (${muestraDe(p, k)} fotos del grupo)` : undefined;
                                })()}
                              >
                                {nivel.texto}
                                {confianza(muestraDe(p, k))?.clave === "baja" ? " (pocos datos)" : ""}
                              </span>
                            ) : (
                              <span className="barra-comparar" title={`${n.toLocaleString("es-ES")} observaciones`}>
                                <i style={{ width: `${Math.max(6, Math.sqrt(n / max) * 100)}%` }} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {seccion("Llegar y moverse")}
                {fila("Se entra por", (p) => estanciaDe(p.id, p.radio_km).entrada ?? "–")}
                {fila("Aeropuerto internacional más cercano", (p) => {
                  const a = internacional(p);
                  return a ? `${nombreAeropuerto(a)} (${a.iata}), ${km(a.km)}` : "–";
                })}
                {fila("Pistas de avioneta", (p) => p.llegar.n_pistas || "–")}
                {fila("Por tu cuenta", (p) =>
                  POR_TU_CUENTA[p.id] ? TEXTO_POR_TU_CUENTA[POR_TU_CUENTA[p.id].nivel] : "Lo habitual es con guía",
                )}

                {seccion("Coste")}
                {fila("Tasa de entrada", (p) => {
                  const t = tasa(p);
                  return t !== null ? `${Math.round(t)} USD por persona y día` : (getParque(p.id)?.tasa ?? "–");
                })}
                {fila(`Lodges en ${nombreMes}`, (p) => {
                  const ix = indicePrecios(p.id);
                  const v = ix?.meses[mes];
                  if (!ix) return "Sin tarifas recogidas";
                  if (v == null) return "Cerrados o sin tarifa";
                  return ahorro(ix).ahorro < 0.05
                    ? "Mismo precio todo el año"
                    : `${Math.round(v * 100)} % de su temporada alta`;
                })}
                {fila("Alojamientos (OSM)", (p) => {
                  const n = p.osm?.alojamientos.length ?? 0;
                  return n >= 30 ? "30 o más" : n || "–";
                })}
                {fila(
                  "Operadores",
                  (p) => (p.osm?.operadores.length ?? 0) + (p.operadores_ciudad?.lista.length ?? 0) || "–",
                )}

                {seccion("Práctico")}
                {fila("Visado", (p) => practicoDe(paisDe(p))?.visado.texto ?? "Consúltalo")}
                {fila("Malaria", (p) =>
                  SIN_MALARIA.has(p.id) ? "Sin riesgo" : (practicoDe(paisDe(p))?.malaria ?? "Consúltalo"),
                )}
                {fila("Con niños", (p) =>
                  EDAD_MINIMA[p.id]
                    ? `${EDAD_MINIMA[p.id].actividad} desde ${EDAD_MINIMA[p.id].edad} años`
                    : SIN_MALARIA.has(p.id)
                      ? "Buena opción (sin malaria)"
                      : "Sí, con profilaxis",
                )}
                {fila("Tipo", (p) => CLASE[p.clase] ?? p.clase)}
                {fila("Superficie", (p) => (p.area_km2 ? `${p.area_km2.toLocaleString("es-ES")} km²` : "–"))}
                {fila("Web", (p) => {
                  const w = urlWeb(p.web);
                  return w ? (
                    <a href={w} target="_blank" rel="noopener">
                      {etiquetaWeb(w)} ↗
                    </a>
                  ) : (
                    "–"
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="enlaces no-imprimir">
            <Link href={`/planificar?mes=${mes}`}>Planificar una ruta en {nombreMes} →</Link>
            <Link href={`/presupuesto?p=${parques.map((p) => `${p.id}:2`).join(",")}&mes=${mes}`}>
              Presupuesto con estos parques →
            </Link>
          </p>
        </>
      )}
      <p className="nota-pie">
        Qué se ve: en los destacados, el nivel de ese mes según la frecuencia en las fotos de iNaturalist; en el resto,
        la barra compara las observaciones de GBIF desde 2010 entre los parques (lo fácil que es verla, no cuántos hay).
        Época: la recomendada en los destacados; en el resto, la estación seca o los meses con más avistamientos.
        Lodges: tarifas publicadas de sus lodges (temporada verde). Alojamientos y operadores de OpenStreetMap.
      </p>
    </main>
  );
}
