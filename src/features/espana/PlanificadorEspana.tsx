"use client";
// Fauna en España para un lugar y un día: luz (horas dorada y azul), tiempo (previsión o climatología, diciendo
// cuál), las mejores franjas y, cuando haya datos de GBIF, las especies probables ese mes con dos notas (verla y
// fotografiarla) y su desglose. Todo en el navegador: Open-Meteo sin clave y los datos de la cuadrícula por bloques.
import { useEffect, useState } from "react";
import { useParametrosUrl } from "@/lib/almacen";
import { MESES } from "@/lib/fechas";
import { calidadLuz, luzDia, type Franja, type LuzDia } from "@/lib/luz";
import { horaLocal } from "@/lib/sol";
import { bloque, celdasEnRadio } from "@/lib/rejilla";
import {
  factorNubes,
  factorTiempo,
  tiempoPara,
  type Climatologia,
  type HoraTiempo,
  type Prevision,
} from "@/lib/tiempo";
import { confianza, nivelFrecuencia } from "@/features/safaris/modelo";
import { actividadPorDefecto, puntuar, type Puntuacion } from "@/features/espana/puntuacion";
import { ZONAS_ESPANA, type BloqueEspana } from "@/features/espana/zonas";

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
}

/** Une las celdas del radio: ‰ de cada especie ponderado por la muestra de su clase en cada celda. */
function especiesDelRadio(bloques: BloqueEspana[], celdas: Set<string>, mes: number) {
  const suma = new Map<string, { p: number; m: number; clase: string }>();
  const nombres: BloqueEspana["especies"] = {};
  for (const b of bloques) {
    Object.assign(nombres, b.especies);
    for (const [c, d] of Object.entries(b.celdas)) {
      if (!celdas.has(c)) continue;
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
  return { suma, nombres };
}

export default function PlanificadorEspana({ hoy }: { hoy: string }) {
  const [parametros, actualizar] = useParametrosUrl();
  const zona = ZONAS_ESPANA.find((z) => z.id === (parametros.get("zona") ?? "gallocanta")) ?? ZONAS_ESPANA[3];
  const lat = parametros.has("lat") ? Number(parametros.get("lat")) : zona.lat;
  const lon = parametros.has("lon") ? Number(parametros.get("lon")) : zona.lon;
  const radio = Number(parametros.get("radio") ?? zona.radioKm);
  const fecha = parametros.get("fecha") ?? hoy;
  const mes = Number(fecha.slice(5, 7)) - 1;
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
        fetch(`/espana/datos/${b}`)
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
  if (Array.isArray(bloques)) {
    cita = bloques[0]?.cita ?? null;
    const { suma, nombres } = especiesDelRadio(bloques, new Set(celdas), mes);
    especies = [...suma.entries()]
      .filter(([, s]) => s.m > 0 && s.p > 0)
      .map(([k, s]) => {
        const permil = Math.round(s.p / s.m);
        return {
          clave: k,
          nombre: nombres[k]?.n ?? nombres[k]?.c ?? k,
          cientifico: nombres[k]?.c ?? null,
          clase: s.clase,
          permil,
          muestra: s.m,
          nota: puntuar({
            permil,
            diasDesdeUltimo: null,
            actividad: actividadPorDefecto(s.clase),
            momento: mejor?.momento ?? "dorada",
            luz: mejor?.luz ?? 1,
            tiempo: mejor?.tiempo ?? 1,
          }),
        };
      })
      .sort((a, b) => b.nota.total - a.nota.total)
      .slice(0, MAX_ESPECIES);
  }

  const hora = (d: Date | null) => (d ? horaLocal(d, lon) : "–");
  const franja = (f: Franja | null) => (f ? `${hora(f.desde)}–${hora(f.hasta)}` : "–");

  return (
    <>
      <section className="seccion formulario-plan">
        <label className="campo">
          <span className="rotulo">Dónde</span>
          <select
            value={parametros.has("lat") ? "aqui" : zona.id}
            onChange={(e) => {
              if (e.target.value !== "aqui") {
                actualizar({ zona: e.target.value, lat: null, lon: null, radio: null });
                return;
              }
              navigator.geolocation?.getCurrentPosition((p) =>
                actualizar({ lat: p.coords.latitude.toFixed(3), lon: p.coords.longitude.toFixed(3), zona: null }),
              );
            }}
          >
            {ZONAS_ESPANA.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
            <option value="aqui">Mi ubicación</option>
          </select>
        </label>
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

      <section className="seccion" aria-labelledby="luz-titulo">
        <h2 className="rotulo" id="luz-titulo">
          Luz
        </h2>
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
                    <th scope="col">Rachas</th>
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
                        <td>{Math.round(h.rachas)} km/h</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="seccion" aria-labelledby="especies-titulo" aria-live="polite">
        <h2 className="rotulo" id="especies-titulo">
          Qué es probable ver en {MESES[mes]}
        </h2>
        {bloques === null && <p className="nota-pie">Cargando…</p>}
        {bloques === "sin-datos" && (
          <p className="nota-pie">
            Aún no hay datos de especies para España: saldrán de una descarga de GBIF por cuadrícula de 10 km (en
            preparación). Mientras, la luz y el tiempo ya funcionan.
          </p>
        )}
        {Array.isArray(bloques) && (
          <>
            <ol className="lista-especies-espana">
              {especies.map((e) => {
                const n = nivelFrecuencia(e.permil);
                const c = confianza(e.muestra);
                return (
                  <li key={e.clave}>
                    <details>
                      <summary>
                        <b>{e.nombre}</b> <i>{e.cientifico}</i> <span className={`f-texto-${n.clave}`}>{n.texto}</span>
                        <span className="notas-especie">
                          verla {Math.round(e.nota.verla * 10)}/10 · fotografiarla{" "}
                          {Math.round(e.nota.fotografiarla * 10)}/10
                        </span>
                      </summary>
                      <ul className="desglose">
                        {e.nota.factores.map((f) => (
                          <li key={f.clave}>
                            {f.nombre}: {Math.round(f.valor * 100)} % <small>({f.detalle})</small>
                          </li>
                        ))}
                        <li>
                          Muestra: {e.muestra.toLocaleString("es-ES")} observaciones de su grupo
                          {c ? ` (${c.texto})` : ""}
                        </li>
                      </ul>
                    </details>
                  </li>
                );
              })}
            </ol>
            {cita && <p className="nota-pie">{cita}</p>}
          </>
        )}
      </section>
    </>
  );
}
