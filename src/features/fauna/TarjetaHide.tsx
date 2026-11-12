// Un hide o salida guiada: operador, zona, especies, temporada, tipo, precio y enlace directo (sin comisiones).
import Link from "next/link";
import { rangoMeses } from "@/lib/fechas";
import { TEXTO_TIPO, type Hide } from "@/features/fauna/hides";

export default function TarjetaHide({
  h,
  km,
  claves = {},
}: {
  h: Hide;
  km?: number;
  /** clave de GBIF por nombre científico, para enlazar a «¿Dónde veo…?» */
  claves?: Record<string, string | null>;
}) {
  return (
    <li className="tarjeta-hide">
      <b>
        <a href={h.web} target="_blank" rel="noopener">
          {h.nombre} ↗
        </a>
      </b>
      <br />
      <small>
        {h.clase === "hide" ? "Hide" : "Salida guiada"} · {TEXTO_TIPO[h.tipo]} · {h.operador} · {h.zona}
        {km !== undefined ? ` · a ${km} km` : ""}
      </small>
      {h.especies.length > 0 && (
        <p className="especies-hide">
          {h.especies.map((e, i) => {
            const k = claves[e.c];
            return (
              <span key={e.c}>
                {i > 0 ? ", " : ""}
                {k ? <Link href={`/fauna/especie/${k}`}>{e.n}</Link> : e.n}
              </span>
            );
          })}
        </p>
      )}
      <small>
        {h.meses.length ? `Temporada: ${rangoMeses(h.meses)}` : "Todo el año o sin temporada indicada"}
        {h.precio ? ` · ${h.precio}` : ""}
        {h.plazas ? ` · ${h.plazas} plazas` : ""}
      </small>
      {h.notas && <p className="nota-pie">{h.notas}</p>}
    </li>
  );
}
