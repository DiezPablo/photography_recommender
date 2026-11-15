// Portada de Rasante (spec 004, prototipo): responde «¿cuándo tienes tiempo?». Arriba, el mejor plan de hoy con su
// foto y su veredicto; debajo, tres momentos (hoy, este finde, más adelante) con lo de Luz y lo de Fauna de cada
// uno, y lo que está en temporada. Es la pantalla 1 de docs/producto/modos.md; la consulta común en la URL llega con
// el formulario de la consulta común (spec 012), que lleva a /buscar. Los enlaces antiguos a la carta de fauna, que vivía aquí con sus parámetros, se redirigen en
// next.config.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { filasHabituales, rutaHabitual } from "@/features/clima/habitual";
import FormularioConsulta from "@/features/consulta/FormularioConsulta";
import Temporada from "@/features/eventos/componentes/Temporada";
import { activoEnMes, cargarEventos, rutaEvento } from "@/features/eventos/datos";
import { rutaDia } from "@/features/spots/componentes/VistaDia";
import { cargar, etiquetaDia, miniatura, NOMBRE_CORTO } from "@/features/spots/datos";
import { filasRanking } from "@/features/spots/ranking";
import type { FilaRanking } from "@/features/spots/tipos";
import { MESES } from "@/lib/fechas";
import Cifra from "@/ui/Cifra";

export const metadata: Metadata = {
  title: { absolute: "Rasante · dónde ir a fotografiar naturaleza en España" },
  description:
    "Dime cuándo tienes tiempo y te digo dónde ir: la mejor luz de hoy y del finde, lo que suele ir bien cada mes y dónde ver fauna en España según la época.",
};

/** El primer sábado o domingo de la previsión (índice del día), si cae dentro. */
function diaFinde(fechas: string[]): number | null {
  const i = fechas.findIndex((f, k) => k > 0 && [6, 0].includes(new Date(`${f}T12:00:00Z`).getUTCDay()));
  return i >= 0 ? i : null;
}

function Plan({ f, cuando }: { f: FilaRanking | undefined; cuando: string }) {
  if (!f) return <p className="nota-pie">Aún no hay previsión publicada.</p>;
  return (
    <p className="plan-momento">
      <Cifra nota={f.nota} />
      <span>
        <Link href={`/luz/spot/${f.id}`}>{f.nombre}</Link>
        <small>
          {NOMBRE_CORTO[f.momento]} {cuando} · {f.hora}
          {f.provincia ? ` · ${f.provincia}` : ""}
        </small>
      </span>
    </p>
  );
}

export default function Portada() {
  const { informe, spots } = cargar();
  const fechas = informe?.fechas ?? [];
  const hoy = fechas[0] ?? new Date().toISOString().slice(0, 10);
  const mes = Number(hoy.slice(5, 7)) - 1;
  const mejor = filasRanking(0, "todos")[0];
  // «Hoy» da el mejor atardecer y la mejor noche, sin repetir el de la foto
  const deHoy = (["atardecer", "astro"] as const)
    .map((m) => filasRanking(0, m).find((f) => f.id !== mejor?.id))
    .filter((f): f is FilaRanking => !!f);
  const foto = mejor ? (spots.find((s) => s.id === mejor.id)?.descubierto?.galeria?.[0] ?? null) : null;
  const dFinde = diaFinde(fechas);
  const finde = dFinde !== null ? filasRanking(dFinde, "todos")[0] : undefined;
  const habitual = filasHabituales((mes + 1) % 12, "atardecer")[0];
  const faunaMes = (cargarEventos()?.naturaleza ?? [])
    .filter((e) => e.categoria === "fauna" && activoEnMes(e, mes))
    .slice(0, 3);
  return (
    <main className="portada-rasante">
      <header className="portada-cabecera">
        <h1>¿Cuándo tienes tiempo?</h1>
        <p className="entradilla">Te decimos dónde ir a fotografiar en España: luz, cielo y fauna.</p>
        <FormularioConsulta />
      </header>

      {mejor && (
        <Link href={`/luz/spot/${mejor.id}`} className="portada-hoy" aria-label={`Lo mejor de hoy: ${mejor.nombre}`}>
          {foto?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={miniatura(foto.url, 960) ?? foto.url} alt="" fetchPriority="high" />
          )}
          <span className="portada-hoy-texto">
            <span className="rotulo">
              Lo mejor de hoy · {NOMBRE_CORTO[mejor.momento].toLowerCase()} · {mejor.hora}
            </span>
            <span className="portada-hoy-nombre">{mejor.nombre}</span>
            <span className="portada-hoy-veredicto">
              <Cifra nota={mejor.nota} /> {mejor.motivos[0] ?? ""}
            </span>
          </span>
          {foto?.autor && <small className="portada-hoy-credito">Foto: {foto.autor} (Wikimedia Commons)</small>}
        </Link>
      )}

      <div className="momentos">
        <section className="momento" aria-labelledby="m-hoy">
          <h2 id="m-hoy">Hoy</h2>
          {deHoy.length ? (
            deHoy.map((f) => <Plan key={f.id} f={f} cuando="de hoy" />)
          ) : (
            <Plan f={undefined} cuando="" />
          )}
          <ul className="momento-enlaces">
            <li>
              <Link href="/luz">Todos los spots de hoy</Link>
            </li>
            <li>
              <Link href="/fauna?modo=aqui">Qué fauna veo cerca de mí</Link>
            </li>
          </ul>
        </section>
        <section className="momento" aria-labelledby="m-finde">
          <h2 id="m-finde">Este finde</h2>
          {dFinde !== null ? (
            <Plan f={finde} cuando={`del ${etiquetaDia(fechas[dFinde], dFinde).largo}`} />
          ) : (
            <p className="nota-pie">El finde aún no entra en la previsión.</p>
          )}
          <ul className="momento-enlaces">
            {dFinde !== null && (
              <li>
                <Link href={rutaDia(dFinde, "todos")}>La luz del finde, spot a spot</Link>
              </li>
            )}
            <li>
              <Link href="/fauna?modo=finde">Los mejores sitios de fauna para el finde</Link>
            </li>
          </ul>
        </section>
        <section className="momento" aria-labelledby="m-luego">
          <h2 id="m-luego">Más adelante</h2>
          {habitual ? (
            <p className="plan-momento">
              <span className="cifra cifra-habitual">{habitual.cifra}</span>
              <span>
                <Link href={`/luz/spot/${habitual.id}`}>{habitual.nombre}</Link>
                <small>
                  atardeceres buenos en {MESES[(mes + 1) % 12]}
                  {habitual.provincia ? ` · ${habitual.provincia}` : ""}
                </small>
              </span>
            </p>
          ) : null}
          <ul className="momento-enlaces">
            <li>
              <Link href={rutaHabitual((mes + 1) % 12, "atardecer")}>Lo habitual de cada mes, sin previsión</Link>
            </li>
            {faunaMes.map((e) => (
              <li key={e.id}>
                <Link href={rutaEvento(e)}>{e.nombre}</Link>
              </li>
            ))}
            <li>
              <Link href="/fauna/calendario">Calendario de fauna</Link>
            </li>
          </ul>
        </section>
      </div>

      <Temporada hoy={hoy} />
    </main>
  );
}
