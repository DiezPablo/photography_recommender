// En la ficha: cuánto bajan los lodges cada mes y qué se pierde (lluvia, animales que se ven menos). Solo en los
// parques con tarifas de lodges recogidas a mano (temporadaVerde.ts).
import { INICIALES, MESES } from "@/lib/fechas";
import {
  especiePorTaxon,
  nivelFrecuencia,
  nombreTaxon,
  type NivelFrecuencia,
  type Parque,
} from "@/features/safaris/datos";
import { CONSULTADO, ahorro, indicePrecios } from "@/features/safaris/temporadaVerde";
import { lista } from "@/features/safaris/respuestas";

const ORDEN: NivelFrecuencia["clave"][] = ["raro", "escaso", "ocasional", "frecuente", "muy-frecuente"];

/** Qué cambia entre dos meses en las especies estrella: las que se mantienen y las que bajan de nivel. */
export function cambiosEspecies(p: Parque, barato: number, caro: number) {
  const igual: string[] = [];
  const bajan: string[] = [];
  for (const [t, f] of Object.entries(p.frecuencia ?? {})) {
    const e = especiePorTaxon(Number(t));
    if (!e) continue;
    const a = nivelFrecuencia(f[caro]);
    const b = nivelFrecuencia(f[barato]);
    if (a.clave === "sin-datos" || b.clave === "sin-datos" || ORDEN.indexOf(a.clave) < 2) continue;
    const nombre = nombreTaxon(e).toLowerCase();
    if (ORDEN.indexOf(b.clave) >= ORDEN.indexOf(a.clave)) igual.push(nombre);
    else bajan.push(`${nombre} (de ${a.texto} a ${b.texto})`);
  }
  return { igual, bajan };
}

export default function TemporadaVerde({ p, mesActual }: { p: Parque; mesActual: number }) {
  const ix = indicePrecios(p.id);
  if (!ix) return null;
  const a = ahorro(ix);
  const plano = a.ahorro < 0.05;
  const barato = a.baratos[0];
  const caro = a.caros.includes(7) ? 7 : a.caros[0];
  const lluvia = p.clima?.lluvia_mm;
  const { igual, bajan } = cambiosEspecies(p, barato, caro);
  // T16: si todas las tarifas vienen de la misma web, se dice (no es un sesgo elegido, es lo que hay publicado)
  const empresas = new Set(ix.lodges.map((t) => new URL(t.fuente).hostname.replace(/^www\./, "")));
  const unaEmpresa = ix.lodges.length > 1 && empresas.size === 1 ? [...empresas][0] : null;
  return (
    <div className="temporada-verde">
      <h3>Precio de los lodges</h3>
      <div className="ano-safari" role="table" aria-label="Precio de los lodges por mes">
        <div role="row" className="fila-ano cabecera-ano">
          <span role="rowheader" />
          {INICIALES.map((m, i) => (
            <span role="columnheader" key={i} className={i === mesActual ? "actual" : undefined}>
              {m}
            </span>
          ))}
        </div>
        <div role="row" className="fila-ano">
          <span role="rowheader">Precio</span>
          {ix.meses.map((v, i) => (
            <span
              role="cell"
              key={i}
              className="barra-ano precio"
              title={
                v === null
                  ? `${MESES[i]}: cerrados o sin tarifa`
                  : `${MESES[i]}: ${Math.round(v * 100)} % del mes más caro`
              }
            >
              {v === null ? <em>–</em> : <i style={{ height: `${Math.max(6, v * 100)}%` }} />}
            </span>
          ))}
        </div>
      </div>
      {plano ? (
        <p>
          Sus lodges cobran casi lo mismo todo el año
          {p.pais === "Sudáfrica" ? " (en las reservas privadas de Sudáfrica solo sube en Navidad)" : ""}: no hay
          temporada verde que aprovechar.
        </p>
      ) : (
        <p>
          En <b>{lista(a.baratos.map((m) => MESES[m]))}</b> los lodges cobran hasta un{" "}
          <b>{Math.round(a.ahorro * 100)} % menos</b> que en {lista(a.caros.map((m) => MESES[m]))}.
          {lluvia ? ` Llueve ${lluvia[barato]} mm en ${MESES[barato]} frente a ${lluvia[caro]} en ${MESES[caro]}.` : ""}
          {igual.length ? ` Se siguen viendo igual: ${lista(igual)}.` : ""}
          {bajan.length ? ` Se ven menos: ${lista(bajan)}.` : ""}
          {!p.meses.includes(barato + 1) ? " Está fuera de su mejor época." : ""}
        </p>
      )}
      <details>
        <summary>Las tarifas ({ix.lodges.length})</summary>
        {unaEmpresa && (
          <p className="nota-pie">
            Todas son de la misma empresa ({unaEmpresa}): son las únicas tarifas por mes publicadas que hemos encontrado
            para este parque; los demás lodges las dan solo si se piden. El patrón (cuánto bajan en temporada verde)
            suele ser parecido, pero no el precio.
          </p>
        )}
        <ul className="lista-tarifas">
          {ix.lodges.map((t) => {
            const v = t.precios.filter((x): x is number => x !== null);
            return (
              <li key={t.lodge}>
                <b>{t.lodge}</b>
                {t.zona ? ` (${t.zona})` : ""}: {Math.min(...v).toLocaleString("es-ES")}–
                {Math.max(...v).toLocaleString("es-ES")} {t.moneda} por persona y noche en doble, {t.incluye},{" "}
                {t.temporada}.{" "}
                <a href={t.fuente} target="_blank" rel="noopener">
                  {t.oficial ? "Tarifa del lodge" : "Tarifa de un agente"} ↗
                </a>
              </li>
            );
          })}
        </ul>
        <p className="nota-pie">
          Copiadas a mano de las hojas de tarifas publicadas, consultadas el {CONSULTADO}. Sirven para comparar meses,
          no como presupuesto: pide precio al lodge o a un operador. Sin comisiones.
        </p>
      </details>
    </div>
  );
}
