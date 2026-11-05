"use client";
// Qué se ve cada mes en un lugar, un grupo cada vez (aves, mamíferos…) con pestañas, y solo las 10 más frecuentes
// hasta que pides el resto: cuatro tablas seguidas eran ocho pantallas en el móvil.
import { useState } from "react";
import FrecuenciaAvistamientos, { type FilaFrecuencia } from "@/features/safaris/componentes/FrecuenciaAvistamientos";

const VISIBLES = 10;

export default function CalendarioPorGrupo({
  grupos,
  mesHoy,
}: {
  grupos: { clase: string; titulo: string; filas: FilaFrecuencia[] }[];
  mesHoy: number;
}) {
  const [grupo, setGrupo] = useState(grupos[0]?.clase);
  const [todas, setTodas] = useState(false);
  const actual = grupos.find((g) => g.clase === grupo) ?? grupos[0];
  if (!actual) return null;
  const media = (f: FilaFrecuencia) => f.meses.reduce<number>((a, b) => a + (b ?? 0), 0);
  const filas = [...actual.filas].sort((a, b) => media(b) - media(a));
  return (
    <section className="seccion calendario-grupos">
      {grupos.length > 1 && (
        <p className="filtro-grupos" role="tablist" aria-label="Grupo">
          {grupos.map((g) => (
            <button
              key={g.clase}
              type="button"
              role="tab"
              className="quitar"
              aria-selected={g.clase === actual.clase}
              aria-pressed={g.clase === actual.clase}
              onClick={() => {
                setGrupo(g.clase);
                setTodas(false);
              }}
            >
              {g.titulo} <small>{g.filas.length}</small>
            </button>
          ))}
        </p>
      )}
      <FrecuenciaAvistamientos
        titulo={`${actual.titulo}: qué se ve cada mes`}
        mesHoy={mesHoy}
        unidad="observaciones"
        filas={todas ? filas : filas.slice(0, VISIBLES)}
      />
      {filas.length > VISIBLES && (
        <button type="button" className="quitar" onClick={() => setTodas(!todas)}>
          {todas ? "Ver solo las 10 más frecuentes" : `Ver las ${filas.length}`}
        </button>
      )}
    </section>
  );
}
