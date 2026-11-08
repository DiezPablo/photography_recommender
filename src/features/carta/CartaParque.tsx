"use client";
// La carta de un parque (rediseño B): su zona, las zonas del parque con la recomendada del mes en magenta (dónde
// está la migración, migracion.ts), los alojamientos de OSM y los aeropuertos más cercanos, con el mismo sistema
// que las cartas de España y del mundo. Al lado (debajo, en el móvil), la leyenda como tabla. El mes es el de la
// web (cabecera o ?mes=).
import type { LayerGroup } from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";
import { escaparHtml as esc, useMapaBase } from "@/ui/mapa/useMapaBase";

export interface ZonaCarta {
  nombre: string;
  nota: string;
  lat: number;
  lon: number;
}
export interface LugarCarta {
  nombre: string;
  tipo: string;
  lat: number;
  lon: number;
  href: string | null;
}
export interface AeropuertoCarta {
  nombre: string;
  iata: string;
  km: number;
  internacional: boolean;
  lat?: number;
  lon?: number;
}

export default function CartaParque({
  id,
  nombre,
  lat,
  lon,
  radioKm,
  zonas,
  recomendadas,
  alojamientos,
  aeropuertos,
  mesHoy,
}: {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  radioKm: number;
  zonas: ZonaCarta[];
  /** zona recomendada cada mes (0-11), por nombre */
  recomendadas: (string | null)[];
  alojamientos: LugarCarta[];
  aeropuertos: AeropuertoCarta[];
  mesHoy: number;
}) {
  const [mes] = useMesElegido(mesHoy);
  const recomendada = recomendadas[mes] ?? null;
  const { caja, mapa, leaflet, listo, nuevaCapa } = useMapaBase({ scrollWheelZoom: false });
  const capa = useRef<LayerGroup | null>(null);
  const cercanos = useMemo(
    () => aeropuertos.filter((a) => a.lat !== undefined && a.lon !== undefined).slice(0, 3),
    [aeropuertos],
  );
  // el encuadre, solo la primera vez: al cambiar de mes no se mueve lo que el usuario haya movido
  const encuadrado = useRef(false);

  useEffect(() => {
    if (!listo || !leaflet.current || !mapa.current) return;
    const L = leaflet.current;
    const m = mapa.current;
    capa.current ??= nuevaCapa();
    const g = capa.current;
    g.clearLayers();
    L.circle([lat, lon], {
      radius: radioKm * 1000,
      className: "parque-area",
      fill: false,
      weight: 2,
      interactive: false,
    }).addTo(g);
    for (const z of zonas) {
      const es = z.nombre === recomendada;
      L.circle([z.lat, z.lon], {
        radius: Math.min(15, radioKm / 3) * 1000,
        className: es ? "zona-recomendada" : "zona-parque",
        weight: es ? 2.5 : 1.5,
        fillOpacity: es ? 0.45 : 0.08,
      })
        .bindTooltip(z.nombre, { permanent: true, direction: "center", className: "rotulo-zona" })
        .bindPopup(`<strong>${esc(z.nombre)}</strong><br>${esc(z.nota)}`)
        .addTo(g);
    }
    for (const a of alojamientos)
      L.circleMarker([a.lat, a.lon], { radius: 3.5, weight: 1, className: "punto-alojamiento" })
        .bindPopup(
          `<strong>${esc(a.nombre)}</strong><br>${esc(a.tipo)}${a.href ? `<br><a href="${esc(a.href)}" target="_blank" rel="noopener">Web o ficha en OSM</a>` : ""}`,
        )
        .addTo(g);
    for (const a of cercanos)
      L.marker([a.lat!, a.lon!], {
        icon: L.divIcon({ className: "punto-aeropuerto", html: `<span>${esc(a.iata)}</span>`, iconSize: [30, 18] }),
      })
        .bindPopup(`<strong>${esc(a.nombre)}</strong> (${esc(a.iata)})<br>a ${a.km} km`)
        .addTo(g);
    if (encuadrado.current) return;
    encuadrado.current = true;
    // sin vista aún, el círculo no tiene mapa y no sabe sus límites: se calculan del radio
    const limites = L.latLng(lat, lon).toBounds(radioKm * 2000);
    for (const a of cercanos.slice(0, 1)) limites.extend([a.lat!, a.lon!]);
    m.fitBounds(limites, { padding: [24, 24], animate: false });
  }, [listo, leaflet, mapa, nuevaCapa, lat, lon, radioKm, zonas, recomendada, alojamientos, cercanos]);

  return (
    <div className="carta carta-parque">
      <div
        ref={caja}
        className="carta-mapa"
        role="region"
        aria-label={`Mapa de ${nombre}`}
        data-listo={listo ? "si" : "no"}
      />
      <div className="carta-panel">
        {zonas.length > 0 && (
          <table className="tabla-celda tabla-zonas">
            <caption>Zonas del parque en {MESES[mes]}</caption>
            <tbody>
              {zonas.map((z) => (
                <tr key={z.nombre} data-recomendada={z.nombre === recomendada ? "si" : undefined}>
                  <th scope="row">
                    {z.nombre}
                    {z.nombre === recomendada && <span className="marca-recomendada"> la migración, cerca</span>}
                    <small>{z.nota}</small>
                  </th>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {cercanos.length > 0 && (
          <table className="tabla-celda">
            <caption>Aeropuertos más cercanos</caption>
            <tbody>
              {cercanos.map((a) => (
                <tr key={a.iata}>
                  <th scope="row">
                    {a.nombre} <span className="cifra">{a.iata}</span>
                    {a.internacional ? <small>internacional</small> : null}
                  </th>
                  <td className="num cifra">{a.km} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <dl className="leyenda-parque">
          <div>
            <dt>
              <span className="muestra-area" aria-hidden="true" />
            </dt>
            <dd>Zona del parque (unos {Math.round(radioKm)} km de radio)</dd>
          </div>
          {zonas.length > 0 && (
            <div>
              <dt>
                <span className="muestra-zona" aria-hidden="true" />
              </dt>
              <dd>La zona más cerca de la migración en {MESES[mes]}</dd>
            </div>
          )}
          {alojamientos.length > 0 && (
            <div>
              <dt>
                <span className="muestra-alojamiento" aria-hidden="true" />
              </dt>
              <dd>
                <span className="cifra">{alojamientos.length}</span> alojamientos de OpenStreetMap
              </dd>
            </div>
          )}
        </dl>
        <p className="nota-celda">
          Centros de zona aproximados, escritos a mano; la migración, de su calendario.{" "}
          <Link href={`/mapa?parque=${id}`}>Este parque en el mapa del mundo</Link>.
        </p>
      </div>
    </div>
  );
}
