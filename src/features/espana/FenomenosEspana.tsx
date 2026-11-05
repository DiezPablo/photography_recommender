// Fenómenos de fauna en España (fenomenos.ts) con sus meses, «ahora» si caen en el mes y sus fuentes.
import { MESES, rangoMeses } from "@/lib/fechas";
import type { Fenomeno } from "@/features/espana/fenomenos";
import { horaLocal, horaSol } from "@/lib/sol";

/** Salida y puesta del sol a mediados del mes en el sitio (hora de España). */
function luzDelMes(f: Fenomeno, mes: number): string {
  const fecha = `${new Date().getFullYear()}-${String(mes + 1).padStart(2, "0")}-15`;
  const sale = horaSol(fecha, f.lat, f.lon, -0.833, true);
  const pone = horaSol(fecha, f.lat, f.lon, -0.833, false);
  return sale && pone
    ? `a mediados de ${MESES[mes]}, el sol sale hacia las ${horaLocal(sale, f.lon)} y se pone hacia las ${horaLocal(pone, f.lon)}`
    : "";
}

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
              {f.dormidero && (
                <p className="dormidero">
                  <b>Dormidero:</b> {f.dormidero} {luzDelMes(f, ahora ? mesHoy : (f.pico?.[0] ?? f.meses[0]) - 1)}.
                </p>
              )}
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
