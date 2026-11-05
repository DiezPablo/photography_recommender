"use client";
// La tabla de probabilidad en el móvil (T40): sin scroll horizontal, un mes cada vez (el elegido en la cabecera),
// con el nivel en texto y en puntos, no solo en color.
import { MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";
import { nivelFrecuencia } from "@/features/safaris/modelo";
import type { FilaFrecuencia } from "./FrecuenciaAvistamientos";

export const PUNTOS: Record<string, string> = {
  "muy-probable": "●●●●",
  probable: "●●●",
  posible: "●●",
  dificil: "●",
  raro: "○",
  "sin-datos": "–",
};

export default function FrecuenciaMes({ filas, mesHoy }: { filas: FilaFrecuencia[]; mesHoy: number }) {
  const [mes, cambiar] = useMesElegido(mesHoy);
  const ordenadas = [...filas].sort((a, b) => (b.meses[mes] ?? -1) - (a.meses[mes] ?? -1));
  return (
    <div className="frecuencia-mes">
      <p className="frecuencia-mes-cab">
        <button type="button" aria-label="Mes anterior" onClick={() => cambiar((mes + 11) % 12)}>
          ‹
        </button>
        <b>{MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1)}</b>
        <button type="button" aria-label="Mes siguiente" onClick={() => cambiar((mes + 1) % 12)}>
          ›
        </button>
      </p>
      <ul>
        {ordenadas.map((f) => {
          const n = nivelFrecuencia(f.meses[mes]);
          return (
            <li key={f.nombre} className={`f-texto-${n.clave}`}>
              <span>{f.href ? <a href={f.href}>{f.nombre}</a> : f.nombre}</span>
              <span className="nivel-puntos">
                <span aria-hidden className="puntos">
                  {PUNTOS[n.clave]}
                </span>{" "}
                {n.texto}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
