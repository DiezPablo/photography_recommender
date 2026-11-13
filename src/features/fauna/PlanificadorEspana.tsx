"use client";
// Fauna en España para un lugar y un día: luz (horas dorada y azul), tiempo (previsión o climatología, diciendo
// cuál), las mejores franjas y, cuando haya datos de GBIF, las especies que más se registran ese mes con dos notas (verla y
// fotografiarla) y su desglose. Todo en el navegador: Open-Meteo sin clave y los datos de la cuadrícula por bloques.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParametrosUrl } from "@/lib/almacen";
import { MESES, distanciaKm } from "@/lib/fechas";
import { calidadLuz, luzDia, type Franja, type LuzDia } from "@/lib/luz";
import { horaLocal, rumbo } from "@/lib/sol";
import { luna } from "@/lib/luna";
import { bloque, celdasEnRadio } from "@/lib/rejilla";
import {
  factorNubes,
  factorTiempo,
  tiempoPara,
  type Climatologia,
  type HoraTiempo,
  type Prevision,
} from "@/lib/tiempo";
import { confianza, nivelFrecuencia, textoFrecuencia } from "@/features/fauna/frecuencia";
import { actividadPorDefecto, puntuar, type Puntuacion } from "@/features/fauna/puntuacion";
import ElegirLugar from "@/features/fauna/ElegirLugar";
import LuzYMar from "@/features/fauna/LuzYMar";
import ResumenDia from "@/features/fauna/ResumenDia";
import { factorFotografia } from "@/features/fauna/fotografia";
import { useUbicacionGuardada } from "@/features/fauna/ubicacion";
import FenomenosEspana from "@/features/fauna/FenomenosEspana";
import { fenomenosCerca } from "@/features/fauna/fenomenos";
import { ZONAS_ESPANA, type BloqueEspana, type ObsReciente } from "@/features/fauna/zonas";
import Esqueleto from "@/ui/Esqueleto";
import CitaEbird from "@/features/fauna/citaEbird";

const RADIOS = [5, 10, 20, 30];
const MAX_ESPECIES = 30;

type Momento = "noche" | "azul" | "dorada" | "dia";

function momentoDe(instante: Date, luz: LuzDia): Momento {
  const en = (f: Franja | null) => f && instante >= f.desde && instante <= f.hasta;
  if (en(luz.doradaManana) || en(luz.doradaTarde)) return "dorada";
  if (en(luz.azulManana) || en(luz.azulTarde)) return "azul";
  if (luz.amanecer && luz.atardecer && instante > luz.amanecer && instante < luz.atardecer) return "dia";
  return "noche";
}

const TEXTO_MOMENTO: Record<Momento, string> = {
  noche: "de noche",
  azul: "hora azul",
  dorada: "hora dorada",
  dia: "de día",
};

interface Especie {
  clave: string;
  nombre: string;
  cientifico: string | null;
  clase: string;
  permil: number;
  muestra: number;
  nota: Puntuacion;
  estado?: "invasora" | "aviso";
  aviso?: string | null;
  /** última vez vista cerca en 30 días (eBird o iNaturalist) */
  ultima: ObsReciente | null;
}

const DIA_MS = 86_400_000;
/** Muestra a partir de la cual la frecuencia se cree casi entera (la mitad con esta muestra). */
const fechaCorta = (f: string) => `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1].slice(0, 3)}`;
/** Hasta qué distancia del radio cuenta una observación reciente (eBird da la última por provincia). */
const MARGEN_RECIENTES_KM = 15;
/** Solo pesa lo visto estos días si el plan es para pronto: a meses vista no dice nada. */
const DIAS_PLAN_RECIENTES = 14;
const especieDe = (cientifico: string) => cientifico.split(" ").slice(0, 2).join(" ");

/** La observación más reciente de cada especie (por nombre científico) a menos de radio + margen del punto. */
function ultimasVistas(bloques: BloqueEspana[], lat: number, lon: number, radioKm: number) {
  const salida = new Map<string, ObsReciente>();
  for (const b of bloques)
    for (const o of b.recientes?.obs ?? []) {
      if (distanciaKm({ lat, lon }, o) > radioKm + MARGEN_RECIENTES_KM) continue;
      const k = especieDe(o.c);
      const ya = salida.get(k);
      if (!ya || o.f > ya.f) salida.set(k, o);
    }
  return salida;
}

