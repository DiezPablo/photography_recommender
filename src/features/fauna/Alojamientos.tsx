"use client";
// Alojamientos cerca de un punto (OpenStreetMap, a petición: solo al pulsar el botón, para no cargar Overpass).
import { useState } from "react";

interface Alojamiento {
  id: string;
  n: string;
  t: string;
  web: string | null;
}

const TIPOS: Record<string, string> = {
  hotel: "hotel",
  guest_house: "casa de huéspedes",
  hostel: "albergue",
  apartment: "apartamento",
  chalet: "casa rural",
  camp_site: "camping",
  motel: "motel",
};

export default function Alojamientos({ lat, lon, nombre }: { lat: number; lon: number; nombre: string }) {
  const [estado, setEstado] = useState<"nada" | "buscando" | "error" | Alojamiento[]>("nada");
  const buscar = () => {
    setEstado("buscando");
    const q = `[out:json][timeout:25];nwr["tourism"~"^(hotel|guest_house|hostel|apartment|chalet|camp_site|motel)$"]["name"](around:15000,${lat},${lon});out center tags 25;`;
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: q }) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { elements: { type: string; id: number; tags: Record<string, string> }[] }) =>
        setEstado(
          d.elements.slice(0, 10).map((e) => ({
            id: `${e.type}/${e.id}`,
            n: e.tags.name,
            t: TIPOS[e.tags.tourism] ?? e.tags.tourism,
            web: e.tags.website ?? e.tags["contact:website"] ?? null,
          })),
        ),
      )
      .catch(() => setEstado("error"));
  };
  if (estado === "nada")
    return (
      <button type="button" className="quitar" onClick={buscar}>
        Alojamientos a 15 km de {nombre}
      </button>
    );
  if (estado === "buscando") return <small>Buscando alojamientos en OpenStreetMap…</small>;
  if (estado === "error") return <small>OpenStreetMap no respondió; prueba más tarde.</small>;
  if (!estado.length) return <small>No hay alojamientos con nombre en OpenStreetMap a 15 km.</small>;
  return (
    <ul className="lista-lugares">
      {estado.map((a) => (
        <li key={a.id}>
          {a.web ? (
            <a href={a.web} target="_blank" rel="noopener">
              {a.n} ↗
            </a>
          ) : (
            <a href={`https://www.openstreetmap.org/${a.id}`} target="_blank" rel="noopener">
              {a.n}
            </a>
          )}{" "}
          <small>{a.t}</small>
        </li>
      ))}
    </ul>
  );
}
