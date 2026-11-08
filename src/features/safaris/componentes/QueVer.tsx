"use client";
// «¿Qué quieres ver y cuándo?»: eliges hasta 4 especies y el mes y salen los parques del mundo donde es más fácil
// verlas, por las observaciones reales de cada especie (GBIF) y la buena época del parque. Lo que nadie hace:
// los calendarios de las agencias son texto y solo de sus destinos.
import Link from "next/link";
import { useState } from "react";
import { type DatosEspecies, useDatosNavegador } from "@/features/safaris/useDatosNavegador";
import { MESES } from "@/lib/fechas";
import { buenaEpoca, type FilaIndice, nivelFrecuencia, textoFrecuencia } from "@/features/safaris/modelo";
import { useParametrosUrl } from "@/lib/almacen";
import { useMesElegido } from "@/lib/mes";

/** Parques ordenados por cuántas de las especies elegidas tienen, buena época en el mes y facilidad media. */
function ordenar(datos: DatosEspecies | null, indice: Map<string, FilaIndice> | null, elegidas: number[], mes: number) {
  if (!datos || !indice || !elegidas.length) return [];
  // facilidad de cada especie en cada parque: observaciones frente al parque donde más se ve (0-1)
  const porParque = new Map<string, Map<number, number>>();
  for (const clave of elegidas) {
    const lista = datos.parques[String(clave)] ?? [];
    const max = lista[0]?.[1] ?? 1;
    for (const [id, n] of lista) {
      if (!porParque.has(id)) porParque.set(id, new Map());
      porParque.get(id)!.set(clave, Math.sqrt(n / max)); // raíz: que los muy observados no lo tapen todo
    }
  }
  return [...porParque.entries()]
    .map(([id, especies]) => {
      const f = indice.get(id);
      const epoca = f ? buenaEpoca(f) : null;
      const enEpoca = epoca?.includes(mes + 1) ?? false;
      const facilidad = [...especies.values()].reduce((a, b) => a + b, 0) / elegidas.length;
      return { id, f, especies, enEpoca, conEpoca: epoca !== null, facilidad };
    })
    .filter((r) => r.f)
    .sort(
      (a, b) => b.especies.size - a.especies.size || Number(b.enEpoca) - Number(a.enEpoca) || b.facilidad - a.facilidad,
    )
    .slice(0, RESULTADOS);
}

const MAX_ELEGIDAS = 4;
const RESULTADOS = 12;

export default function QueVer({ mesHoy }: { mesHoy: number }) {
  const { especies: datos, indice } = useDatosNavegador();
  const [verTodas, setVerTodas] = useState(false);
  const [parametros, actualizar] = useParametrosUrl();
  const elegidas = (parametros.get("ver") ?? "").split(",").filter(Boolean).map(Number);
  const [mes, cambiarMes] = useMesElegido(mesHoy);

  function alternar(clave: number) {
    const nuevas = elegidas.includes(clave)
      ? elegidas.filter((c) => c !== clave)
      : [...elegidas, clave].slice(-MAX_ELEGIDAS);
    actualizar({ ver: nuevas.join(",") || null });
  }

  const resultados = ordenar(datos, indice, elegidas, mes);

  if (!datos) return null;

  const nombre = new Map(datos.especies.map((e) => [e.clave, e.nombre]));
  const visibles = verTodas ? datos.especies : datos.especies.slice(0, 18);
  return (
    <section className="seccion que-ver" id="que-ver" aria-labelledby="que-ver-titulo">
      <h2 id="que-ver-titulo">¿Qué quieres ver y cuándo?</h2>
      <p className="nota-pie">Elige hasta {MAX_ELEGIDAS} animales y el mes de tu viaje.</p>
      <div className="chips-especies" role="group" aria-label="Animales">
        {visibles.map((e) => (
          <button
            key={e.clave}
            type="button"
            className="chip-especie"
            aria-pressed={elegidas.includes(e.clave)}
            onClick={() => alternar(e.clave)}
          >
            {e.foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.foto} alt="" width={28} height={28} loading="lazy" />
            )}
            {e.nombre}
          </button>
        ))}
        {!verTodas && datos.especies.length > visibles.length && (
          <button type="button" className="chip-especie mas" onClick={() => setVerTodas(true)}>
            + {datos.especies.length - visibles.length} más
          </button>
        )}
      </div>
      <label className="campo campo-mes">
        <span className="rotulo">Mes del viaje</span>
        <select value={mes} onChange={(e) => cambiarMes(Number(e.target.value))}>
          {MESES.map((m, i) => (
            <option key={m} value={i}>
              {m}
              {i === mesHoy ? " (este mes)" : ""}
            </option>
          ))}
        </select>
      </label>

      {elegidas.length > 0 && (
        <ol className="resultados-que-ver">
          {resultados.map((r, i) => (
            <li key={r.id}>
              <span className="puesto">{i + 1}</span>
              <div>
                <Link href={`/parque/${r.id}`}>
                  <b>{r.f!.n}</b>
                </Link>{" "}
                <small>{r.f!.p ?? ""}</small>
                <p className="especies-ok">
                  {elegidas.map((c) => {
                    // en los destacados, cuánto se registra ese mes
                    const f = datos.frecuencia?.[r.id]?.[String(c)];
                    const n = f ? nivelFrecuencia(f[mes]) : null;
                    return (
                      <span key={c} className={r.especies.has(c) ? "si" : "no"}>
                        {r.especies.has(c) ? "✓" : "–"} {nombre.get(c)}
                        {n && n.clave !== "sin-datos" && (
                          <small className={`nivel f-texto-${n.clave}`}> · {textoFrecuencia(f![mes])}</small>
                        )}
                      </span>
                    );
                  })}
                </p>
                <p className={r.enEpoca ? "en-temporada" : "fuera-temporada"}>
                  {r.enEpoca
                    ? `Buena época en ${MESES[mes]}`
                    : r.conEpoca
                      ? `${MESES[mes][0].toUpperCase()}${MESES[mes].slice(1)} no es su mejor época`
                      : "Sin datos de temporada"}
                </p>
              </div>
              <span className="barra-facilidad" aria-label={`Facilidad ${Math.round(r.facilidad * 100)} de 100`}>
                <i style={{ width: `${Math.round(r.facilidad * 100)}%` }} />
              </span>
            </li>
          ))}
          {!resultados.length && <li>No hay parques con observaciones de esas especies juntas.</li>}
        </ol>
      )}
      {elegidas.length > 0 && (
        <p className="nota-pie">
          Orden: primero los parques donde se han visto todas las que elegiste, luego los que están en buena época y,
          dentro, los de más observaciones (GBIF desde 2010). La barra compara con el mejor parque del mundo para cada
          especie.
        </p>
      )}
    </section>
  );
}
