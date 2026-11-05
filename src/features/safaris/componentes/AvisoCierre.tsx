// Aviso de cierre estacional en la ficha (cierres.ts): siempre en «Cuándo ir» y, si está cerrado este mes, arriba.
import { MESES } from "@/lib/fechas";
import { cierreDe, cierreEn, TEXTO_TIPO_CIERRE, textoMesesCierre } from "@/features/safaris/cierres";

export default function AvisoCierre({ id, mesHoy, ahora = false }: { id: string; mesHoy: number; ahora?: boolean }) {
  const c = ahora ? cierreEn(id, mesHoy + 1) : cierreDe(id);
  if (!c) return null;
  return (
    <p className={`aviso-cierre${ahora ? " ahora" : ""}`}>
      <b>
        {ahora
          ? `${TEXTO_TIPO_CIERRE[c.tipo]} en ${MESES[mesHoy]}`
          : `${TEXTO_TIPO_CIERRE[c.tipo]} de ${textoMesesCierre(c, MESES)}`}
        .
      </b>{" "}
      {c.texto}{" "}
      <a href={c.fuente} target="_blank" rel="noopener">
        Fuente ↗
      </a>
    </p>
  );
}
