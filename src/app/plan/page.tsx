// Plan de varios días (spec 016): /plan?ccaa=…&cuando=octubre|AAAA-MM-DD&dias=3 (o &lat=…&lon=…&km=…).
// Por día, una zona con su atardecer, amanecer, fauna y, si toca, noche; y para todo el plan, lo que está en
// temporada y el cielo. La URL reproduce el plan; sin JavaScript se ve igual.
import type { Metadata } from "next";
import Link from "next/link";
import { rutaHabitual } from "@/features/clima/habitual";
import { fechaCorta, rutaCalendario, rutaEvento } from "@/features/eventos/datos";
import { armarPlan, type DiaPlan } from "@/features/plan/datos";
import FormularioPlan from "@/features/plan/FormularioPlan";
import { leerPlan } from "@/features/plan/plan";
import type { FilaRanking } from "@/features/spots/tipos";
import { MESES } from "@/lib/fechas";
import Cifra from "@/ui/Cifra";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const cuandoTexto = (cuando: string) => (/^\d{4}-/.test(cuando) ? `desde el ${fechaCorta(cuando)}` : `en ${cuando}`);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = leerPlan(await searchParams);
  return { title: `Plan de ${p.dias} días ${cuandoTexto(p.cuando)}${p.ccaa ? ` en ${p.ccaa}` : ""}` };
}

function Spot({ f, que, km }: { f: FilaRanking; que: string; km?: number }) {
  return (
    <li className="item-plan">
      {f.cifra ? <span className={`cifra cifra-habitual ${f.clase}`}>{f.cifra}</span> : <Cifra nota={f.nota} />}
      <span>
        <b className="que-plan">{que}</b> <Link href={`/luz/spot/${f.id}`}>{f.nombre}</Link>
        <small>
          {f.hora ? `${f.hora} · ` : ""}
          {f.provincia ?? ""}
          {km ? ` · a ${km} km` : ""}
        </small>
        {f.motivos[0] && <small className="por-que">{f.motivos[0]}</small>}
      </span>
    </li>
  );
}

function Dia({ d }: { d: DiaPlan }) {
  return (
    <article className="dia-plan" aria-labelledby={`dia-${d.n}`}>
      <h2 id={`dia-${d.n}`}>
        {d.etiqueta}
        {d.zona && <small> · {d.zona}</small>}
      </h2>
      <ol className="lista-cerca-catalogo resultados">
        {d.amanecer && <Spot f={d.amanecer} que="Amanecer" km={d.atardecer ? d.amanecer.km : undefined} />}
        {d.fauna && (
          <li className="item-plan">
            <span className="punto-cat cat-fauna" aria-hidden />
            <span>
              <b className="que-plan">Fauna</b>{" "}
              <Link href={`/fauna/lugar/${encodeURIComponent(d.fauna.id)}`}>{d.fauna.n}</Link>
              <small>
                {d.fauna.t} · {d.fauna.km === 0 ? "en la zona" : `a ${d.fauna.km.toLocaleString("es-ES")} km`}
                {d.fauna.especies > 0 ? ` · ${d.fauna.especies} especies ese mes` : ""}
              </small>
              {d.fauna.destacadas.length > 0 && <small>{d.fauna.destacadas.join(", ")}</small>}
            </span>
          </li>
        )}
        {d.fenomeno && (
          <li className="item-plan">
            <span className="punto-cat cat-fauna" aria-hidden />
            <span>
              <b className="que-plan">En temporada</b> <Link href={rutaEvento(d.fenomeno)}>{d.fenomeno.nombre}</Link>
              <small>
                {d.fenomeno.lugar} · a {d.fenomeno.km} km · del {fechaCorta(d.fenomeno.desde)} al{" "}
                {fechaCorta(d.fenomeno.hasta)}
              </small>
            </span>
          </li>
        )}
        {d.atardecer && <Spot f={d.atardecer} que="Atardecer" />}
        {d.noche && (
          <>
            <Spot f={d.noche} que="Noche" km={d.noche.km} />
            <li className="nota-plan">{d.noche.motivo}</li>
          </>
        )}
      </ol>
    </article>
  );
}

export default async function PaginaPlan({ searchParams }: Props) {
  const p = leerPlan(await searchParams);
  const r = armarPlan(p);
  const donde = p.lat !== null ? `a menos de ${p.km} km de ti` : p.ccaa ? `en ${p.ccaa}` : "en toda España";
  const hayCielo = r.cielo.meteoros.length + r.cielo.lunaNueva.length + r.cielo.viaLactea.length > 0;
  return (
    <main className="buscar plan">
      <header className="titular">
        <p className="rotulo">
          {r.conPrevision ? "Con previsión los primeros días" : "Lo habitual · sin previsión"} · {donde}
        </p>
        <h1>
          {p.dias} días {cuandoTexto(p.cuando)}
        </h1>
        <p className="entradilla">
          Cada día, una zona: su mejor atardecer y, a menos de una hora, un amanecer, un lugar de fauna y lo que esté en
          temporada.
        </p>
      </header>
      <FormularioPlan p={p} />

      {r.dias.length ? (
        r.dias.map((d) => <Dia key={d.n} d={d} />)
      ) : (
        <p className="vacio">Ningún spot con ese plan. Prueba con más distancia o en toda España.</p>
      )}

      {r.temporada.length > 0 && (
        <section className="seccion" aria-labelledby="p-temporada">
          <h2 className="rotulo" id="p-temporada">
            En temporada {donde}
          </h2>
          <ul className="lista-cerca-catalogo resultados">
            {r.temporada.map((e) => (
              <li key={e.id}>
                <span className="punto-cat cat-fauna" aria-hidden />
                <span>
                  <Link href={rutaEvento(e)}>{e.nombre}</Link>
                  <small>
                    {e.provincia ?? ""} · del {fechaCorta(e.desde)} al {fechaCorta(e.hasta)}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hayCielo && (
        <section className="seccion" aria-labelledby="p-cielo">
          <h2 className="rotulo" id="p-cielo">
            El cielo {/^\d{4}-/.test(p.cuando) ? "esos días" : `en ${MESES[r.mes]}`}
          </h2>
          <ul className="momento-enlaces">
            {r.cielo.lunaNueva.map((f) => (
              <li key={f}>Luna nueva el {fechaCorta(f)}</li>
            ))}
            {r.cielo.viaLactea.map((v) => (
              <li key={v.desde}>
                Vía Láctea sin luna del {fechaCorta(v.desde)} al {fechaCorta(v.hasta)}
              </li>
            ))}
            {r.cielo.meteoros.map((m) => (
              <li key={m.id}>
                {m.nombre}: máximo la noche del {fechaCorta(m.noche)} (luna al {m.luna.iluminacion} %)
              </li>
            ))}
          </ul>
          <p className="nota-pie">
            <Link href={rutaHabitual(r.mes, "noche")}>Dónde suele estar despejado de noche en {MESES[r.mes]}</Link> ·{" "}
            <Link href={rutaCalendario("paisaje", r.mes)}>Calendario del cielo</Link>
          </p>
        </section>
      )}

      <p className="nota-pie">
        {r.conPrevision
          ? "Los días dentro de la previsión (cinco) salen del ranking de ese día, con amaneceres y noches solo si su nota es al menos regular; los demás, de lo habitual del mes."
          : "Sin previsión: atardeceres y amaneceres que suelen salir bien ese mes (clima de diez años y cómo es cada sitio). Vuelve unos días antes para verlo con previsión."}{" "}
        <Link href="/luz/metodo">Cómo se calcula</Link>
      </p>
    </main>
  );
}