const GRUPOS = [
  ["Aves", "Aves"],
  ["Mammalia", "Mamíferos"],
  ["Reptilia", "Reptiles"],
  ["Amphibia", "Anfibios"],
] as const;

/** % de listas de eBird con cada ave en las celdas del radio (ponderado por listas; solo celdas con datos ese mes). */
function deteccionRadio(bloques: BloqueEspana[], celdas: Set<string>, mes: number) {
  const con = new Map<string, number>();
  let total = 0;
  for (const b of bloques)
    for (const [c, x] of Object.entries(b.ebird ?? {})) {
      if (!celdas.has(c) || x.l[mes] < 10) continue;
      total += x.l[mes];
      for (const [k, v] of Object.entries(x.d)) {
        const p = v[mes];
        if (p === null || p === undefined) continue;
        con.set(k, (con.get(k) ?? 0) + (p * x.l[mes]) / 100);
      }
    }
  const salida = new Map<string, { pct: number; listas: number }>();
  // con menos de 30 listas el % es ruido: se queda el ‰
  if (total >= 30) for (const [k, v] of con) salida.set(k, { pct: Math.round((100 * v) / total), listas: total });
  return salida;
}

/** Une las celdas del radio: ‰ de cada especie ponderado por la muestra de su clase en cada celda, y los registros
 * de todos los grupos juntos (para comparar especies de grupos distintos). */
function especiesDelRadio(bloques: BloqueEspana[], celdas: Set<string>, mes: number) {
  const suma = new Map<string, { p: number; m: number; clase: string }>();
  const nombres: BloqueEspana["especies"] = {};
  let total = 0;
  for (const b of bloques) {
    Object.assign(nombres, b.especies);
    for (const [c, d] of Object.entries(b.celdas)) {
      if (!celdas.has(c)) continue;
      total += Object.values(d.m).reduce((a, x) => a + (x[mes] ?? 0), 0);
      for (const [k, meses] of Object.entries(d.e)) {
        const v = meses[mes];
        if (v === null) continue;
        // la clase de la especie no viaja con la celda: se toma la de más muestra (casi siempre, aves)
        const clase = nombres[k]?.clase ?? Object.entries(d.m).sort((a, x) => x[1][mes] - a[1][mes])[0]?.[0] ?? "Aves";
        const m = d.m[clase]?.[mes] ?? 0;
        const s = suma.get(k) ?? { p: 0, m: 0, clase };
        suma.set(k, { p: s.p + v * m, m: s.m + m, clase });
      }
    }
  }
  return { suma, nombres, total };
}

