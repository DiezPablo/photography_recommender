"use client";
// El veredicto del mes elegido en la cabecera (T32/T37). Los doce se calculan en el servidor; aquí solo se elige.
// Sin JavaScript se ve el del mes en curso.
import { MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";
import type { VeredictoMes as Veredicto } from "@/features/safaris/veredicto";

export default function VeredictoMes({
  meses,
  mesHoy,
  encabezado: H = "h2",
}: {
  meses: Veredicto[];
  mesHoy: number;
  /** h3 dentro del bloque «Cuándo ir» de la ficha */
  encabezado?: "h2" | "h3";
}) {
  const [mes, cambiar] = useMesElegido(mesHoy);
  const v = meses[mes];
  if (!v) return null;
  return (
    <section className={`seccion veredicto-mes nota-${v.nota}`} aria-labelledby="veredicto-titulo">
      <H id="veredicto-titulo">
        <label>
          <span className="sr">Mes</span>
          <select value={mes} onChange={(e) => cambiar(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </label>
        : <span className="veredicto-nota">{v.titulo}</span>
      </H>
      {v.detalles.length > 0 && (
        <ul>
          {v.detalles.map((d) => (
            <li key={d}>{d}.</li>
          ))}
        </ul>
      )}
      <p className="doce-meses" aria-label="Los doce meses">
        {meses.map((x, i) => (
          <button
            key={i}
            type="button"
            className={`nota-${x.nota}`}
            aria-pressed={i === mes}
            title={`${MESES[i]}: ${x.titulo.toLowerCase()}`}
            onClick={() => cambiar(i)}
          >
            {MESES[i].slice(0, 3)}
          </button>
        ))}
      </p>
    </section>
  );
}
