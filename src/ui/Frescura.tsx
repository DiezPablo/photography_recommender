// «De cuándo es cada dato»: al pie de las fichas, qué se actualiza solo y cuándo fue la última vez, y qué está
// escrito a mano y cuándo se revisó. Así se sabe cuánto fiarse de cada cosa.
export interface DatoFresco {
  que: string;
  /** AAAA-MM-DD, «2026» o un texto («escrito a mano») */
  cuando: string;
  fuente?: string;
  url?: string;
}

export function fecha(t: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(t))
    return new Date(`${t.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (/^\d{2}-\d{2}-\d{4}$/.test(t)) return fecha(t.split("-").reverse().join("-"));
  return t;
}

export function Frescura({ datos }: { datos: DatoFresco[] }) {
  return (
    <details className="frescura" id="de-cuando">
      <summary>De cuándo es cada dato</summary>
      <dl>
        {datos.map((d) => (
          <div key={d.que}>
            <dt>{d.que}</dt>
            <dd>
              {fecha(d.cuando)}
              {d.fuente &&
                (d.url ? (
                  <>
                    {" · "}
                    <a href={d.url} target="_blank" rel="noopener">
                      {d.fuente} ↗
                    </a>
                  </>
                ) : (
                  ` · ${d.fuente}`
                ))}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** Una línea corta arriba de la ficha (T41): lo más reciente que hay y de dónde viene; el detalle, abajo. */
export function FrescuraCorta({ cuando, fuente }: { cuando: string; fuente: string }) {
  return (
    <p className="frescura-corta">
      Actualizado el {fecha(cuando)} con {fuente} · <a href="#de-cuando">fechas de cada dato</a>
    </p>
  );
}
