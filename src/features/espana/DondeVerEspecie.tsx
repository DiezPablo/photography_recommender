"use client";
// «¿Dónde veo esta especie?» en España: buscas una especie y salen sus lugares (celdas de 10 km con el espacio
// protegido más cercano), de más a menos frecuente en el mes elegido o en su mejor mes, con su mejor época y la
// confianza; cada lugar lleva a «¿Qué veo aquí?» con ese punto.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParametrosUrl } from "@/lib/almacen";
import { MESES, rangoMeses } from "@/lib/fechas";
import { confianza, nivelFrecuencia } from "@/features/safaris/modelo";
import MapaEventos from "@/ui/mapa/MapaEventos";
import BotonVista from "@/features/espana/BotonVista";
import FenomenosEspana from "@/features/espana/FenomenosEspana";
import { fenomenosDe } from "@/features/espana/fenomenos";

interface EspecieLista {
  k: string;
  n: string | null;
  c: string | null;
  clase: string | null;
  estado?: "invasora" | "aviso" | null;
  nota?: string | null;
  celdas: number;
}

interface Lugar {
  celda: string;
  lat: number;
  lon: number;
  lugar: { nombre: string; km: number; id: string } | null;
  meses: (number | null)[];
  muestra: number[];
  celdas: number;
}

/** Cerca de un espacio protegido, su nombre; algo más lejos, la distancia a él; si no, las coordenadas. */
const titulo = (l: Lugar) =>
  !l.lugar
    ? `Cuadrícula en ${l.lat.toFixed(2)}, ${l.lon.toFixed(2)}`
    : l.lugar.km < 15
      ? l.lugar.nombre
      : `A ${l.lugar.km} km de ${l.lugar.nombre}`;
