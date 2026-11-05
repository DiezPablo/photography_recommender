// Resumen al principio de la ficha: las cinco preguntas de quien elige parque (cuándo, qué verá, cuánto cuesta
// entrar, cómo se llega y con quién ir), cada una con su enlace al detalle. Antes había que bajar 10 000 px.
import Link from "next/link";
import { MESES, rangoMeses } from "@/lib/fechas";
import { asociacionDe } from "@/features/safaris/asociaciones";
import { nombreAeropuerto, type ParqueMundo } from "@/features/safaris/modelo";
import { TASAS } from "@/features/safaris/tasas";
import { EDAD_MINIMA, SIN_MALARIA, textoFamilias } from "@/features/safaris/familias";

export interface EspecieResumen {
  nombre: string;
  n: number;
  href?: string;
  /** lo probable que es verla este mes («muy probable»…), en los destacados */
  nivel?: string;
}

export default function ResumenParque({
  id,
  epoca,
  mesHoy,
  especies,
  tasaTexto,
  mundo,
  pais,
  motivo,
}: {
  id: string;
  /** mejor época, meses 1-12 */
  epoca: number[] | null;
  /** 0-11 */
  mesHoy: number;
  especies: EspecieResumen[];
  /** tasa escrita a mano del catálogo, si no hay cifra en tasas.ts */
  tasaTexto?: string | null;
  mundo?: ParqueMundo;
  pais?: string | null;
  /** de dónde sale la época en los parques sin temporada escrita a mano */
  motivo?: string | null;
}) {
  const ahora = epoca?.includes(mesHoy + 1);
  const tasa = TASAS[id];
  const intl = mundo?.llegar.aeropuertos.find((a) => a.internacional) ?? mundo?.llegar.aeropuertos[0];
  const cercano = mundo?.llegar.aeropuertos.find((a) => a !== intl && a.km < (intl?.km ?? 0));
  const operadores = (mundo?.operadores_ciudad?.lista.length ?? 0) + (mundo?.osm?.operadores.length ?? 0);
  const asociacion = asociacionDe(pais);
  return (
    <section className="seccion resumen-parque" aria-label="Resumen" id="resumen">
      <dl>
        <div>
          <dt>Cuándo ir</dt>
          <dd>
            {epoca?.length ? rangoMeses(epoca) : "Sin una estación marcada"}
            {motivo && <small>{motivo}</small>}
            {epoca?.length ? (
              <small className={ahora ? "en-temporada" : "fuera-temporada"}>
                {ahora ? `${MESES[mesHoy]}: buena época` : `${MESES[mesHoy]}: fuera de temporada`}
              </small>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Qué verás</dt>
          <dd>
            {especies.length ? (
              especies.slice(0, 4).map((e, i) => (
                <span key={e.nombre}>
                  {i > 0 && ", "}
                  {e.href ? <Link href={e.href}>{e.nombre}</Link> : e.nombre}
                  {e.nivel && <span className="nivel-mes"> ({e.nivel})</span>}
                </span>
              ))
            ) : (
              <a href="#lo-que-se-ve">Ver especies ↓</a>
            )}
          </dd>
        </div>
        <div>
          <dt>Entrada</dt>
          <dd>
            {tasa ? (
              <>
                {tasa.usdDiaMes
                  ? `${Math.round(Math.min(...Array.from({ length: 12 }, (_, m) => tasa.usdDiaMes!(m + 1))))}-${Math.round(tasa.usdDia)} USD/día`
                  : tasa.usdDia > 0
                    ? `Unos ${Math.round(tasa.usdDia)} USD/día`
                    : (tasa.extras?.[0]?.concepto ?? "Ver tasas")}
                <small>
                  <Link href={`/presupuesto?p=${id}:3`}>Calcular presupuesto →</Link>
                </small>
              </>
            ) : tasaTexto ? (
              <span className="corto">{tasaTexto}</span>
            ) : (
              <small>Consúltala en la web oficial</small>
            )}
          </dd>
        </div>
        <div>
          <dt>Cómo llegar</dt>
          <dd>
            {intl ? (
              <>
                {nombreAeropuerto(intl)} ({intl.iata})<small>a {intl.km} km en línea recta</small>
                {cercano && (
                  <small>
                    El más cercano: {nombreAeropuerto(cercano)} ({cercano.iata}), a {cercano.km} km
                  </small>
                )}
              </>
            ) : (
              "Sin datos"
            )}
            {(mundo?.llegar.n_pistas ?? 0) > 0 && (
              <small>
                {mundo!.llegar.n_pistas === 1 ? "1 pista" : `${mundo!.llegar.n_pistas} pistas`} de avioneta cerca
              </small>
            )}
          </dd>
        </div>
        <div>
          <dt>Con quién</dt>
          <dd>
            {operadores > 0 ? (
              <a href="#empresas">
                {operadores} {operadores === 1 ? "operador" : "operadores"}
                {mundo?.operadores_ciudad ? ` en ${mundo.operadores_ciudad.ciudad}` : ""} ↓
              </a>
            ) : (
              <a href="#empresas">Dónde buscar operadores ↓</a>
            )}
            {asociacion && <small>Con licencia: {asociacion.sigla}</small>}
          </dd>
        </div>
        {textoFamilias(id) && (
          <div>
            <dt>Con niños</dt>
            <dd>
              {SIN_MALARIA.has(id) ? "Sin malaria" : `Desde ${EDAD_MINIMA[id]?.edad} años`}
              <small>{textoFamilias(id)}</small>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
