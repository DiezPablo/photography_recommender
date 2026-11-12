"use client";
// Dónde: un buscador de lugares de fauna (puntos de eBird, espacios protegidos, observatorios), «Mi ubicación» y
// la lista «Cerca de aquí» con lo que hay en cada uno ese mes. Elegir uno cambia el punto, el radio y el nombre.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LugarFauna } from "@/features/fauna/zonas";
import { guardarUbicacion } from "@/features/fauna/ubicacion";

interface LugarCerca extends LugarFauna {
  km: number;
  especies: number;
  destacadas: string[];
}

export type Eleccion = { lat: number; lon: number; radio: number; nombre: string | null };

const RADIOS = [5, 10, 20, 30];
/** El radio de la lista más parecido al del lugar (un punto de eBird, 5 km: la cuadrícula es de 10). */
export const radioPara = (r: number) => RADIOS.find((x) => x >= r) ?? 30;

export default function ElegirLugar({
  lat,
  lon,
  mes,
  nombre,
  elegir,
  conCerca = true,
}: {
  lat: number;
  lon: number;
  mes: number;
  nombre: string;
  elegir: (e: Eleccion) => void;
  /** la lista «Cerca de aquí» (en «Este finde» ya es la página entera) */
  conCerca?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [opciones, setOpciones] = useState<{ q: string; l: LugarFauna[] }>();
  const [cerca, setCerca] = useState<{ clave: string; l: LugarCerca[] | null }>();
  const [errorUbicacion, setErrorUbicacion] = useState(false);

  const q = texto.trim();
  useEffect(() => {
    if (q.length < 2) return;
    let vivo = true;
    const t = setTimeout(() => {
      fetch(`/fauna/lugares?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { lugares: [] }))
        .then((d: { lugares: LugarFauna[] }) => vivo && setOpciones({ q, l: d.lugares }))
        .catch(() => vivo && setOpciones({ q, l: [] }));
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [q]);
  const lista = q.length >= 2 && opciones?.q === q ? opciones.l : [];

  const claveCerca = `${lat.toFixed(3)},${lon.toFixed(3)},${mes}`;
  useEffect(() => {
    if (!conCerca) return;
    let vivo = true;
    fetch(`/fauna/cerca?lat=${lat}&lon=${lon}&mes=${mes}`)
      .then((r) => (r.ok ? r.json() : { lugares: null }))
      .then((d: { lugares: LugarCerca[] | null }) => vivo && setCerca({ clave: claveCerca, l: d.lugares }))
      .catch(() => vivo && setCerca({ clave: claveCerca, l: null }));
    return () => {
      vivo = false;
    };
  }, [lat, lon, mes, claveCerca, conCerca]);
  const cercanos = cerca?.clave === claveCerca ? cerca.l : undefined;

  const ir = (l: LugarFauna) => {
    guardarUbicacion({ lat: l.lat, lon: l.lon, nombre: l.n });
    elegir({ lat: l.lat, lon: l.lon, radio: radioPara(l.r), nombre: l.n });
    setTexto("");
  };

  return (
    <>
      <div className="campo buscador-especie elegir-lugar">
        <label className="rotulo" htmlFor="buscar-lugar">
          Dónde
        </label>
        <input
          id="buscar-lugar"
          type="search"
          placeholder={nombre}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
        />
        {lista.length > 0 && (
          <ul className="opciones-especie" role="listbox">
            {lista.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => ir(l)}>
                  <b>{l.n}</b> <small>{l.t}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="quitar mi-ubicacion"
          onClick={() =>
            navigator.geolocation?.getCurrentPosition(
              (p) => {
                setErrorUbicacion(false);
                guardarUbicacion({ lat: p.coords.latitude, lon: p.coords.longitude, nombre: null });
                elegir({ lat: p.coords.latitude, lon: p.coords.longitude, radio: 10, nombre: null });
              },
              () => setErrorUbicacion(true),
            )
          }
        >
          Mi ubicación
        </button>
        {errorUbicacion && <small className="nota-pie">No se pudo saber tu ubicación.</small>}
      </div>
      {cercanos && cercanos.length > 0 && (
        <details className="cerca-de-aqui">
          <summary className="rotulo">Cerca de aquí: {cercanos.length} lugares para ver fauna</summary>
          <ul>
            {cercanos.map((l) => (
              <li key={l.id}>
                <button type="button" className="enlace" onClick={() => ir(l)}>
                  {l.n}
                </button>{" "}
                <Link href={`/fauna/lugar/${encodeURIComponent(l.id)}`} className="enlace-ficha">
                  ficha
                </Link>{" "}
                <small>
                  {l.t} · {l.km < 1 ? "aquí" : `a ${l.km.toLocaleString("es-ES")} km`}
                  {l.especies > 0 ? ` · ${l.especies} especies este mes` : ""}
                  {l.e ? ` · ${l.e} en eBird` : ""}
                </small>
                {l.destacadas.length > 0 && (
                  <>
                    <br />
                    <small>{l.destacadas.join(", ")}</small>
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
