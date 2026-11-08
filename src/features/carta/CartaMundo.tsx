"use client";
// La carta de safaris: los parques del mundo sobre el mapa, con el mismo sistema que la carta de España. Sin especie,
// en magenta los que están en su temporada recomendada en el mes elegido. Con especie, el magenta dice qué parte de
// los registros de mamíferos del parque son de ella (‰, GBIF, todo el año) y el rayado, que hay menos de 100 registros
// de mamíferos detrás. Al tocar un parque, su ficha al lado (o abajo, en el móvil). Estado en la URL.
import type { LayerGroup, Map as LMap } from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParametrosUrl } from "@/lib/almacen";
import { INICIALES, MESES, mesDeParametro } from "@/lib/fechas";
import { useMapaBase } from "@/ui/mapa/useMapaBase";
import type { FilaIndice } from "@/features/safaris/modelo";
import type { EspecieMundo, FichaParqueCarta, ParqueEspecie } from "@/features/carta/mundo";
import { fiabilidad, TEXTO_FIABILIDAD } from "@/features/carta/estado";

type Capa = "fauna" | "fiabilidad" | "todos";
const CAPAS: Capa[] = ["fauna", "fiabilidad", "todos"];
const CAPA_TEXTO: Record<Capa, string> = {
  fauna: "Fauna (‰ de sus mamíferos)",
  fiabilidad: "Rayado: menos de 100 registros",
  todos: "También espacios con poca fauna",
};

/** Los mismos tramos de ‰ que la carta de España. */
const TRAMOS: [number, number, string][] = [
  [50, 0.88, "50 ‰ o más"],
  [20, 0.66, "20-49 ‰"],
  [5, 0.46, "5-19 ‰"],
  [1, 0.3, "1-4 ‰"],
  [0, 0.16, "menos de 1 ‰"],
];
const tramo = (v: number) => TRAMOS.findIndex(([d]) => v >= d);
const RADIO: Record<string, number> = { A: 7, B: 5, C: 3.5 };

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const enTemporada = (p: FilaIndice, mes: number) => (p.t ?? p.ep ?? []).includes(mes + 1);

