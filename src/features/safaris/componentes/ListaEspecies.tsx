"use client";
// Rejilla de especies con buscador y filtro por grupo (mamíferos, aves, reptiles): eran 87 tarjetas grandes
// seguidas, 37 pantallas en el móvil.
import Link from "next/link";
import { useState } from "react";
import { MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";
import { GRUPOS_FAUNA, type GrupoFauna } from "@/features/safaris/gruposFauna";
import Credito, { esNd } from "@/ui/Credito";
import type { FotoSafari } from "@/features/safaris/modelo";
import { fuenteImagen } from "@/lib/imagenes";

export interface EspecieTarjeta {
  taxon: number;
  nombre: string;
  cientifico: string;
  grupo: GrupoFauna;
  continentes: string[];
  /** meses (1-12) de buena época en alguno de sus parques */
  meses: number[];
  foto: FotoSafari | null;
  href: string;
  parques: string;
}

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ListaEspecies({ especies, mesHoy }: { especies: EspecieTarjeta[]; mesHoy: number }) {
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState<string | null>(null);
  const [continente, setContinente] = useState("");
  const [enEpoca, setEnEpoca] = useState(false);
  const [mes] = useMesElegido(mesHoy);
  const t = sinTildes(q.trim());
  const lista = especies.filter(
    (e) =>
      (!grupo || e.grupo === grupo) &&
      (!continente || e.continentes.includes(continente)) &&
      (!enEpoca || e.meses.includes(mes + 1)) &&
      (!t || sinTildes(`${e.nombre} ${e.cientifico} ${e.parques}`).includes(t)),
  );
  const continentes = [...new Set(especies.flatMap((e) => e.continentes))].sort((a, b) => a.localeCompare(b, "es"));
  return (
    <>
      <div className="filtros-especies">
        <input
          type="search"
          aria-label="Buscar especie o parque"
          placeholder="Buscar: leopardo, gorila, Kruger…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="filtro-grupos" role="group" aria-label="Grupo">
          <button type="button" className="quitar" aria-pressed={!grupo} onClick={() => setGrupo(null)}>
            Todas <small>{especies.length}</small>
          </button>
          {GRUPOS_FAUNA.filter((g) => especies.some((e) => e.grupo === g)).map((g) => (
            <button key={g} type="button" className="quitar" aria-pressed={grupo === g} onClick={() => setGrupo(g)}>
              {g} <small>{especies.filter((e) => e.grupo === g).length}</small>
            </button>
          ))}
        </p>
        <p className="filtros-especies-mas">
          <label>
            <span className="sr">Continente</span>
            <select value={continente} onChange={(e) => setContinente(e.target.value)}>
              <option value="">Todos los continentes</option>
              {continentes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="casilla-especies">
            <input type="checkbox" checked={enEpoca} onChange={(e) => setEnEpoca(e.target.checked)} /> En buena época en{" "}
            {MESES[mes]}
          </label>
          <span className="nota-pie" aria-live="polite">
            {lista.length} {lista.length === 1 ? "especie" : "especies"}
          </span>
        </p>
      </div>
      {!lista.length && <p className="nota-pie">Ninguna especie con esos filtros.</p>}
      <h2 className="sr">Especies</h2>
      <ul className="rejilla-especies">
        {lista.map((e) => (
          <li key={e.taxon} className="tarjeta-especie">
            {e.foto ? (
              <span className="con-credito">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  {...fuenteImagen(e.foto.url, "(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 240px")}
                  width={500}
                  height={375}
                  style={e.foto.posicion ? { objectPosition: e.foto.posicion } : undefined}
                  alt={e.nombre}
                  loading="lazy"
                  decoding="async"
                  className={esNd(e.foto) ? "foto-nd" : undefined}
                />
                <Credito foto={e.foto} />
              </span>
            ) : (
              <span className="sin-foto" aria-hidden />
            )}
            <div>
              <h3>
                <Link href={e.href}>{e.nombre}</Link>
              </h3>
              <p>
                <i>{e.cientifico}</i>
              </p>
              <p className="meta">{e.parques || "Pocas observaciones en los parques"}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