export default function PlanificadorEspana({ hoy }: { hoy: string }) {
  const [parametros, actualizar] = useParametrosUrl();
  const zona = ZONAS_ESPANA.find((z) => z.id === (parametros.get("zona") ?? "gallocanta")) ?? ZONAS_ESPANA[3];
  // sin punto ni zona en la dirección, la última ubicación elegida (solo en este navegador) o Gallocanta
  const guardada = useUbicacionGuardada();
  const usarGuardada = !parametros.has("lat") && !parametros.has("zona") && guardada !== null;
  const lat = parametros.has("lat") ? Number(parametros.get("lat")) : usarGuardada ? guardada.lat : zona.lat;
  const lon = parametros.has("lon") ? Number(parametros.get("lon")) : usarGuardada ? guardada.lon : zona.lon;
  const radio = Number(parametros.get("radio") ?? zona.radioKm);
  const fecha = parametros.get("fecha") ?? hoy;
  const grupo = parametros.get("grupo") ?? "todos";
  const nombreSitio = parametros.has("lat")
    ? (parametros.get("lugar") ?? `Tu punto (${lat.toFixed(2)}, ${lon.toFixed(2)})`)
    : usarGuardada
      ? (guardada.nombre ?? `Tu punto (${lat.toFixed(2)}, ${lon.toFixed(2)})`)
      : zona.nombre;
  const mes = Number(fecha.slice(5, 7)) - 1;
  const fasesLuna = luna(fecha);
  const luz = luzDia(fecha, lat, lon);

  // cada resultado va con la clave de su consulta: si no coincide con la actual, está cargando
  const claveTiempo = `${lat},${lon},${fecha}`;
  const [resTiempo, setResTiempo] = useState<{ clave: string; t: Prevision | Climatologia | null; error: boolean }>();
  useEffect(() => {
    let vivo = true;
    tiempoPara(lat, lon, fecha).then(
      (t) => vivo && setResTiempo({ clave: claveTiempo, t, error: false }),
      () => vivo && setResTiempo({ clave: claveTiempo, t: null, error: true }),
    );
    return () => {
      vivo = false;
    };
  }, [lat, lon, fecha, claveTiempo]);
  const tiempo = resTiempo?.clave === claveTiempo ? resTiempo.t : null;
  const errorTiempo = resTiempo?.clave === claveTiempo && resTiempo.error;

  const celdas = celdasEnRadio(lat, lon, radio);
  const claveBloques = [...new Set(celdas.map(bloque))].sort().join(",");
  const [resBloques, setResBloques] = useState<{ clave: string; b: BloqueEspana[] | "sin-datos" }>();
  useEffect(() => {
    let vivo = true;
    Promise.all(
      claveBloques.split(",").map((b) =>
        fetch(`/fauna/datos/${b}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((bs: (BloqueEspana | null)[]) => {
      if (!vivo) return;
      const con = bs.filter((b): b is BloqueEspana => b !== null);
      setResBloques({ clave: claveBloques, b: con.length ? con : "sin-datos" });
    });
    return () => {
      vivo = false;
    };
  }, [claveBloques]);
  const bloques = resBloques?.clave === claveBloques ? resBloques.b : null;

  // mejores franjas del día: luz × tiempo (con previsión); con climatología, las horas doradas
  const horas: (HoraTiempo & { luz: number; tiempo: number; momento: Momento })[] =
    tiempo?.tipo === "prevision"
      ? tiempo.horas.map((h) => ({
          ...h,
          luz: calidadLuz(h.instante, luz) * factorNubes(h),
          tiempo: factorTiempo(h),
          momento: momentoDe(h.instante, luz),
        }))
      : [];
  const mejores = [...horas]
    .filter((h) => h.luz > 0)
    .sort((a, b) => b.luz * b.tiempo - a.luz * a.tiempo)
    .slice(0, 3);
  const mejor = mejores[0];

  let especies: Especie[] = [];
  let cita: string | null = null;
  let hayRecientes = false;
  if (Array.isArray(bloques)) {
    cita = bloques[0]?.cita ?? null;
    const { suma, nombres, total } = especiesDelRadio(bloques, new Set(celdas), mes);
    const deteccion = deteccionRadio(bloques, new Set(celdas), mes);
    const ultimas = ultimasVistas(bloques, lat, lon, radio);
    hayRecientes = bloques.some((b) => b.recientes);
    const planPronto = Math.abs(Date.parse(fecha) - Date.parse(hoy)) <= DIAS_PLAN_RECIENTES * DIA_MS;
    especies = [...suma.entries()]
      .filter(([, s]) => s.m > 0 && s.p > 0)
      .map(([k, s]) => {
        const permil = Math.round(s.p / s.m);
        // para la nota, el ‰ de todos los registros de la zona (todos los grupos), no el de su grupo: el de su grupo
        // ponía un conejo con 487 ‰ de 39 registros de mamíferos por encima de una gaviota con 127 ‰ de 42 008 de
        // aves (en el 84 % de las cuadrículas con dos grupos la primera no era un ave). En el año de prueba ordena
        // mejor: AUC 0,884 frente a 0,873 (docs/espana-experimentos.json, análisis del 09-11-2026)
        const permilNota = total ? Math.round(s.p / total) : 0;
        const cientifico = nombres[k]?.c ?? null;
        const ultima = cientifico ? (ultimas.get(especieDe(cientifico)) ?? null) : null;
        // sin observación reciente (o a meses vista) la presencia es neutra
        const dias =
          ultima && planPronto ? Math.max(0, Math.round((Date.parse(hoy) - Date.parse(ultima.f)) / DIA_MS)) : null;
        return {
          clave: k,
          nombre: nombres[k]?.n ?? nombres[k]?.c ?? k,
          cientifico: nombres[k]?.c ?? null,
          estado: nombres[k]?.estado,
          aviso: nombres[k]?.nota ?? null,
          clase: s.clase,
          permil,
          muestra: s.m,
          ultima,
          nota: puntuar({
            permil: permilNota,
            deteccion: s.clase === "Aves" ? (deteccion.get(k) ?? null) : null,
            diasDesdeUltimo: dias,
            actividad: actividadPorDefecto(s.clase),
            perfil: nombres[k]?.h ?? null,
            facilidad: factorFotografia(nombres[k]?.c, s.clase),
            momento: mejor?.momento ?? "dorada",
            luz: mejor?.luz ?? 1,
            tiempo: mejor?.tiempo ?? 1,
          }),
        };
      })
      .sort((a, b) => b.nota.total - a.nota.total);
  }
  // la frecuencia es dentro de su grupo: un grupo con pocas observaciones (anfibios, mamíferos) da ‰ altos y, todo
  // junto, se comería a las aves; por eso se puede elegir grupo y el recuento de cada uno se ve en el botón
  const porGrupo = new Map<string, number>();
  for (const e of especies) porGrupo.set(e.clase, (porGrupo.get(e.clase) ?? 0) + 1);
  // en «Todas» se alternan los grupos por su puesto dentro de cada uno (la mejor ave, el mejor mamífero…): los ‰
  // de grupos distintos no se pueden comparar (hay cientos de aves para repartir y pocos anfibios)
  const puesto = new Map<string, number>();
  const vistos = new Map<string, number>();
  for (const e of especies) {
    const n = vistos.get(e.clase) ?? 0;
    puesto.set(e.clave, n);
    vistos.set(e.clase, n + 1);
  }
  const visibles = (
    grupo === "todos"
      ? [...especies].sort(
          (a, b) => (puesto.get(a.clave) ?? 0) - (puesto.get(b.clave) ?? 0) || b.nota.total - a.nota.total,
        )
      : especies.filter((e) => e.clase === grupo)
  ).slice(0, MAX_ESPECIES);

  const hora = (d: Date | null) => (d ? horaLocal(d, lon) : "–");
  const franja = (f: Franja | null) => (f ? `${hora(f.desde)}–${hora(f.hasta)}` : "–");

  return (
    <>
      <section className="seccion formulario-plan">
        <ElegirLugar
          lat={lat}
          lon={lon}
          mes={mes}
          nombre={nombreSitio}
          elegir={(e) =>
            actualizar({
              lat: e.lat.toFixed(3),
              lon: e.lon.toFixed(3),
              radio: String(e.radio),
              lugar: e.nombre,
              zona: null,
            })
          }
        />
        <label className="campo">
          <span className="rotulo">Radio</span>
          <select value={radio} onChange={(e) => actualizar({ radio: e.target.value })}>
            {RADIOS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Día</span>
          <input type="date" value={fecha} onChange={(e) => e.target.value && actualizar({ fecha: e.target.value })} />
        </label>
      </section>

      <ResumenDia
        mejor={
          mejor
            ? {
                hora: mejor.hora.slice(11, 16),
                momento: TEXTO_MOMENTO[mejor.momento],
                lluvia: mejor.probLluvia,
                viento: Math.round(mejor.rachas),
                direccion: mejor.direccion ?? null,
              }
            : null
        }
        tiempoCargado={Boolean(tiempo)}
        especies={visibles.slice(0, 5).map((e) => ({ clave: e.clave, nombre: e.nombre }))}
        lugar={nombreSitio}
      />

      <FenomenosEspana
        fenomenos={fenomenosCerca(lat, lon, radio, mes + 1)}
        mesHoy={mes}
        titulo={`Qué pasa en ${MESES[mes]} cerca de aquí`}
      />

      <section className="seccion" aria-labelledby="especies-titulo" aria-live="polite">
        <h2 className="rotulo" id="especies-titulo">
          Qué se registra más en {MESES[mes]}
        </h2>
        {bloques === null && <Esqueleto alto={400} />}
        {bloques === "sin-datos" && (
          <p className="nota-pie">
            Aún no hay datos de especies para España: saldrán de una descarga de GBIF por cuadrícula de 10 km (en
            preparación). Mientras, la luz y el tiempo ya funcionan.
          </p>
        )}
        {Array.isArray(bloques) && (
          <>
            {porGrupo.size > 1 && (
              <p className="filtro-grupos" role="group" aria-label="Grupo">
                {[
                  ["todos", "Todas", especies.length] as const,
                  ...GRUPOS.filter(([c]) => porGrupo.has(c)).map(([c, t]) => [c, t, porGrupo.get(c) ?? 0] as const),
                ].map(([c, t, n]) => (
                  <button
                    key={c}
                    type="button"
                    className="quitar"
                    aria-pressed={grupo === c}
                    onClick={() => actualizar({ grupo: c === "todos" ? null : c })}
                  >
                    {t} <small>{n}</small>
                  </button>
                ))}
              </p>
            )}
            <ol className="lista-especies-espana">
              {visibles.map((e) => {
                const n = nivelFrecuencia(e.permil);
                const c = confianza(e.muestra);
                return (
                  <li key={e.clave}>
                    <details>
                      <summary>
                        <span className="fila-especie">
                          <b>{e.nombre}</b>
                          <span className={`chip f-texto-${n.clave}`}>{textoFrecuencia(e.permil)}</span>
                          {e.estado === "invasora" && <span className="chip etiqueta-invasora">invasora</span>}
                        </span>
                        <span className="notas-especie">
                          Verla {Math.round(e.nota.verla * 10)}/10 · foto {Math.round(e.nota.fotografiarla * 10)}/10 ·{" "}
                          <span className={`confianza-${c?.clave ?? "ninguna"}`}>{c?.texto ?? "muy poca muestra"}</span>
                          {e.ultima && <span className="visto-reciente"> · vista el {fechaCorta(e.ultima.f)}</span>}
                        </span>
                      </summary>
                      <p className="cabeza-desglose">
                        <i>{e.cientifico}</i>
                        {e.ultima?.l && <small> · última vez en {e.ultima.l.replace(/--/g, " · ")}</small>}
                      </p>
                      <ul className="desglose">
                        {e.nota.factores.map((f) => (
                          <li key={f.clave}>
                            {f.nombre}: {Math.round(f.valor * 100)} % <small>({f.detalle})</small>
                          </li>
                        ))}
                        {e.estado === "invasora" && (
                          <li>
                            Especie exótica invasora (Catálogo español): se puede ver, pero no es fauna autóctona.
                          </li>
                        )}
                        {e.aviso && <li>Ojo: {e.aviso}.</li>}
                        <li>
                          <Link href={`/fauna/especie/${e.clave}`}>
                            Ficha de la especie: cuándo, dónde y cómo fotografiarla →
                          </Link>
                        </li>
                        <li>
                          Muestra: {e.muestra.toLocaleString("es-ES")} observaciones de su grupo
                          {c ? ` (${c.texto})` : ""}
                          {"; la nota compara con todos los registros de la zona, de todos los grupos"}
                        </li>
                      </ul>
                    </details>
                  </li>
                );
              })}
            </ol>
            {cita && <p className="nota-pie">{cita}</p>}
            {especies.some((e) => e.clase === "Aves") && (
              <p className="nota-pie">
                <CitaEbird />
              </p>
            )}
            {hayRecientes && (
              <p className="nota-pie">
                Visto en los últimos 30 días: aves de <a href="https://ebird.org">eBird</a> (Cornell Lab of Ornithology,
                la última de cada especie en cada provincia) y mamíferos, reptiles y anfibios de{" "}
                <a href="https://www.inaturalist.org">iNaturalist</a> (grado de investigación, sin especies sensibles);
                solo cuentan en la nota si vas en las próximas dos semanas.
              </p>
            )}
          </>
        )}
      </section>

      <details className="seccion detalles-dia">
        <summary className="rotulo">Luz, mar y tiempo hora a hora</summary>
        <section className="seccion" aria-labelledby="luz-titulo">
          <h2 className="rotulo" id="luz-titulo">
            Luz
          </h2>
          <LuzYMar lat={lat} lon={lon} fecha={fecha} />
          <p className="nota-pie">
            Luna: {fasesLuna.nombre}, {Math.round(fasesLuna.iluminada * 100)} % iluminada
            {fasesLuna.iluminada < 0.2
              ? " · noche oscura: buena para fotografía nocturna y mamíferos que evitan la luz"
              : fasesLuna.iluminada > 0.85
                ? " · noche clara: siluetas y paisaje nocturno con luz de luna"
                : ""}
            .
          </p>
          <dl className="luz-dia">
            <div>
              <dt>Hora azul</dt>
              <dd>{franja(luz.azulManana)}</dd>
            </div>
            <div>
              <dt>Hora dorada</dt>
              <dd>{franja(luz.doradaManana)}</dd>
            </div>
            <div>
              <dt>Salida y puesta</dt>
              <dd>
                {hora(luz.amanecer)} · {hora(luz.atardecer)}
              </dd>
            </div>
            <div>
              <dt>Hora dorada</dt>
              <dd>{franja(luz.doradaTarde)}</dd>
            </div>
            <div>
              <dt>Hora azul</dt>
              <dd>{franja(luz.azulTarde)}</dd>
            </div>
          </dl>
        </section>

        <section className="seccion" aria-labelledby="tiempo-titulo" aria-live="polite">
          <h2 className="rotulo" id="tiempo-titulo">
            Tiempo{" "}
            {tiempo && (
              <span className={`etiqueta-tiempo ${tiempo.tipo}`}>
                {tiempo.tipo === "prevision" ? "previsión" : `climatología ${tiempo.desde}-${tiempo.hasta}`}
              </span>
            )}
          </h2>
          {errorTiempo && <p className="nota-pie">No se pudo consultar Open-Meteo.</p>}
          {!tiempo && !errorTiempo && <p className="nota-pie">Consultando Open-Meteo…</p>}
          {tiempo?.tipo === "climatologia" && (
            <p>
              Faltan más de 16 días: lo normal esos días del año en {tiempo.desde}-{tiempo.hasta} fue{" "}
              <b>{tiempo.diasLluvia} % de días con lluvia</b>, nubosidad media del {tiempo.nubes} % y viento máximo de{" "}
              {tiempo.vientoMax} km/h. La previsión se podrá consultar 16 días antes.
            </p>
          )}
          {tiempo?.tipo === "prevision" && (
            <>
              {mejores.length > 0 && (
                <p className="aviso-plan">
                  <b>Mejores franjas:</b>{" "}
                  {mejores
                    .map(
                      (h) =>
                        `${h.hora.slice(11, 16)} (${TEXTO_MOMENTO[h.momento]}${h.tiempo < 1 ? ", con lluvia o viento" : ""})`,
                    )
                    .join(" · ")}
                </p>
              )}
              <div className="tabla-desliza">
                <table className="tabla-comparar tabla-tiempo">
                  <thead>
                    <tr>
                      <th scope="col">Hora</th>
                      <th scope="col">Nubes bajas</th>
                      <th scope="col">Medias</th>
                      <th scope="col">Altas</th>
                      <th scope="col">Lluvia</th>
                      <th scope="col">Viento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horas
                      .filter((h) => h.momento !== "noche")
                      .map((h) => (
                        <tr key={h.hora} className={`momento-${h.momento}`}>
                          <th scope="row">
                            {h.hora.slice(11, 16)} <small>{TEXTO_MOMENTO[h.momento]}</small>
                          </th>
                          <td>{h.nubesBajas} %</td>
                          <td>{h.nubesMedias} %</td>
                          <td>{h.nubesAltas} %</td>
                          <td>{h.probLluvia ?? "–"} %</td>
                          <td>
                            {h.direccion !== null && h.direccion !== undefined ? `${rumbo(h.direccion)} ` : ""}
                            {Math.round(h.rachas)} km/h
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {mejor?.direccion !== null && mejor?.direccion !== undefined && (
                <p className="nota-pie">
                  En la mejor franja el viento viene del {rumbo(mejor.direccion)}: con mamíferos, acércate de cara al
                  viento (desde el {rumbo(mejor.direccion)}) para que no te huelan.
                </p>
              )}
            </>
          )}
        </section>
      </details>
    </>
  );
}
