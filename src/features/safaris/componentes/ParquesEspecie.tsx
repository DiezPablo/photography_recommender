"use client";
// «Mejores parques» de la ficha de una especie (T43): miniatura, barra de 12 meses con la buena época y el mes
// elegido resaltado, y orden por observaciones, por buena época ese mes o por precio de entrada.
import Link from "next/link";
import { useState } from "react";
import { INICIALES, MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";

export interface FilaParqueEspecie {
  id: string;
  nombre: string;
  pais: string;
  /** observaciones de la especie alrededor del parque */
  n: number;
  /** en el último mes */
  recientes: number;
  /** buena época, meses 1-12 */
  meses: number[];
  /** frecuencia de la especie por mes (‰), si la hay */
  frecuencia?: (number | null)[];
  foto?: string | null;
  /** entrada por persona y día (USD), si se sabe */
  usdDia?: number | null;
}

type Orden = "observaciones" | "epoca" | "precio";

export default function ParquesEspecie({ filas, mesHoy }: { filas: FilaParqueEspecie[]; mesHoy: number }) {
  const [mes] = useMesElegido(mesHoy);
  const [orden, setOrden] = useState<Orden>("observaciones");
  const max = Math.max(1, ...filas.map((f) => f.n));
  const enEpoca = (f: FilaParqueEspecie) => f.meses.includes(mes + 1);
  const ordenadas = [...filas].sort((a, b) =>
    orden === "epoca"
      ? Number(enEpoca(b)) - Number(enEpoca(a)) || (b.frecuencia?.[mes] ?? 0) - (a.frecuencia?.[mes] ?? 0) || b.n - a.n
      : orden === "precio"
        ? (a.usdDia ?? Infinity) - (b.usdDia ?? Infinity) || b.n - a.n
        : b.n - a.n,
  );
  return (
    <>
      <p className="orden-parques" role="group" aria-label="Ordenar">
        <span className="rotulo">Ordenar por</span>
        {(
          [
            ["observaciones", "Observaciones"],
            ["epoca", `Buena época en ${MESES[mes]}`],
            ["precio", "Entrada más barata"],
          ] as [Orden, string][]
        ).map(([o, texto]) => (
          <button key={o} type="button" aria-pressed={orden === o} onClick={() => setOrden(o)}>
            {texto}
          </button>
        ))}
      </p>
      <ol className="parques-especie">
        {ordenadas.map((f) => (
          <li key={f.id}>
            {f.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.foto} alt="" width={64} height={64} loading="lazy" />
            ) : (
              <span className="sin-foto" aria-hidden />
            )}
            <div>
              <p className="parque-especie-cab">
                <Link href={`/parque/${f.id}`}>
                  <b>{f.nombre}</b>
                </Link>{" "}
                <small>
                  {f.pais}
                  {enEpoca(f) && <span className="chip en-epoca">buena época en {MESES[mes]}</span>}
                </small>
              </p>
              <p className="barra-obs" aria-hidden>
                <i style={{ width: `${(f.n / max) * 100}%` }} />
              </p>
              <small>
                {f.n.toLocaleString("es-ES")} observaciones
                {f.recientes > 0 && ` · ${f.recientes} en el último mes`}
                {f.usdDia ? ` · entrada unos ${Math.round(f.usdDia)} USD/día` : ""}
              </small>
              <span
                className="meses-parque"
                role="img"
                aria-label={`Buena época: ${f.meses.map((m) => MESES[m - 1]).join(", ")}`}
              >
                {INICIALES.map((l, i) => (
                  <span
                    key={i}
                    className={`${f.meses.includes(i + 1) ? "si" : "no"}${i === mes ? " elegido" : ""}`}
                    title={`${MESES[i]}${f.meses.includes(i + 1) ? ": buena época" : ""}`}
                  >
                    {l}
                  </span>
                ))}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
