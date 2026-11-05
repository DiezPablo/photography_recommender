"use client";
// «febrero: buena época» en el resumen del parque, con el mes elegido en la cabecera (sin JavaScript, el de hoy).
import { MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";

export default function EpocaMes({ epoca, mesHoy }: { epoca: number[]; mesHoy: number }) {
  const [mes] = useMesElegido(mesHoy);
  const si = epoca.includes(mes + 1);
  return (
    <small className={si ? "en-temporada" : "fuera-temporada"}>
      {MESES[mes]}: {si ? "buena época" : "fuera de temporada"}
    </small>
  );
}
