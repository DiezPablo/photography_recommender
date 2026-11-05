"use client";
// Mapa de la migración: la zona típica de cada mes (la elegida, destacada; el recorrido del año, en línea) y los
// ñus observados en los últimos 30 días en iNaturalist, en directo desde el navegador.
import type { LayerGroup } from "leaflet";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { distanciaKm, MESES } from "@/lib/fechas";
import { CRATER, MIGRACION } from "@/features/safaris/migracion";
import { colorCss, escaparHtml as esc, useMapaBase } from "@/ui/mapa/useMapaBase";

interface Visto {
  id: number;
  fecha: string;
  lat: number;
  lon: number;
  lugar: string | null;
  crater: boolean;
}

const DIAS = 30;
// Serengeti, Ngorongoro, Masái Mara y alrededores
const CAJA = { swlat: -3.9, swlng: 33.5, nelat: -0.8, nelng: 36.3 };

function hace(dias: number): string {
  return new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
}

export default function Migracion({ mesHoy }: { mesHoy: number }) {
  const [mes, setMes] = useState(mesHoy + 1);
  const [vistos, setVistos] = useState<Visto[] | null>(null);
  const [error, setError] = useState(false);
  const { caja, mapa, leaflet, listo, tema, nuevaCapa } = useMapaBase({ scrollWheelZoom: false });
  const capa = useRef<LayerGroup | null>(null);

  useEffect(() => {
    const q = new URLSearchParams({
      taxon_name: "Connochaetes taurinus",
      ...Object.fromEntries(Object.entries(CAJA).map(([k, v]) => [k, String(v)])),
      d1: hace(DIAS),
      per_page: "200",
      order_by: "observed_on",
      geo: "true",
    });
    fetch(`https://api.inaturalist.org/v1/observations?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (d: {
          results: {
            id: number;
            observed_on: string;
            location: string | null;
            place_guess: string | null;
            obscured: boolean;
          }[];
        }) =>
          setVistos(
            d.results
              .filter((o) => o.location && !o.obscured)
              .map((o) => {
                const [lat, lon] = o.location!.split(",").map(Number);
                return {
                  id: o.id,
                  fecha: o.observed_on,
                  lat,
                  lon,
                  lugar: o.place_guess,
                  crater: distanciaKm({ lat, lon }, CRATER) <= CRATER.radio_km,
                };
              }),
          ),
      )
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!listo || !mapa.current || !leaflet.current) return;
    const L = leaflet.current;
    capa.current ??= nuevaCapa();
    const g = capa.current;
    g.clearLayers();
    const color = colorCss("var(--c-fauna)");
    const gris = colorCss("var(--texto-3)");
    L.polyline(
      [...MIGRACION, MIGRACION[0]].map((z) => [z.lat, z.lon] as [number, number]),
      { color: gris, weight: 1.5, dashArray: "4 6" },
    ).addTo(g);
    for (const z of MIGRACION) {
      const actual = z.mes === mes;
      L.circle([z.lat, z.lon], {
        radius: z.radio_km * 1000,
        color: actual ? color : gris,
        weight: actual ? 2.5 : 0.8,
        fillColor: actual ? color : gris,
        fillOpacity: actual ? 0.22 : 0.04,
      })
        .bindPopup(`<strong>${esc(MESES[z.mes - 1])}: ${esc(z.zona)}</strong>`)
        .addTo(g);
    }
    const reciente = colorCss("var(--acento)");
    for (const v of vistos ?? []) {
      L.circleMarker([v.lat, v.lon], {
        radius: 5,
        weight: 1,
        color: colorCss("var(--superficie)"),
        fillColor: v.crater ? gris : reciente,
        fillOpacity: 1,
      })
        .bindPopup(
          `<strong>Ñu, ${esc(v.fecha)}</strong>${v.lugar ? `<br>${esc(v.lugar)}` : ""}${v.crater ? "<br>Residentes del cráter (no migran)" : ""}<br><a href="https://www.inaturalist.org/observations/${v.id}" target="_blank" rel="noopener">Ver en iNaturalist ↗</a>`,
        )
        .addTo(g);
    }
    mapa.current.fitBounds(
      L.latLngBounds([
        [CAJA.swlat + 0.2, CAJA.swlng + 0.4],
        [CAJA.nelat - 0.1, CAJA.nelng - 0.4],
      ]),
      { animate: false },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, mes, vistos, tema]);

  const z = MIGRACION[mes - 1];
  const migrantes = (vistos ?? []).filter((v) => !v.crater);
  // dónde se han visto más en el último mes: la zona del calendario más cercana a cada observación
  const porZona = new Map<string, number>();
  for (const v of migrantes) {
    const cercana = MIGRACION.reduce((a, b) => (distanciaKm(v, a) <= distanciaKm(v, b) ? a : b));
    porZona.set(cercana.zona, (porZona.get(cercana.zona) ?? 0) + 1);
  }
  const masVista = [...porZona.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="seccion migracion">
      <div className="meses-migracion" role="group" aria-label="Mes">
        {MESES.map((m, i) => (
          <button key={m} type="button" aria-pressed={mes === i + 1} onClick={() => setMes(i + 1)}>
            {m.slice(0, 3)}
            {MIGRACION[i].cruces && <span aria-label=" cruces de ríos"> ≈</span>}
            {MIGRACION[i].partos && <span aria-label=" partos"> ♥</span>}
          </button>
        ))}
      </div>
      <div className="tarjeta-mes">
        <p className="rotulo">
          {MESES[mes - 1]}
          {mes === mesHoy + 1 ? " · este mes" : ""}
        </p>
        <h2>{z.zona}</h2>
        <p>{z.que}</p>
        <p className="meta">
          Dónde alojarse: {z.base}. <Link href={`/parque/${z.parque}`}>Ver el parque →</Link>
        </p>
      </div>
      <div
        ref={caja}
        className="mapa-caja"
        role="region"
        aria-label="Mapa de la migración"
        data-listo={listo ? "si" : "no"}
      >
        {!listo && (
          <div className="mapa-vacio esqueleto">
            <span className="sr">Cargando mapa…</span>
          </div>
        )}
      </div>
      <p className="nota-pie leyenda-migracion">
        <span className="pto zona" /> zona típica del mes · <span className="pto visto" /> ñus vistos en los últimos{" "}
        {DIAS} días (iNaturalist) · <span className="pto crater" /> residentes del cráter del Ngorongoro, que no migran
        · ≈ cruces de ríos · ♥ partos
      </p>
      <p className="visto-migracion" aria-live="polite">
        {error
          ? "No se han podido cargar las observaciones recientes de iNaturalist."
          : vistos === null
            ? "Cargando lo visto en el último mes…"
            : migrantes.length
              ? `En los últimos ${DIAS} días: ${migrantes.length} observaciones de ñus fuera del cráter${masVista ? `, la mayoría cerca de «${masVista[0]}»` : ""}. Son avistamientos sueltos de visitantes, no un censo: sirven para ver si este año va adelantado o retrasado.`
              : `Nadie ha subido ñus de la zona en los últimos ${DIAS} días.`}
      </p>
    </section>
  );
}
