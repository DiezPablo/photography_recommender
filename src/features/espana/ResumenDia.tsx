// Lo esencial del día en un vistazo: la mejor hora con su tiempo y las especies más probables. El detalle (luz,
// mareas, tiempo por horas, desglose de cada especie) va debajo.
import Link from "next/link";
import { rumbo } from "@/lib/sol";
import Esqueleto from "@/ui/Esqueleto";

export default function ResumenDia({
  mejor,
  tiempoCargado,
  especies,
  lugar,
}: {
  mejor: { hora: string; momento: string; lluvia: number | null; viento: number; direccion: number | null } | null;
  tiempoCargado: boolean;
  especies: { clave: string; nombre: string }[];
  lugar: string;
}) {
  return (
    <section className="resumen-dia" aria-label={`Resumen del día en ${lugar}`}>
      <div>
        <p className="rotulo">Mejor momento</p>
        {mejor ? (
          <p className="dato-grande">
            {mejor.hora} <small>{mejor.momento}</small>
            <br />
            <small>
              {mejor.lluvia ?? 0} % de lluvia · viento{" "}
              {mejor.direccion !== null ? `del ${rumbo(mejor.direccion)} ` : ""}
              {mejor.viento} km/h
            </small>
          </p>
        ) : (
          <p className="nota-pie">
            {tiempoCargado ? "La hora dorada (sin previsión aún para ese día)." : "Consultando el tiempo…"}
          </p>
        )}
      </div>
      <div>
        <p className="rotulo">Lo más probable</p>
        {especies.length ? (
          <p>
            {especies.map((e, i) => (
              <span key={e.clave}>
                {i > 0 ? ", " : ""}
                <Link href={`/espana/especie/${e.clave}`}>{e.nombre}</Link>
              </span>
            ))}
          </p>
        ) : (
          <Esqueleto alto={120} texto="Cargando especies…" />
        )}
      </div>
    </section>
  );
}
