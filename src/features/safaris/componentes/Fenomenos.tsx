// Calendario de fenómenos de un parque (eventos.ts): lo que pasa a lo largo del año, con su fuente.
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { eventosDe, type Evento } from "@/features/safaris/eventos";
import { rango } from "@/features/safaris/respuestas";

export function EnlaceFuente({ e }: { e: Evento }) {
  return e.fuente.startsWith("/") ? (
    <Link href={e.fuente}>Más →</Link>
  ) : (
    <a href={e.fuente} target="_blank" rel="noopener">
      Fuente ↗
    </a>
  );
}

export function textoMeses(e: Evento): string {
  return `${rango(e.meses)}${e.pico ? `; mejor en ${rango(e.pico)}` : ""}`;
}

export default function Fenomenos({ parque, mesHoy }: { parque: string; mesHoy: number }) {
  const eventos = eventosDe(parque);
  if (!eventos.length) return null;
  return (
    <div className="fenomenos">
      <h3>Qué pasa a lo largo del año</h3>
      <ul>
        {eventos.map((e) => (
          <li key={e.id} className={e.meses.includes(mesHoy + 1) ? "ahora" : undefined}>
            <b>{e.titulo}</b> <small>{textoMeses(e)}</small>
            {e.meses.includes(mesHoy + 1) && <span className="etiqueta-ahora">ahora, en {MESES[mesHoy]}</span>}
            <p>
              {e.descripcion} <EnlaceFuente e={e} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