const nombre = (e: Pick<EspecieLista, "n" | "c">) => e.n ?? e.c ?? "Especie sin nombre";
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function DondeVerEspecie({ hoy }: { hoy: string }) {
  const [parametros, actualizar] = useParametrosUrl();
  const clave = parametros.get("k");
  const mes = parametros.get("mes") === "todo" ? null : Number(parametros.get("mes") ?? Number(hoy.slice(5, 7)) - 1);
  const [busqueda, setBusqueda] = useState("");
  const [lista, setLista] = useState<EspecieLista[] | null>(null);
  const [res, setRes] = useState<{ clave: string; lugares: Lugar[] | null; cita: string | null }>();

  useEffect(() => {
    let vivo = true;
    fetch("/espana/especies.json")
      .then((r) => (r.ok ? r.json() : { especies: [] }))
      .then((d: { especies: EspecieLista[] }) => vivo && setLista(d.especies))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, []);

  const claveConsulta = clave ? `${clave}|${mes ?? "todo"}` : "";
  useEffect(() => {
    if (!clave) return;
    let vivo = true;
    fetch(`/espana/especie/${clave}${mes === null ? "" : `?mes=${mes}`}`)
      .then((r) => (r.ok ? r.json() : { lugares: null, cita: null }))
      .then(
        (d: { lugares: Lugar[] | null; cita: string | null }) =>
          vivo && setRes({ clave: claveConsulta, lugares: d.lugares, cita: d.cita }),
      )
      .catch(() => vivo && setRes({ clave: claveConsulta, lugares: null, cita: null }));
    return () => {
      vivo = false;
    };
  }, [clave, mes, claveConsulta]);
  const lugares = res?.clave === claveConsulta ? res.lugares : undefined;

  if (lista === null) return <p className="nota-pie">Cargando especies…</p>;
  if (!lista.length)
    return (
      <p className="nota-pie">
        Aún no hay datos de especies para España: saldrán de una descarga de GBIF por cuadrícula de 10 km (en
        preparación).
      </p>
    );

  const elegida = lista.find((e) => e.k === clave);
  const q = sinTildes(busqueda.trim());
  const opciones = q ? lista.filter((e) => sinTildes(`${e.n ?? ""} ${e.c ?? ""}`).includes(q)).slice(0, 12) : [];
  const fechaMes = (m: number) => `${hoy.slice(0, 4)}-${String(m + 1).padStart(2, "0")}-15`;

  return (
    <>
      <section className="seccion formulario-plan">
        <div className="campo buscador-especie">
          <label className="rotulo" htmlFor="buscar-especie">
            Especie
          </label>
          <input
            id="buscar-especie"
            type="search"
            placeholder={elegida ? nombre(elegida) : "Grulla, lince, quebrantahuesos…"}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoComplete="off"
          />
          {opciones.length > 0 && (
            <ul className="opciones-especie" role="listbox">
              {opciones.map((e) => (
                <li key={e.k}>
                  <button
                    type="button"
                    onClick={() => {
                      actualizar({ k: e.k });
                      setBusqueda("");
                    }}
                  >
                    <b>{nombre(e)}</b> <i>{e.c}</i> <small>{e.celdas} cuadrículas</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="campo">
          <span className="rotulo">Cuándo</span>
          <select value={mes ?? "todo"} onChange={(e) => actualizar({ mes: e.target.value })}>
            <option value="todo">En su mejor mes</option>
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!clave && (
        <section className="seccion">
          <p>Busca una especie para ver dónde y cuándo es más fácil verla. Las más registradas:</p>
          <p className="enlaces-especies">
            {lista.slice(0, 16).map((e) => (
              <button key={e.k} type="button" className="quitar" onClick={() => actualizar({ k: e.k })}>
                {nombre(e)}
              </button>
            ))}
          </p>
        </section>
      )}

      {clave && (
        <section className="seccion" aria-live="polite">
          <h2 className="rotulo">
            Dónde ver {elegida ? nombre(elegida).toLowerCase() : "la especie"}
            {mes !== null ? ` en ${MESES[mes]}` : ""}
          </h2>
          {elegida && (
            <p>
              <BotonVista clave={elegida.k} especie={{ n: nombre(elegida), c: elegida.c, clase: elegida.clase }} />
            </p>
          )}
          {elegida?.estado === "invasora" && (
            <p className="aviso-plan">
              Especie exótica invasora (Catálogo español de especies exóticas invasoras): no es fauna autóctona.
            </p>
          )}
          {elegida?.nota && <p className="aviso-plan">Ojo: {elegida.nota}.</p>}
          <FenomenosEspana
            fenomenos={fenomenosDe(elegida?.c)}
            mesHoy={Number(hoy.slice(5, 7)) - 1}
            titulo="Momentos especiales"
          />
          {lugares === undefined && <p className="nota-pie">Buscando…</p>}
          {lugares === null && <p className="nota-pie">No hay datos de esta especie.</p>}
          {lugares && lugares.length === 0 && (
            <p>
              No se ha registrado {mes !== null ? `en ${MESES[mes]}` : ""} con datos suficientes. Prueba con «En su
              mejor mes».
            </p>
          )}
          {lugares && lugares.length > 0 && (
            <>
              <MapaEventos
                etiqueta="Dónde se ve"
                eventos={lugares.map((l) => ({
                  id: l.celda,
                  nombre: titulo(l),
                  lat: l.lat,
                  lon: l.lon,
                  radio_km: 5,
                  categoria: "fauna",
                  href: `/espana?lat=${l.lat}&lon=${l.lon}&radio=5&fecha=${fechaMes(mes ?? Number(hoy.slice(5, 7)) - 1)}`,
                }))}
              />
              <ol className="lista-lugares">
                {lugares.map((l) => {
                  const m = mes ?? l.meses.reduce<number>((a, v, i) => ((v ?? 0) > (l.meses[a] ?? 0) ? i : a), 0);
                  const n = nivelFrecuencia(l.meses[m]);
                  const c = confianza(l.muestra[m]);
                  const buenos = l.meses.flatMap((v, i) => ((v ?? 0) >= 20 ? [i + 1] : []));
                  return (
                    <li key={l.celda}>
                      <b>
                        {l.lugar && l.lugar.km < 15 ? (
                          <Link href={`/espana/lugar/${encodeURIComponent(l.lugar.id)}`}>{titulo(l)}</Link>
                        ) : (
                          titulo(l)
                        )}
                      </b>
                      {l.celdas > 1 ? (
                        <small> ({l.celdas} cuadrículas)</small>
                      ) : (
                        l.lugar && l.lugar.km > 0 && l.lugar.km < 15 && <small> (a {l.lugar.km} km)</small>
                      )}{" "}
                      <span className={`f-texto-${n.clave}`}>
                        {n.texto} en {MESES[m]}
                      </span>
                      {c && <small className={`confianza-${c.clave}`}> · {c.texto}</small>}
                      <br />
                      <small>
                        {buenos.length ? `Mejor época: ${rangoMeses(buenos)}. ` : ""}
                        <Link href={`/espana?lat=${l.lat}&lon=${l.lon}&radio=5&fecha=${fechaMes(m)}`}>
                          Qué más se ve aquí, luz y tiempo →
                        </Link>
                      </small>
                    </li>
                  );
                })}
              </ol>
              {res?.cita && <p className="nota-pie">{res.cita}</p>}
              <p className="nota-pie">
                Frecuencia relativa: qué parte de las observaciones de su grupo en esa cuadrícula y mes son de esta
                especie. Refleja también dónde y cuándo va la gente; las especies sensibles (lince, oso, urogallo…)
                llegan de GBIF con la ubicación difuminada y aquí solo se ven por cuadrículas.
              </p>
            </>
          )}
        </section>
      )}
    </>
  );
}
