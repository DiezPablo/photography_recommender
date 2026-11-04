"use client";
// Explorador en mapa: capas de lugares (espacios protegidos, observatorios, puntos de eBird), hides y salidas,
// fenómenos del mes y, si eliges una especie, sus cuadrículas de 10 km coloreadas por su frecuencia ese mes.
import type { LayerGroup } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { colorCss, escaparHtml as esc, useMapaBase } from "@/ui/mapa/useMapaBase";
import { useParametrosUrl } from "@/lib/almacen";
import { MESES } from "@/lib/fechas";
import { laeaInversa } from "@/lib/rejilla";
import { HIDES } from "@/features/espana/hides";
import { FENOMENOS } from "@/features/espana/fenomenos";
import { useUbicacionGuardada } from "@/features/espana/ubicacion";

interface EspecieLista {
  k: string;
  n: string | null;
  c: string | null;
}

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** ‰ → color (de pálido a intenso), como los niveles de frecuencia. */
function colorFrecuencia(v: number): string {
  if (v >= 50) return "#1f5e3a";
  if (v >= 20) return "#3f8a55";
  if (v >= 5) return "#7fb877";
  if (v >= 1) return "#c4e0b4";
  return "#eef5e6";
}

/** Las cuatro esquinas de una cuadrícula EEA de 10 km en grados. */
function esquinas(codigo: string): [number, number][] {
  const m = codigo.match(/E(\d+)N(\d+)$/);
  if (!m) return [];
  const e = Number(m[1]) * 10000;
  const n = Number(m[2]) * 10000;
  return [laeaInversa(e, n), laeaInversa(e + 10000, n), laeaInversa(e + 10000, n + 10000), laeaInversa(e, n + 10000)];
}

