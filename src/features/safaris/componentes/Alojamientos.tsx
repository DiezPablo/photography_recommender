"use client";
// «Dónde dormir» (T38): en los parques grandes, los alojamientos por zona, con la zona recomendada para el mes
// elegido abierta y marcada; en el resto, una lista. Seis a la vista y el resto plegado.
import { MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";
import { enlaceResenas, urlWeb, type Alojamiento } from "@/features/safaris/modelo";

const VISIBLES = 6;

export interface GrupoAlojamientos {
  nombre: string | null;
  nota?: string;
  lista: Alojamiento[];
}

function Fila({ a }: { a: Alojamiento }) {
  const web = urlWeb(a.web);
  const tel = a.telefono?.split(";")[0];
  return (
    <li>
      <b>{a.nombre}</b> <small>{a.tipo}</small>
      <span className="enlaces">
        {web && (
          <a href={web} target="_blank" rel="noopener">
            Web y reservas ↗
          </a>
        )}
        {tel && <a href={`tel:${tel}`}>{tel}</a>}
        <a href={enlaceResenas(a)} target="_blank" rel="noopener">
          Reseñas ↗
        </a>
      </span>
    </li>
  );
}

function Lista({ lista }: { lista: Alojamiento[] }) {
  return (
    <>
      <ul className="lista-alojamientos">
        {lista.slice(0, VISIBLES).map((a) => (
          <Fila key={a.osm} a={a} />
        ))}
      </ul>
      {lista.length > VISIBLES && (
        <details className="mas-alojamientos">
          <summary>Ver {lista.length - VISIBLES} más</summary>
          <ul className="lista-alojamientos">
            {lista.slice(VISIBLES).map((a) => (
              <Fila key={a.osm} a={a} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default function Alojamientos({
  grupos,
  recomendadas,
  mesHoy,
}: {
  grupos: GrupoAlojamientos[];
  /** zona recomendada cada mes (0-11) */
  recomendadas: (string | null)[];
  mesHoy: number;
}) {
  const [mes] = useMesElegido(mesHoy);
  if (grupos.length === 1 && !grupos[0].nombre) return <Lista lista={grupos[0].lista} />;
  const recomendada = recomendadas[mes];
  return (
    <div className="alojamientos-zonas">
      {recomendada && (
        <p className="zona-recomendada">
          En {MESES[mes]}, mejor dormir en <b>{recomendada}</b>: es donde suele estar la migración.
        </p>
      )}
      {grupos
        .filter((g) => g.lista.length || g.nombre === recomendada)
        .map((g) => (
          <details
            key={g.nombre}
            className={`zona-alojamientos${g.nombre === recomendada ? " recomendada" : ""}`}
            open={g.nombre === recomendada || (!recomendada && g === grupos.find((x) => x.lista.length))}
          >
            <summary>
              <b>{g.nombre}</b> <small>({g.lista.length})</small>
              {g.nombre === recomendada && <span className="chip">Recomendada en {MESES[mes]}</span>}
            </summary>
            {g.nota && <p className="nota-pie">{g.nota}</p>}
            {g.lista.length ? (
              <Lista lista={g.lista} />
            ) : (
              <p>OpenStreetMap aún no tiene alojamientos con nombre en esta zona: búscalos en la web del parque.</p>
            )}
          </details>
        ))}
    </div>
  );
}
