"use client";
// Rejilla de especies con buscador y filtro por grupo (mamíferos, aves, reptiles): eran 87 tarjetas grandes
// seguidas, 37 pantallas en el móvil.
import Link from "next/link";
import { useState } from "react";
import Credito, { esNd } from "@/ui/Credito";
import type { FotoSafari } from "@/features/safaris/modelo";

export interface EspecieTarjeta {
  taxon: number;
  nombre: string;
  cientifico: string;
  grupo: string | null;
  foto: FotoSafari | null;
  href: string;
  parques: string;
}

const GRUPOS: [string, string][] = [
  ["Mammalia", "Mamíferos"],
  ["Aves", "Aves"],
  ["Reptilia", "Reptiles"],
];
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ListaEspecies({ especies }: { especies: EspecieTarjeta[] }) {
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState<string | null>(null);
  const t = sinTildes(q.trim());
  const lista = especies.filter(
    (e) => (!grupo || e.grupo === grupo) && (!t || sinTildes(`${e.nombre} ${e.cientifico} ${e.parques}`).includes(t)),
  );
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
          {GRUPOS.filter(([g]) => especies.some((e) => e.grupo === g)).map(([g, texto]) => (
            <button key={g} type="button" className="quitar" aria-pressed={grupo === g} onClick={() => setGrupo(g)}>
              {texto} <small>{especies.filter((e) => e.grupo === g).length}</small>
            </button>
          ))}
        </p>
      </div>
      {!lista.length && <p className="nota-pie">Ninguna especie con «{q}».</p>}
      <ul className="rejilla-especies">
        {lista.map((e) => (
          <li key={e.taxon} className="tarjeta-especie">
            {e.foto ? (
              <span className="con-credito">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.foto.url}
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