export default function MapaExplorador({ hoy }: { hoy: string }) {
  const [p, actualizar] = useParametrosUrl();
  const guardada = useUbicacionGuardada();
  const mes = p.has("mes") ? Number(p.get("mes")) : Number(hoy.slice(5, 7)) - 1;
  const clave = p.get("k");
  const capas = new Set((p.get("capas") ?? "lugares,hides,fenomenos").split(",").filter(Boolean));
  const { caja, mapa, leaflet, listo, tema, vista, nuevaCapa } = useMapaBase({ scrollWheelZoom: true });
  const capaLugares = useRef<LayerGroup | null>(null);
  const capaHides = useRef<LayerGroup | null>(null);
  const capaCalor = useRef<LayerGroup | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [lista, setLista] = useState<EspecieLista[]>([]);
  const [calor, setCalor] = useState<{ clave: string; celdas: [string, number, number, number][] }>();
  const [nLugares, setNLugares] = useState<{ n: number; recortado: boolean } | null>(null);

  // encuadre inicial: tu última ubicación o la península
  const centrado = useRef(false);
  useEffect(() => {
    if (!listo || !mapa.current || centrado.current) return;
    centrado.current = true;
    if (guardada) mapa.current.setView([guardada.lat, guardada.lon], 10, { animate: false });
    else mapa.current.setView([40.2, -3.7], 6, { animate: false });
  }, [listo, mapa, guardada]);

  useEffect(() => {
    fetch("/espana/especies.json")
      .then((r) => (r.ok ? r.json() : { especies: [] }))
      .then((d: { especies: EspecieLista[] }) => setLista(d.especies))
      .catch(() => setLista([]));
  }, []);

  const claveCalor = clave ? `${clave}|${mes}` : "";
  useEffect(() => {
    if (!clave) return;
    let vivo = true;
    fetch(`/espana/especie-datos/${clave}?celdas=1&mes=${mes}`)
      .then((r) => (r.ok ? r.json() : { celdas: [] }))
      .then(
        (d: { celdas: [string, number, number, number][] }) =>
          vivo && setCalor({ clave: claveCalor, celdas: d.celdas }),
      )
      .catch(() => vivo && setCalor({ clave: claveCalor, celdas: [] }));
    return () => {
      vivo = false;
    };
  }, [clave, mes, claveCalor]);
  const celdas = clave && calor?.clave === claveCalor ? calor.celdas : [];

  // mapa de calor de la especie
  useEffect(() => {
    if (!listo || !leaflet.current) return;
    const L = leaflet.current;
    capaCalor.current ??= nuevaCapa();
    const g = capaCalor.current;
    g.clearLayers();
    for (const [codigo, , , v] of celdas)
      L.polygon(esquinas(codigo), { stroke: false, fillColor: colorFrecuencia(v), fillOpacity: 0.65 })
        .bindTooltip(`${v} ‰ de su grupo en ${MESES[mes]}`)
        .addTo(g);
  }, [listo, leaflet, nuevaCapa, celdas, mes, tema]);

  // hides y fenómenos (datos de la propia web)
  useEffect(() => {
    if (!listo || !leaflet.current) return;
    const L = leaflet.current;
    capaHides.current ??= nuevaCapa();
    const g = capaHides.current;
    g.clearLayers();
    if (capas.has("hides"))
      for (const h of HIDES)
        L.circleMarker([h.lat, h.lon], {
          radius: 7,
          weight: 2,
          color: colorCss("var(--superficie)"),
          fillColor: h.clase === "hide" ? "#8a4b2a" : "#2a5c8a",
          fillOpacity: 1,
        })
          .bindPopup(
            `<strong>${esc(h.nombre)}</strong><br>${esc(h.operador)} · ${esc(h.zona)}<br><a href="${esc(h.web)}" target="_blank" rel="noopener">Web ↗</a>`,
          )
          .addTo(g);
    if (capas.has("fenomenos"))
      for (const f of FENOMENOS.filter((x) => x.meses.includes(mes + 1)))
        L.circle([f.lat, f.lon], { radius: f.radioKm * 1000, color: "#c27b12", weight: 2, fillOpacity: 0.08 })
          .bindPopup(`<strong>${esc(f.titulo)}</strong><br>${esc(f.descripcion.split(".")[0])}.`)
          .addTo(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, leaflet, nuevaCapa, p.get("capas"), mes, tema]);

  // lugares en el encuadre, al moverse
  useEffect(() => {
    if (!listo || !mapa.current || !leaflet.current) return;
    const L = leaflet.current;
    capaLugares.current ??= nuevaCapa();
    const g = capaLugares.current;
    if (!capas.has("lugares")) {
      g.clearLayers();
      return;
    }
    const b = mapa.current.getBounds();
    const z = mapa.current.getZoom();
    let vivo = true;
    const t = setTimeout(() => {
      fetch(`/espana/lugares-mapa?s=${b.getSouth()}&w=${b.getWest()}&n=${b.getNorth()}&e=${b.getEast()}&z=${z}`)
        .then((r) => (r.ok ? r.json() : { lugares: [], recortado: false }))
        .then((d: { lugares: [string, string, string, number, number][]; recortado: boolean }) => {
          if (!vivo) return;
          g.clearLayers();
          setNLugares({ n: d.lugares.length, recortado: d.recortado });
          for (const [id, n, t2, lat, lon] of d.lugares)
            L.circleMarker([lat, lon], {
              radius: id.startsWith("eb-") ? 4 : 6,
              weight: 1,
              color: colorCss("var(--superficie)"),
              fillColor: id.startsWith("eb-") ? "#6a7d8f" : id.startsWith("osm-") ? "#2c7a4b" : "#2f4b36",
              fillOpacity: 0.9,
            })
              .bindPopup(
                `<strong>${esc(n)}</strong><br>${esc(t2)}<br><a href="/espana/lugar/${encodeURIComponent(id)}">Ficha →</a> · <a href="/espana?modo=aqui&lat=${lat}&lon=${lon}&radio=5&lugar=${encodeURIComponent(n)}">Qué veo aquí →</a>`,
              )
              .addTo(g);
        })
        .catch(() => {});
    }, 300);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, vista, p.get("capas"), tema]);

  const alternarCapa = (c: string) => {
    const s = new Set(capas);
    if (s.has(c)) s.delete(c);
    else s.add(c);
    actualizar({ capas: [...s].join(",") || "ninguna" });
  };
  const q = sinTildes(busqueda.trim());
  const opciones = q ? lista.filter((e) => sinTildes(`${e.n ?? ""} ${e.c ?? ""}`).includes(q)).slice(0, 10) : [];
  const elegida = lista.find((e) => e.k === clave);

  return (
    <>
      <section className="seccion formulario-plan">
        <div className="campo buscador-especie">
          <label className="rotulo" htmlFor="especie-mapa">
            Especie (mapa de calor)
          </label>
          <input
            id="especie-mapa"
            type="search"
            placeholder={elegida ? (elegida.n ?? elegida.c ?? "") : "Grulla, avutarda, ciervo…"}
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
                    <b>{e.n ?? e.c}</b> <i>{e.c}</i>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {clave && (
            <button type="button" className="quitar" onClick={() => actualizar({ k: null })}>
              Quitar especie
            </button>
          )}
        </div>
        <label className="campo">
          <span className="rotulo">Mes</span>
          <select value={mes} onChange={(e) => actualizar({ mes: e.target.value })}>
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="campo capas-mapa">
          <legend className="rotulo">Capas</legend>
          {[
            ["lugares", "Lugares"],
            ["hides", "Hides y salidas"],
            ["fenomenos", "Fenómenos del mes"],
          ].map(([c, t]) => (
            <label key={c}>
              <input type="checkbox" checked={capas.has(c)} onChange={() => alternarCapa(c)} /> {t}
            </label>
          ))}
        </fieldset>
      </section>
      <div
        ref={caja}
        className="mapa-caja mapa-explorador"
        role="region"
        aria-label="Explorador de fauna"
        data-listo={listo ? "si" : "no"}
      >
        {!listo && <div className="mapa-vacio">Cargando mapa…</div>}
      </div>
      <p className="nota-pie">
        {clave && elegida
          ? `${elegida.n ?? elegida.c} en ${MESES[mes]}: ${celdas.length} cuadrículas de 10 km (más oscuro, más frecuente en su grupo). `
          : ""}
        {nLugares
          ? `${nLugares.n} lugares en el encuadre${nLugares.recortado ? " (acerca el mapa para ver todos)" : ""}. `
          : ""}
        Verde oscuro: espacios protegidos; verde: observatorios; gris: puntos de eBird; marrón: hides; azul: salidas
        guiadas; naranja: fenómenos del mes.
      </p>
    </>
  );
}
