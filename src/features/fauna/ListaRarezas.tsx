// Lista de observaciones notables de eBird (rarezas para la zona o la fecha), con su estado de revisión.
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import type { Rareza } from "@/features/fauna/datos";

const cuando = (f: string) =>
  `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1].slice(0, 3)}${f.length > 10 ? `, ${f.slice(11, 16)}` : ""}`;

export default function ListaRarezas({
  obs,
  claves,
  conDistancia = false,
}: {
  obs: (Rareza & { a?: number })[];
  /** clave de GBIF por nombre científico, para enlazar a «¿Dónde veo…?» */
  claves: Record<string, string | null>;
  conDistancia?: boolean;
}) {
  return (
    <ul className="lista-rarezas">
      {obs.map((o) => {
        const k = claves[o.c];
        return (
          <li key={`${o.c}-${o.sub ?? o.f}-${o.lat}`}>
            <b>{k ? <Link href={`/fauna/especie/${k}`}>{o.n ?? o.c}</Link> : (o.n ?? o.c)}</b> <i>{o.c}</i>
            {o.k ? ` · ${o.k} ej.` : ""}
            <br />
            <small>
              {cuando(o.f)}
              {o.l ? ` · ${o.l}` : ""}
              {conDistancia && o.a !== undefined ? ` · a ${o.a} km` : ""}
              {" · "}
              <span className={o.r ? "rareza-confirmada" : "rareza-sin-revisar"}>
                {o.r ? "confirmada" : "sin revisar"}
              </span>
              {o.sub && (
                <>
                  {" · "}
                  <a href={`https://ebird.org/checklist/${o.sub}`} target="_blank" rel="noopener">
                    lista en eBird ↗
                  </a>
                </>
              )}
            </small>
          </li>
        );
      })}
    </ul>
  );
}
