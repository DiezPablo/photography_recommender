// El año de un parque: temporada recomendada (escrita a mano), mamíferos observados en iNaturalist por mes y
// clima (lluvia y máxima media de la climatología de la NASA, POWER). Una columna por mes.
import { INICIALES, MESES } from "@/lib/fechas";
import type { Parque } from "@/features/safaris/modelo";
import { eventosDe } from "@/features/safaris/eventos";

export default function AnoSafari({ p, mesActual }: { p: Parque; mesActual: number }) {
  const lluviaMax = Math.max(1, ...(p.clima?.lluvia_mm ?? [1]));
  // momentos del año (T24): partos, cruces, celos, crías, concentraciones… del calendario de fenómenos
  const eventos = eventosDe(p.id);
  return (
    <div className="ano-safari" role="table" aria-label="El año en el parque">
      <div role="row" className="fila-ano cabecera-ano">
        <span role="rowheader" />
        {INICIALES.map((m, i) => (
          <span
            role="columnheader"
            key={i}
            data-m={i + 1}
            className={i === mesActual ? "actual" : undefined}
            title={MESES[i]}
          >
            {m}
          </span>
        ))}
      </div>
      <div role="row" className="fila-ano">
        <span role="rowheader">Temporada</span>
        {MESES.map((m, i) => (
          <span
            role="cell"
            key={m}
            data-m={i + 1}
            className={p.meses.includes(i + 1) ? "temporada-si" : "temporada-no"}
            title={`${m}: ${p.meses.includes(i + 1) ? "buena época" : "fuera de la mejor época"}`}
          />
        ))}
      </div>
      {eventos.length > 0 && (
        <div role="row" className="fila-ano">
          <span role="rowheader">Momentos</span>
          {MESES.map((m, i) => {
            const aqui = eventos.filter((e) => e.meses.includes(i + 1));
            return (
              <span
                role="cell"
                key={m}
                data-m={i + 1}
                className={aqui.length ? "momento-si" : "momento-no"}
                title={aqui.length ? `${m}: ${aqui.map((e) => e.titulo).join(", ")}` : undefined}
              >
                {aqui.length ? <span aria-hidden>★</span> : null}
                {aqui.length ? <span className="sr">{`${m}: ${aqui.map((e) => e.titulo).join(", ")}`}</span> : null}
              </span>
            );
          })}
        </div>
      )}
      {p.meses_mamiferos && (
        <div role="row" className="fila-ano">
          <span role="rowheader">Mamíferos vistos</span>
          {p.meses_mamiferos.map((v, i) => (
            <span role="cell" key={i} title={`${MESES[i]}: ${v} sobre 100`} className="barra-ano">
              <i style={{ height: `${Math.max(6, v)}%` }} />
            </span>
          ))}
        </div>
      )}
      {p.clima && (
        <>
          <div role="row" className="fila-ano">
            <span role="rowheader">Lluvia</span>
            {p.clima.lluvia_mm.map((v, i) => (
              <span role="cell" key={i} title={`${MESES[i]}: ${v} mm`} className="barra-ano lluvia">
                <i style={{ height: `${Math.max(4, (v / lluviaMax) * 100)}%` }} />
              </span>
            ))}
          </div>
          <div role="row" className="fila-ano numeros">
            <span role="rowheader">Máx. °C</span>
            {p.clima.tmax.map((v, i) => (
              <span role="cell" key={i}>
                {v ?? "–"}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
