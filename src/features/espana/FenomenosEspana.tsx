// Fenómenos de fauna en España (fenomenos.ts) con sus meses, «ahora» si caen en el mes y sus fuentes.
import { MESES, rangoMeses } from "@/lib/fechas";
import type { Fenomeno } from "@/features/espana/fenomenos";

export default function FenomenosEspana({
  fenomenos,
  mesHoy,
  titulo = "Qué pasa a lo largo del año",
}: {
  fenomenos: Fenomeno[];
  /** 0-11 */
  mesHoy: number;
  titulo?: string;
}) {
  if (!fenomenos.length) return null;
  return (
    <div className="fenomenos">
      <h3>{titulo}</h3>
      <ul>
        {fenomenos.map((f) => {
          const ahora = f.meses.includes(mesHoy + 1);
          return (
            <li key={f.id} className={ahora ? "ahora" : undefined}>
              <b>{f.titulo}</b>{" "}
              <small>
                {rangoMeses(f.meses)}
                {f.pico ? `; mejor en ${rangoMeses(f.pico)}` : ""}
              </small>
              {ahora && <span className="etiqueta-ahora">ahora, en {MESES[mesHoy]}</span>}
              <p>
                {f.descripcion}{" "}
                {f.fuentes.map((u, i) => (
                  <span key={u}>
                    {i > 0 ? " · " : ""}
                    <a href={u} target="_blank" rel="noopener">
                      {f.fuentes.length > 1 ? `Fuente ${i + 1} ↗` : "Fuente ↗"}
                    </a>
                  </span>
                ))}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