export default function CartaMundo({ hoy }: { hoy: string }) {
  const [q, actualizar] = useParametrosUrl();
  const mes = mesDeParametro(q.get("mes")) ?? Number(hoy.slice(5, 7)) - 1;
  const especie = /^\d+$/.test(q.get("especie") ?? "") ? q.get("especie") : null;
  const parque = q.get("parque");
  const apagadas = (q.get("sin") ?? "").split(",").filter(Boolean);
  // «todos» (los de nivel C) va apagado por defecto: se enciende con ?con=todos
  const encendida = (c: Capa) => (c === "todos" ? q.get("con") === "todos" : !apagadas.includes(c));
  const { caja, mapa, leaflet, listo, nuevaCapa } = useMapaBase({
    scrollWheelZoom: true,
    zoomSnap: 0.5,
    minZoom: 2,
    worldCopyJump: true,
  });

  const [indice, setIndice] = useState<FilaIndice[]>([]);
  const [lista, setLista] = useState<EspecieMundo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [hojaAlta, setHojaAlta] = useState(false);
  const [datos, setDatos] = useState<{ clave: string; parques: ParqueEspecie[] }>();
  const [ficha, setFicha] = useState<{ id: string; f: FichaParqueCarta | null }>();

  useEffect(() => {
    fetch("/datos/safaris_indice.json")
      .then((r) => (r.ok ? r.json() : { parques: [] }))
      .then((d: { parques: FilaIndice[] }) => setIndice(d.parques))
      .catch(() => setIndice([]));
    fetch("/mapa/especies.json")
      .then((r) => (r.ok ? r.json() : { especies: [] }))
      .then((d: { especies: EspecieMundo[] }) => setLista(d.especies))
      .catch(() => setLista([]));
  }, []);

  useEffect(() => {
    if (!especie) return;
    let vivo = true;
    fetch(`/mapa/especie/${especie}`)
      .then((r) => (r.ok ? r.json() : { parques: [] }))
      .then((d: { parques: ParqueEspecie[] }) => vivo && setDatos({ clave: especie, parques: d.parques }))
      .catch(() => vivo && setDatos({ clave: especie, parques: [] }));
    return () => {
      vivo = false;
    };
  }, [especie]);
  const deEspecie = useMemo(
    () => new Map((especie && datos?.clave === especie ? datos.parques : []).map((x) => [x[0], x] as const)),
    [especie, datos],
  );

  useEffect(() => {
    if (!parque) return;
    let vivo = true;
    fetch(`/mapa/parque/${encodeURIComponent(parque)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((f: FichaParqueCarta | null) => vivo && setFicha({ id: parque, f }))
      .catch(() => vivo && setFicha({ id: parque, f: null }));
    return () => {
      vivo = false;
    };
  }, [parque]);
  const fichaActual = parque && ficha?.id === parque ? ficha.f : undefined;

  const todos = q.get("con") === "todos";
  const visibles = useMemo(
    () => indice.filter((p) => todos || p.nv !== "C" || p.id === parque),
    [indice, todos, parque],
  );
  const elegida = lista.find((e) => e.k === especie);

  // encuadre inicial: el de la URL, el parque elegido o el mundo
  const centrado = useRef(false);
  useEffect(() => {
    if (!listo || !mapa.current || centrado.current) return;
    const m = mapa.current;
    const c = (q.get("c") ?? "").split(",").map(Number);
    const z = Number(q.get("z"));
    if (c.length === 2 && c.every(Number.isFinite) && q.has("c")) {
      m.setView([c[0], c[1]], z >= 2 && z <= 14 ? z : 4, { animate: false });
      centrado.current = true;
    } else if (parque) {
      const p = indice.find((x) => x.id === parque);
      if (!p) return; // espera al índice
      centrarVisible(m, p.la, p.lo, 6, false);
      centrado.current = true;
    } else {
      m.setView([8, 20], 2, { animate: false });
      centrado.current = true;
    }
    m.on("moveend", () => {
      const ce = m.getCenter().wrap();
      actualizar({ c: `${ce.lat.toFixed(2)},${ce.lng.toFixed(2)}`, z: String(m.getZoom()) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, indice.length]);

  // parques: fuera de temporada o sin la especie, solo el contorno
  const capa = useRef<LayerGroup | null>(null);
  const capaRayado = useRef<LayerGroup | null>(null);
  useEffect(() => {
    if (!listo || !leaflet.current) return;
    const L = leaflet.current;
    capa.current ??= nuevaCapa();
    capaRayado.current ??= nuevaCapa();
    capa.current.clearLayers();
    capaRayado.current.clearLayers();
    const fauna = encendida("fauna");
    for (const p of visibles) {
      const x = deEspecie.get(p.id);
      const radio = RADIO[p.nv ?? "B"];
      let clase = "parque-fuera";
      let opacidad = 0;
      if (especie && fauna && x) {
        clase = "parque-fauna";
        opacidad = TRAMOS[tramo(x[1])][1];
      } else if (!especie && enTemporada(p, mes)) {
        clase = "parque-fauna";
        opacidad = 0.7;
      }
      const elegido = p.id === parque;
      // con una especie elegida, los parques que no la tienen quedan como un punto pequeño, para orientarse
      const apagado = !!especie && !x && !elegido;
      L.circleMarker([p.la, p.lo], {
        radius: elegido ? radio + 3 : apagado ? 2 : radio,
        weight: elegido ? 3 : 1,
        fillOpacity: opacidad,
        className: `${clase}${elegido ? " parque-elegido" : ""}`,
        bubblingMouseEvents: false,
      })
        .bindTooltip(p.n, { direction: "top", offset: [0, -radio] })
        .on("click", () => {
          actualizar({ parque: p.id });
          setHojaAlta(true);
          if (mapa.current) centrarVisible(mapa.current, p.la, p.lo, Math.max(mapa.current.getZoom(), 5));
        })
        .addTo(capa.current);
      if (especie && fauna && x && encendida("fiabilidad") && x[2] < 100)
        L.circleMarker([p.la, p.lo], {
          radius: radio,
          stroke: false,
          fillOpacity: 1,
          className: "celda-rayada",
          interactive: false,
        }).addTo(capaRayado.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, leaflet, nuevaCapa, visibles, deEspecie, especie, mes, parque, q.get("sin")]);

  const qb = sinTildes(busqueda.trim());
  const opciones = qb ? lista.filter((e) => sinTildes(`${e.n ?? ""} ${e.c}`).includes(qb)).slice(0, 8) : [];
  const elegirEspecie = (k: string | null) => {
    actualizar({ especie: k });
    setBusqueda("");
  };
  const alternar = (c: Capa) => {
    if (c === "todos") actualizar({ con: encendida("todos") ? null : "todos" });
    else {
      const s = encendida(c) ? [...apagadas, c] : apagadas.filter((x) => x !== c);
      actualizar({ sin: s.length ? s.join(",") : null });
    }
  };
  const irA = (id: string) => {
    const p = indice.find((x) => x.id === id);
    actualizar({ parque: id });
    setHojaAlta(true);
    if (p && mapa.current) centrarVisible(mapa.current, p.la, p.lo, Math.max(mapa.current.getZoom(), 5));
  };

  const nombreParque = new Map(indice.map((p) => [p.id, p] as const));
  const conEspecie = [...deEspecie.values()].filter(([id]) => nombreParque.has(id));
  const porTramo = TRAMOS.map((_, i) => conEspecie.filter(([, v]) => tramo(v) === i).length);
  const mejores = conEspecie
    .filter(([id, , n]) => n >= 100 && nombreParque.get(id)?.nv !== "C")
    .sort((a, b) => b[1] - a[1] || b[3] - a[3])
    .slice(0, 8);
  // tira de meses: cuántos parques están en temporada cada mes (con especie, de los que la tienen)
  const base = especie ? conEspecie.map(([id]) => nombreParque.get(id)!) : visibles;
  const porMes = MESES.map((_, i) => base.filter((p) => enTemporada(p, i)).length);
  const maxMes = Math.max(1, ...porMes);
  const enMes = visibles
    .filter((p) => p.nv !== "C" && enTemporada(p, mes))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8);

  return (
    <div className="carta carta-mundo" data-hoja={hojaAlta ? "alta" : "baja"}>
      <svg width="0" height="0" className="sr" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="carta-rayado" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="var(--carta-papel)" fillOpacity="0.4" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--carta-tinta)" strokeWidth="1.2" strokeOpacity="0.65" />
          </pattern>
        </defs>
      </svg>
      <div
        ref={caja}
        className="carta-mapa"
        role="region"
        aria-label="Mapa de los parques del mundo"
        data-listo={listo ? "si" : "no"}
      />
      <aside className="carta-panel" aria-label="Especie, mes y parque">
        <button type="button" className="carta-asa" aria-expanded={hojaAlta} onClick={() => setHojaAlta(!hojaAlta)}>
          <span className="sr">{hojaAlta ? "Bajar el panel" : "Subir el panel"}</span>
        </button>
        <h1 className="carta-titulo">
          {elegida ? (elegida.n ?? elegida.c) : "Safaris"}
          <span className="carta-titulo-mes"> en {MESES[mes]}</span>
        </h1>

        <div className="carta-campo carta-buscador">
          <label htmlFor="carta-especie">Mamífero</label>
          <input
            id="carta-especie"
            type="search"
            autoComplete="off"
            placeholder={elegida ? "Cambiar de especie" : "León, gorila de montaña, oso polar…"}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-controls="carta-opciones"
          />
          {opciones.length > 0 && (
            <ul id="carta-opciones" className="carta-opciones">
              {opciones.map((e) => (
                <li key={e.k}>
                  <button type="button" onClick={() => elegirEspecie(e.k)}>
                    <b>{e.n ?? e.c}</b> <i>{e.c}</i>
                    <span className="cifra">{e.parques} parques</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {elegida && (
            <p className="carta-elegida">
              <i>{elegida.c}</i> · entre los 12 mamíferos más registrados de {elegida.parques} parques{" "}
              <button type="button" className="boton-texto" onClick={() => elegirEspecie(null)}>
                Quitar
              </button>
            </p>
          )}
        </div>

        <fieldset className="carta-meses">
          <legend>
            Mes<span className="leyenda-curva"> · barras: parques en temporada</span>
          </legend>
          {MESES.map((m, i) => (
            <button
              key={m}
              type="button"
              aria-pressed={mes === i}
              aria-label={m}
              onClick={() => actualizar({ mes: m })}
            >
              <span className="barra-mes" style={{ height: `${Math.round((porMes[i] / maxMes) * 100)}%` }} />
              <span className="inicial-mes">{INICIALES[i]}</span>
            </button>
          ))}
        </fieldset>

        {parque ? (
          <FichaParque
            id={parque}
            f={fichaActual}
            mes={mes}
            especie={especie}
            alCerrar={() => actualizar({ parque: null })}
            alElegirEspecie={elegirEspecie}
          />
        ) : especie ? (
          <section className="carta-resumen" aria-label="Dónde se registra más">
            {conEspecie.length === 0 ? (
              <p>{datos?.clave === especie ? "Sin registros en los parques." : "Cargando…"}</p>
            ) : (
              <>
                <table className="tabla-tramos">
                  <caption>
                    {conEspecie.length.toLocaleString("es-ES")} parques donde está entre los 12 mamíferos más
                    registrados
                  </caption>
                  <tbody>
                    {TRAMOS.map(([, op, texto], i) => (
                      <tr key={texto}>
                        <th scope="row">
                          <span className="muestra-tramo" style={{ opacity: op }} /> {texto}
                        </th>
                        <td className="num cifra">{porTramo[i]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mejores.length > 0 && (
                  <>
                    <h2 className="carta-h2">Las más altas con 100 registros de mamíferos o más</h2>
                    <ol className="lista-mejores">
                      {mejores.map(([id, v, n]) => {
                        const p = nombreParque.get(id)!;
                        return (
                          <li key={id}>
                            <button type="button" onClick={() => irA(id)}>
                              <b>{p.n}</b>
                              <span className="cifra">{v} ‰</span>
                              <span className="cifra muestra">{n.toLocaleString("es-ES")} reg.</span>
                              <span className="cod">
                                {p.p ?? ""}
                                {enTemporada(p, mes) ? ` · temporada en ${MESES[mes]}` : ""}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                )}
              </>
            )}
          </section>
        ) : (
          <section className="carta-resumen" aria-label={`En temporada en ${MESES[mes]}`}>
            <h2 className="carta-h2">
              En temporada en {MESES[mes]}: <span className="cifra">{porMes[mes].toLocaleString("es-ES")}</span> parques
            </h2>
            <ol className="lista-sube">
              {enMes.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => irA(p.id)}>
                    <b>{p.n}</b>
                    <span className="cifra">
                      {p.p ?? ""} · {p.m} mamíferos registrados
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="nota-celda">
              Temporada: la recomendada del catálogo en los 65 destacados y, en el resto, los meses más secos (NASA
              POWER). Ordenados por cuánta fauna emblemática se ha registrado. Elige un mamífero para ver dónde se
              registra más, o toca un parque.
            </p>
          </section>
        )}

        <fieldset className="carta-capas">
          <legend>Capas</legend>
          {CAPAS.map((c) => (
            <label key={c}>
              <input type="checkbox" checked={encendida(c)} onChange={() => alternar(c)} />
              <span className={`muestra-capa capa-${c}`} aria-hidden="true" />
              {CAPA_TEXTO[c]}
            </label>
          ))}
        </fieldset>
        <p className="nota-celda">
          ‰: de cada mil registros de mamíferos del parque en GBIF (todo el año), cuántos son de la especie. Mide lo que
          se registra, que depende de quién va y qué apunta: no es la probabilidad de verla. De cada parque se guardan
          sus 12 mamíferos más registrados: una especie más escasa puede estar aunque no salga. Los parques sin la
          especie o fuera de temporada, solo con el contorno. Mapa: OpenStreetMap.
        </p>
      </aside>
    </div>
  );
}

function FichaParque({
  id,
  f,
  mes,
  especie,
  alCerrar,
  alElegirEspecie,
}: {
  id: string;
  f: FichaParqueCarta | null | undefined;
  mes: number;
  especie: string | null;
  alCerrar: () => void;
  alElegirEspecie: (k: string) => void;
}) {
  if (f === undefined)
    return (
      <section className="ficha-celda">
        <p className="ficha-celda-cargando">Cargando el parque…</p>
      </section>
    );
  if (f === null)
    return (
      <section className="ficha-celda">
        <p>No se encontró el parque «{id}».</p>
        <button type="button" className="boton-texto" onClick={alCerrar}>
          Cerrar
        </button>
      </section>
    );
  const elegida = especie ? f.mamiferos.find(([k]) => k === especie) : undefined;
  const maxLluvia = Math.max(1, ...(f.lluvia ?? [0]));
  const maxObs = Math.max(1, ...f.meses);
  return (
    <section className="ficha-celda" aria-labelledby="titulo-parque">
      <header className="ficha-celda-cabecera">
        <div>
          <h2 id="titulo-parque">{f.nombre}</h2>
          <p className="ficha-celda-sub">
            {f.clase}
            {f.pais ? ` · ${f.pais}` : ""}
          </p>
        </div>
        <button type="button" className="boton-cerrar" onClick={alCerrar} aria-label="Cerrar la ficha del parque">
          ×
        </button>
      </header>
      {f.foto && (
        <figure className="foto-parque-carta">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.foto.url} alt={`Paisaje o fauna de ${f.nombre}`} loading="lazy" width={960} height={640} />
          <figcaption>
            {f.foto.web ? (
              <a href={f.foto.web} target="_blank" rel="noopener">
                {f.foto.autor ?? "Wikimedia Commons"}
              </a>
            ) : (
              (f.foto.autor ?? "")
            )}
            {f.foto.licencia ? ` · ${f.foto.licencia}` : ""}
          </figcaption>
        </figure>
      )}
      {especie && (
        <p className="ficha-celda-elegida">
          {elegida ? (
            <>
              <b>{elegida[1]}</b>: <span className="cifra">{elegida[3]} ‰</span> de los registros de mamíferos (
              <span className="cifra">{elegida[2].toLocaleString("es-ES")}</span> de{" "}
              <span className="cifra">{f.muestra.toLocaleString("es-ES")}</span>,{" "}
              {TEXTO_FIABILIDAD[fiabilidad(f.muestra)]}).
            </>
          ) : (
            <>La especie elegida no está entre los mamíferos más registrados aquí.</>
          )}
        </p>
      )}
      <table className="tabla-celda" data-fiabilidad={fiabilidad(f.muestra)}>
        <caption>
          Mamíferos más registrados · <span className="cifra">{f.muestra.toLocaleString("es-ES")}</span> registros ·{" "}
          {TEXTO_FIABILIDAD[fiabilidad(f.muestra)]}
        </caption>
        <thead>
          <tr>
            <th scope="col">Especie</th>
            <th scope="col" className="num">
              ‰
            </th>
          </tr>
        </thead>
        <tbody>
          {f.mamiferos.map(([k, n, , v]) => (
            <tr key={k}>
              <th scope="row">
                <button type="button" className="enlace-especie" onClick={() => alElegirEspecie(k)}>
                  {n}
                </button>
              </th>
              <td className="num cifra">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <figure className="meses-parque">
        <figcaption className="franja-titulo">Temporada y lluvia</figcaption>
        <div className="meses-parque-barras" aria-hidden="true">
          {MESES.map((m, i) => (
            <span
              key={m}
              className={`${f.epoca.includes(i + 1) ? "en-temporada" : ""}${i === mes ? " mes-actual" : ""}`}
            >
              <i style={{ height: `${Math.round(((f.lluvia?.[i] ?? 0) / maxLluvia) * 100)}%` }} />
              <b style={{ height: `${Math.round((f.meses[i] / maxObs) * 100)}%` }} />
              <em>{INICIALES[i]}</em>
            </span>
          ))}
        </div>
        <p className="franja-nota">
          {f.epoca.length
            ? `Temporada (${f.motivo ?? "seca"}), marcada en tinta: ${f.epoca.map((x) => MESES[x - 1].slice(0, 3)).join(", ")}. `
            : ""}
          Azul: lluvia media por mes{f.lluvia ? ` (máx. ${maxLluvia} mm, NASA POWER)` : ""}. Magenta: registros de
          mamíferos por mes (GBIF), que dicen cuándo va la gente, no cuándo hay más fauna.
        </p>
      </figure>

      {f.aeropuerto && (
        <p>
          Aeropuerto más cercano: <b>{f.aeropuerto.nombre}</b> ({f.aeropuerto.iata}), a{" "}
          <span className="cifra">{f.aeropuerto.km}</span> km
          {f.aeropuerto.internacional ? ", internacional" : ""}.
        </p>
      )}
      <nav className="ficha-celda-acciones" aria-label="Más sobre el parque">
        <Link href={`/parque/${f.id}?mes=${MESES[mes]}`}>Ficha completa: cómo llegar, alojamientos y operadores</Link>
      </nav>
    </section>
  );
}

/** Lleva un punto al centro de la parte del mapa que se ve (en el móvil, encima de la hoja subida). */
function centrarVisible(m: LMap, lat: number, lon: number, zoom: number, animar = true) {
  const p = document.querySelector<HTMLElement>(".carta-panel");
  const fijo = p && getComputedStyle(p).position === "fixed";
  const hoja = fijo ? Math.max(p.offsetHeight, window.innerHeight * 0.64 - 58) : 0;
  const punto = m.project([lat, lon], zoom).add([0, hoja / 2]);
  m.setView(m.unproject(punto, zoom), zoom, { animate: animar });
}
