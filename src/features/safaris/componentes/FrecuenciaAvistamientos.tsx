// Qué probabilidad hay de ver cada especie estrella, mes a mes: frecuencia en las fotos de los visitantes
// (iNaturalist) frente a las de su grupo, en cinco niveles. La pregunta número uno de los foros.
import Link from "next/link";
import { INICIALES, MESES } from "@/lib/fechas";
import { confianza, nivelFrecuencia } from "@/features/safaris/modelo";

export interface FilaFrecuencia {
  nombre: string;
  href?: string;
  meses: (number | null)[];
  /** fotos de su grupo cada mes (tamaño de muestra) */
  muestra?: number[];
}

// un valor de cada nivel, para la leyenda
const LEYENDA = [50, 20, 5, 1, 0].map(nivelFrecuencia);

export default function FrecuenciaAvistamientos({
  filas,
  mesHoy,
  unidad = "fotos",
  titulo = "Qué probabilidad hay de verlos, mes a mes",
}: {
  filas: FilaFrecuencia[];
  mesHoy: number;
  /** qué cuenta la muestra: fotos (iNaturalist) u observaciones (GBIF) */
  unidad?: string;
  titulo?: string;
}) {
  const idTitulo = `frecuencia-${titulo
    .normalize("NFD")
    .replace(/[^a-zA-Z]+/g, "-")
    .toLowerCase()}`;
  if (!filas.length) return null;
  const media = (f: FilaFrecuencia) => f.meses.reduce<number>((a, b) => a + (b ?? 0), 0);
  const ordenadas = [...filas].sort((a, b) => media(b) - media(a));
  // la muestra de la fila con más datos (casi siempre la de los mamíferos)
  const base = filas.map((f) => f.muestra).find((m) => m?.some((x) => x > 0));
  const hoy = confianza(base?.[mesHoy]);
  return (
    <section className="seccion frecuencia" aria-labelledby={idTitulo}>
      <h2 className="rotulo" id={idTitulo}>
        {titulo}
      </h2>
      <div className="tabla-desliza">
        <table className="tabla-frecuencia">
          <thead>
            <tr>
              <td />
              {INICIALES.map((l, i) => (
                <th key={i} scope="col" className={i === mesHoy ? "mes-actual" : undefined} title={MESES[i]}>
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((f) => (
              <tr key={f.nombre}>
                <th scope="row">{f.href ? <Link href={f.href}>{f.nombre}</Link> : f.nombre}</th>
                {f.meses.map((v, i) => {
                  const n = nivelFrecuencia(v);
                  const c = confianza(f.muestra?.[i]);
                  return (
                    <td
                      key={i}
                      className={`f-${n.clave}${i === mesHoy ? " mes-actual" : ""}${c?.clave === "baja" ? " confianza-baja" : ""}`}
                      title={`${f.nombre} en ${MESES[i]}: ${n.texto}${c ? ` (${c.texto}: ${f.muestra![i].toLocaleString("es-ES")} ${unidad} del grupo)` : ""}`}
                    >
                      <span className="sr">{`${MESES[i]}: ${n.texto}`}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {base && (
              <tr className="fila-muestra">
                <th scope="row">{unidad[0].toUpperCase() + unidad.slice(1)} del grupo</th>
                {base.map((n, i) => (
                  <td key={i} className={i === mesHoy ? "mes-actual" : undefined} title={`${MESES[i]}: ${n} ${unidad}`}>
                    {n >= 1000 ? `${Math.round(n / 1000)}k` : n}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="leyenda-frecuencia">
        {LEYENDA.map((n) => (
          <span key={n.clave}>
            <i className={`f-${n.clave}`} /> {n.texto}
          </span>
        ))}
        {base && (
          <span>
            <i className="f-posible confianza-baja" /> pocos datos (confianza baja)
          </span>
        )}
      </p>
      {hoy && base && (
        <p className="confianza-hoy">
          En {MESES[mesHoy]}, {hoy.texto}: {base[mesHoy].toLocaleString("es-ES")} {unidad} del grupo con los meses
          vecinos.
        </p>
      )}
      {unidad === "fotos" && (
        <p className="nota-pie">
          Cuántas de las fotos de su grupo (mamíferos, aves…) que suben los visitantes a iNaturalist cada mes son de esa
          especie, sumando los meses vecinos. Confianza según cuántas fotos hay detrás: alta desde 300, media desde 100,
          baja desde 30; con menos, no se da nivel. Corrige que en temporada alta vaya más gente, pero no es una
          probabilidad exacta: los animales vistosos se fotografían más y el resultado depende de tu guía y de la
          suerte.
        </p>
      )}
    </section>
  );
}
