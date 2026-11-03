// Fauna en España: un lugar y un día → luz, tiempo, mejores franjas y especies probables (docs/especificacion-fauna.md).
import type { Metadata } from "next";
import Link from "next/link";
import PlanificadorEspana from "@/features/espana/PlanificadorEspana";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: "Fauna en España: luz, tiempo y especies",
  description:
    "Para un lugar y un día: horas dorada y azul, previsión con nubes por capas (o climatología) y qué especies es probable ver ese mes.",
};

export const dynamic = "force-dynamic";

export default function PaginaEspana() {
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · España
        </p>
        <h1>Fauna en España</h1>
        <p className="entradilla">
          Un lugar y un día: la luz para fotografiar, el tiempo por horas con las nubes por capas y qué especies es
          probable ver ese mes, con dos notas (verla y fotografiarla) y de dónde sale cada una.
        </p>
      </header>
      <PlanificadorEspana hoy={fechaLocal(new Date())} />
      <p className="nota-pie">
        Luz: posición del sol calculada aquí. Tiempo: Open-Meteo (previsión hasta 16 días; más allá, el archivo ERA5 de
        los diez últimos años). Especies: GBIF por cuadrícula europea de 10 km, como frecuencia relativa en su grupo (no
        es una probabilidad: refleja también dónde y cuándo va la gente). Las especies sensibles solo por zonas.
      </p>
    </main>
  );
}
