"use client";
// La carta de España: un mapa topográfico (IGN) con la fauna sobreimpresa en magenta por cuadrícula de 10 km (‰ de
// su grupo en el mes, GBIF), rayado donde la muestra es pequeña, la dirección del sol del día elegido y los lugares
// con nombre. Al lado (o abajo, en el móvil), la especie, el mes, el día y la ficha de la cuadrícula que se toque.
// Todo el estado va en la URL: cada pregunta («dónde veo…», «qué hay aquí», «cuándo») se puede hacer sola.
import type { LayerGroup, LeafletMouseEvent, Map as LMap } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParametrosUrl } from "@/lib/almacen";
import { MESES, INICIALES } from "@/lib/fechas";
import { celda as celdaDe, centroCelda } from "@/lib/rejilla";
import { direccionesSol, horaLocal, horaSol } from "@/lib/sol";
import { escaparHtml as esc, useMapaBase } from "@/ui/mapa/useMapaBase";
import SelectorEspecie, { type OpcionEspecie } from "@/ui/SelectorEspecie";
import type { EspecieDelMes } from "@/features/espana/datos";
import {
  CAPAS,
  leerEstado,
  parametros,
  fiabilidad,
  TEXTO_FIABILIDAD,
  type Capa,
  type EstadoCarta,
} from "@/features/carta/estado";
import { destino, esquinas } from "@/features/carta/geometria";
import FichaCelda, { GRUPO } from "@/features/carta/FichaCelda";

interface EspecieLista {
  k: string;
  n: string | null;
  c: string | null;
  clase: string | null;
  celdas: number;
}

type CeldaEspecie = [string, number, number, number, number];

/** Tramos de ‰ de la leyenda (los mismos del resto de la web: 50, 20, 5, 1) y su opacidad sobre el mapa. */
const TRAMOS: [number, number, string][] = [
  [50, 0.82, "50 ‰ o más"],
  [20, 0.6, "20-49 ‰"],
  [5, 0.42, "5-19 ‰"],
  [1, 0.26, "1-4 ‰"],
  [0, 0.14, "menos de 1 ‰"],
];
const tramo = (v: number) => TRAMOS.findIndex(([d]) => v >= d);

const CAPA_TEXTO: Record<Capa, string> = {
  fauna: "Fauna (‰ de su grupo)",
  fiabilidad: "Rayado: menos de 100 registros",
  luz: "Sol del día",
  lugares: "Lugares con nombre",
};

const GRUPO_PLURAL: Record<string, string> = {
  Aves: "Aves",
  Mammalia: "Mamíferos",
  Reptilia: "Reptiles",
  Amphibia: "Anfibios",
};

export default function CartaEspana({ hoy, delMes }: { hoy: string; delMes: EspecieDelMes[][] }) {
  const [q, actualizar] = useParametrosUrl();
  const estado = useMemo(() => leerEstado(q, hoy), [q, hoy]);
  const cambiar = (c: Partial<EstadoCarta>) => actualizar(parametros({ ...estado, ...c }, hoy));
  const encendida = (c: Capa) => !estado.apagadas.includes(c);
  const { caja, mapa, leaflet, listo, vista, nuevaCapa } = useMapaBase({ scrollWheelZoom: true, minZoom: 4 }, "ign");

  const [lista, setLista] = useState<EspecieLista[]>([]);
  const [hojaAlta, setHojaAlta] = useState(false);
  const [datosEspecie, setDatosEspecie] = useState<{
    clave: string;
    celdas: CeldaEspecie[];
    curva: (number | null)[];
  }>();

  useEffect(() => {
    fetch("/espana/especies.json")
      .then((r) => (r.ok ? r.json() : { especies: [] }))
      .then((d: { especies: EspecieLista[] }) => setLista(d.especies))
      .catch(() => setLista([]));
  }, []);

  const claveDatos = estado.especie ? `${estado.especie}|${estado.mes}` : "";
  useEffect(() => {
    if (!estado.especie) return;
    let vivo = true;
    fetch(`/espana/especie-datos/${estado.especie}?celdas=1&mes=${estado.mes}`)
      .then((r) => (r.ok ? r.json() : { celdas: [], curva: [] }))
      .then(
        (d: { celdas: CeldaEspecie[]; curva?: (number | null)[] }) =>
          vivo && setDatosEspecie({ clave: claveDatos, celdas: d.celdas, curva: d.curva ?? [] }),
      )
      .catch(() => vivo && setDatosEspecie({ clave: claveDatos, celdas: [], curva: [] }));
    return () => {
      vivo = false;
    };
  }, [estado.especie, estado.mes, claveDatos]);
  const celdas = useMemo(
    () => (estado.especie && datosEspecie?.clave === claveDatos ? datosEspecie.celdas : []),
    [estado.especie, datosEspecie, claveDatos],
  );
  const curva = estado.especie && datosEspecie?.clave === claveDatos ? datosEspecie.curva : [];
  const elegida = lista.find((e) => e.k === estado.especie);

  // encuadre inicial: el de la URL, la cuadrícula elegida o la península
  const centrado = useRef(false);
  useEffect(() => {
    if (!listo || !mapa.current || centrado.current) return;
    centrado.current = true;
    const m = mapa.current;
    if (estado.centro) m.setView(estado.centro, estado.zoom ?? 9, { animate: false });
    else if (estado.celda) centrarVisible(m, estado.celda, 10, false);
    else
      m.fitBounds(
        [
          [36, -9.4],
          [43.8, 3.3],
        ],
        { animate: false, paddingBottomRight: [0, alturaHoja()] },
      );
    // al moverse, el encuadre a la URL (para compartir lo que se ve)
    m.on("moveend", () => {
      const c = m.getCenter();
      actualizar({ c: `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`, z: String(m.getZoom()) });
    });
    // tocar el mapa elige la cuadrícula de 10 km del punto
    m.on("click", (ev: LeafletMouseEvent) => {
      const codigo = celdaDe(ev.latlng.lat, ev.latlng.lng);
      actualizar({ celda: codigo });
      setHojaAlta(true);
      centrarVisible(m, codigo, m.getZoom());
    });
    // solo al montar el mapa: después, el encuadre lo lleva quien lo mueve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo]);

  // capa de fauna y de fiabilidad (rayado SVG con el patrón de la página)
  const capaFauna = useRef<LayerGroup | null>(null);
  const capaRayado = useRef<LayerGroup | null>(null);
  useEffect(() => {
    if (!listo || !leaflet.current) return;
    const L = leaflet.current;
    capaFauna.current ??= nuevaCapa();
    capaRayado.current ??= nuevaCapa();
    capaFauna.current.clearLayers();
    capaRayado.current.clearLayers();
    if (encendida("fauna"))
      for (const [codigo, , , v] of celdas)
        L.polygon(esquinas(codigo), {
          stroke: false,
          fillOpacity: TRAMOS[tramo(v)][1],
          className: "celda-fauna",
          interactive: false,
        }).addTo(capaFauna.current);
    if (encendida("fiabilidad") && encendida("fauna"))
      for (const [codigo, , , , muestra] of celdas)
        if (muestra < 100)
          L.polygon(esquinas(codigo), {
            stroke: false,
            fillOpacity: 1,
            className: "celda-rayada",
            interactive: false,
          }).addTo(capaRayado.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, leaflet, nuevaCapa, celdas, estado.apagadas.join()]);

  // cuadrícula elegida y luz del día desde su centro (o desde el centro del mapa)
  const capaElegida = useRef<LayerGroup | null>(null);
  useEffect(() => {
    if (!listo || !leaflet.current || !mapa.current) return;
    const L = leaflet.current;
    const m = mapa.current;
    capaElegida.current ??= nuevaCapa();
    const g = capaElegida.current;
    g.clearLayers();
    if (estado.celda)
      L.polygon(esquinas(estado.celda), {
        className: "celda-elegida",
        fill: false,
        weight: 3,
        interactive: false,
      }).addTo(g);
    if (!encendida("luz")) return;
    const [lat, lon] = estado.celda ? centroCelda(estado.celda) : [m.getCenter().lat, m.getCenter().lng];
    if (!estado.celda && m.getZoom() < 8) return;
    const sol = direccionesSol(estado.fecha, lat, lon);
    // 130 px en pantalla, sea cual sea el zoom
    const km = (130 * 40075 * Math.cos((lat * Math.PI) / 180)) / 2 ** (m.getZoom() + 8);
    const rayos: [number | null, string, boolean][] = [
      [sol.sale, `sale ${hora(estado.fecha, lat, lon, true)}`, true],
      [sol.pone, `se pone ${hora(estado.fecha, lat, lon, false)}`, true],
      [sol.doradaManana, "", false],
      [sol.doradaTarde, "", false],
    ];
    for (const [az, texto, principal] of rayos) {
      if (az === null) continue;
      const fin = destino(lat, lon, az, principal ? km : km * 0.8);
      L.polyline([[lat, lon], fin], {
        className: principal ? "rayo-sol" : "rayo-dorada",
        weight: principal ? 2.5 : 1.5,
        interactive: false,
      }).addTo(g);
      if (texto)
        L.marker(fin, {
          interactive: false,
          icon: L.divIcon({
            className: `rotulo-sol ${az < 180 ? "este" : "oeste"}`,
            html: `<span>${esc(texto)} · ${az}°</span>`,
            iconSize: [0, 0],
          }),
        }).addTo(g);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, leaflet, nuevaCapa, estado.celda, estado.fecha, estado.apagadas.join(), vista]);

  // lugares con nombre en el encuadre (a partir de zoom 8, para no tapar la fauna)
  const capaLugares = useRef<LayerGroup | null>(null);
  useEffect(() => {
    if (!listo || !mapa.current || !leaflet.current) return;
    const L = leaflet.current;
    const m = mapa.current;
    capaLugares.current ??= nuevaCapa();
    const g = capaLugares.current;
    // de cerca, la fauna se aclara para que se lea el topográfico de debajo
    m.getContainer().toggleAttribute("data-cerca", m.getZoom() >= 10);
    if (!encendida("lugares") || m.getZoom() < 8) {
      g.clearLayers();
      return;
    }
    const b = m.getBounds();
    let vivo = true;
    const t = setTimeout(() => {
      fetch(
        `/espana/lugares-mapa?s=${b.getSouth()}&w=${b.getWest()}&n=${b.getNorth()}&e=${b.getEast()}&z=${m.getZoom()}`,
      )
        .then((r) => (r.ok ? r.json() : { lugares: [] }))
        .then((d: { lugares: [string, string, string, number, number][] }) => {
          if (!vivo) return;
          g.clearLayers();
          for (const [id, n, tipo, lat, lon] of d.lugares)
            L.circleMarker([lat, lon], {
              radius: id.startsWith("eb-") ? 3 : 5,
              weight: 1.5,
              bubblingMouseEvents: false,
              className: id.startsWith("eb-") ? "lugar-ebird" : "lugar-espacio",
            })
              .bindPopup(
                `<strong>${esc(n)}</strong><br>${esc(tipo)}<br><a href="/espana/lugar/${encodeURIComponent(id)}">Ficha del lugar</a>`,
              )
              .addTo(g);
        })
        .catch(() => {});
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, vista, estado.apagadas.join()]);

  const opcionesEspecie = useMemo<OpcionEspecie<string>[]>(
    () =>
      lista.map((e) => ({
        clave: e.k,
        nombre: e.n ?? e.c ?? e.k,
        cientifico: e.c ?? "",
        grupo: GRUPO_PLURAL[e.clase ?? ""] ?? "Otros",
        detalle: `${e.celdas} cuadrículas`,
      })),
    [lista],
  );
  const elegirEspecie = (k: string | null) => {
    cambiar({ especie: k });
  };
  const alternar = (c: Capa) =>
    cambiar({ apagadas: encendida(c) ? [...estado.apagadas, c] : estado.apagadas.filter((x) => x !== c) });
  const irA = (codigo: string) => {
    cambiar({ celda: codigo });
    setHojaAlta(true);
    if (mapa.current) centrarVisible(mapa.current, codigo, mapa.current.getZoom());
  };

  const porTramo = TRAMOS.map((_, i) => celdas.filter(([, , , v]) => tramo(v) === i).length);
  const mejores = celdas
    .filter(([, , , , n]) => n >= 100)
    .sort((a, b) => b[3] - a[3])
    .slice(0, 6);
  const maxCurva = Math.max(1, ...curva.map((v) => v ?? 0));
  const sube = delMes[estado.mes] ?? [];

  return (
    <div className="carta" data-hoja={hojaAlta ? "alta" : "baja"}>
      <svg width="0" height="0" className="sr" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="carta-rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--carta-papel)" fillOpacity="0.35" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--carta-tinta)" strokeWidth="1.3" strokeOpacity="0.6" />
          </pattern>
        </defs>
      </svg>
      <div
        ref={caja}
        className="carta-mapa"
        role="region"
        aria-label="Mapa de fauna de España por cuadrícula de 10 km"
        data-listo={listo ? "si" : "no"}
      />
      <aside className="carta-panel" aria-label="Especie, mes, día y cuadrícula">
        <button type="button" className="carta-asa" aria-expanded={hojaAlta} onClick={() => setHojaAlta(!hojaAlta)}>
          <span className="sr">{hojaAlta ? "Bajar el panel" : "Subir el panel"}</span>
        </button>
        <h1 className="carta-titulo">
          {elegida ? (elegida.n ?? elegida.c) : "Fauna de España"}
          <span className="carta-titulo-mes"> en {MESES[estado.mes]}</span>
        </h1>

        <div className="carta-campo carta-buscador">
          <SelectorEspecie<string>
            etiqueta="Especie"
            vacio="Grulla, nutria, lagarto ocelado…"
            opciones={opcionesEspecie}
            valor={estado.especie}
            onCambio={(k) => elegirEspecie(k)}
            limite={60}
          />
          {elegida && (
            <p className="carta-elegida">
              <i>{elegida.c}</i> · {GRUPO[elegida.clase ?? ""] ?? elegida.clase} · {elegida.celdas} cuadrículas con
              registros
            </p>
          )}
        </div>

        <fieldset className="carta-meses">
          <legend>
            Mes{curva.length ? <span className="leyenda-curva"> · barras: ‰ en España cada mes</span> : null}
          </legend>
          {MESES.map((m, i) => (
            <button
              key={m}
              type="button"
              aria-pressed={estado.mes === i}
              aria-label={m}
              onClick={() => cambiar({ mes: i })}
            >
              {curva.length > 0 && (
                <span className="barra-mes" style={{ height: `${Math.round(((curva[i] ?? 0) / maxCurva) * 100)}%` }} />
              )}
              <span className="inicial-mes">{INICIALES[i]}</span>
            </button>
          ))}
        </fieldset>

        <div className="carta-campo carta-fecha">
          <label htmlFor="carta-fecha">Día para la luz y el tiempo</label>
          <input
            id="carta-fecha"
            type="date"
            value={estado.fecha}
            onChange={(e) =>
              e.target.value &&
              cambiar({
                fecha: e.target.value,
                mes: Number(e.target.value.slice(5, 7)) - 1,
              })
            }
          />
        </div>

        {estado.celda ? (
          <FichaCelda
            key={estado.celda}
            codigo={estado.celda}
            mes={estado.mes}
            fecha={estado.fecha}
            especie={estado.especie}
            alCerrar={() => cambiar({ celda: null })}
            alElegirEspecie={(k) => elegirEspecie(k)}
          />
        ) : elegida ? (
          <section className="carta-resumen" aria-label="Dónde se registra más">
            {celdas.length === 0 ? (
              <p>Sin registros en {MESES[estado.mes]}. Mira en las barras de los meses cuándo aparece.</p>
            ) : (
              <>
                <table className="tabla-tramos">
                  <caption>
                    {celdas.length.toLocaleString("es-ES")} cuadrículas con registros en {MESES[estado.mes]}
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
                    <h2 className="carta-h2">Las más altas con 100 registros o más detrás</h2>
                    <ol className="lista-mejores">
                      {mejores.map(([codigo, , , v, n]) => (
                        <li key={codigo}>
                          <button type="button" onClick={() => irA(codigo)}>
                            <span className="cifra">{v} ‰</span>
                            <span className="cifra muestra">{n.toLocaleString("es-ES")} reg.</span>
                            <span className="cod">{codigo.replace("10km", "")}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
                <p className="nota-celda">Toca una cuadrícula para ver su ficha, la luz y el tiempo.</p>
              </>
            )}
          </section>
        ) : (
          <section className="carta-resumen" aria-label={`Lo que sube en ${MESES[estado.mes]}`}>
            <h2 className="carta-h2">Lo que más sube en {MESES[estado.mes]}</h2>
            <ol className="lista-sube">
              {sube.map((e) => (
                <li key={e.k}>
                  <button type="button" onClick={() => elegirEspecie(e.k)}>
                    <b>{e.n ?? e.c}</b>
                    <span className="cifra">
                      {e.mes} ‰ frente a {e.media.toLocaleString("es-ES")} de media
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="nota-celda">
              Especies en 150 cuadrículas o más cuyo ‰ en España ese mes es al menos 1,5 veces su media del año (GBIF).
              Elige una para verla en el mapa, o toca el mapa para ver qué hay en esa cuadrícula.
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
          Cuadrícula de 10 km de la Agencia Europea de Medio Ambiente. ‰: de cada mil registros de su grupo en GBIF en
          esa cuadrícula, ese mes y los vecinos, cuántos son de la especie: mide lo que se registra, no la probabilidad
          de verla. Mapa: IGN y OpenStreetMap.
        </p>
      </aside>
      {estado.celda && (
        <p className="sr" aria-live="polite">
          Cuadrícula {estado.celda} elegida ({fiabilidadTexto(celdas, estado.celda)})
        </p>
      )}
    </div>
  );
}

/** Alto del mapa que tapa la hoja del panel en el móvil (0 en escritorio, con el panel al lado). */
function alturaHoja(): number {
  const p = document.querySelector<HTMLElement>(".carta-panel");
  return p && getComputedStyle(p).position === "fixed" ? p.offsetHeight : 0;
}

/** Lleva una cuadrícula al centro de la parte del mapa que se ve: en el móvil, encima de la hoja subida (64 % de la
 * pantalla, que es como queda al elegirla). */
function centrarVisible(m: LMap, codigo: string, zoom: number, animar = true) {
  const hoja = alturaHoja() ? Math.max(alturaHoja(), window.innerHeight * 0.64 - 58) : 0;
  const z = Math.max(zoom, 9);
  const punto = m.project(centroCelda(codigo), z).add([0, hoja / 2]);
  m.setView(m.unproject(punto, z), z, { animate: animar });
}

function hora(fecha: string, lat: number, lon: number, manana: boolean): string {
  const d = horaSol(fecha, lat, lon, -0.833, manana);
  return d ? horaLocal(d, lon) : "";
}

function fiabilidadTexto(celdas: CeldaEspecie[], codigo: string): string {
  const c = celdas.find(([x]) => x === codigo);
  return c ? `${c[3]} ‰, ${TEXTO_FIABILIDAD[fiabilidad(c[4])]}` : "sin dato de la especie";
}
