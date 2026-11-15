// Resultados de la consulta común (spec 012): /buscar?cuando=…&que=luz|fauna&ccaa=… o &lat=…&lon=…&km=…
// La URL reproduce el resultado; sin JavaScript se ve igual. Dos pestañas, Luz y Fauna, con la misma consulta.
import type { Metadata } from "next";
import Link from "next/link";
import { leerConsulta, urlConsulta } from "@/features/consulta/consulta";
import { urlPlan } from "@/features/plan/plan";
import { MESES } from "@/lib/fechas";
import FormularioConsulta from "@/features/consulta/FormularioConsulta";
import { resolverCuando, resultadosFauna, resultadosLuz } from "@/features/consulta/resultados";
import { fechaCorta, rutaEvento } from "@/features/eventos/datos";
import { NOMBRE_CORTO } from "@/features/spots/modelo";
import Cifra from "@/ui/Cifra";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const c = leerConsulta(await searchParams);
  const w = resolverCuando(c);
  return { title: `${c.que === "luz" ? "Luz" : "Fauna"} ${w.texto}${c.ccaa ? ` en ${c.ccaa}` : ""}` };
}

export default async function Buscar({ searchParams }: Props) {
  const c = leerConsulta(await searchParams);
  const w = resolverCuando(c);
  const donde = c.lat !== null ? `a menos de ${c.km} km de ti` : c.ccaa ? `en ${c.ccaa}` : "en toda España";
  const luz = c.que === "luz" ? resultadosLuz(c, w) : [];
  const fauna = c.que === "fauna" ? resultadosFauna(c, w) : null;
  return (
    <main className="buscar">
      <header className="titular">
        <p className="rotulo">
          {w.prevision ? "Con previsión" : "Lo habitual · sin previsión"} · {donde}
        </p>
        <h1>
          {c.que === "luz" ? "Luz" : "Fauna"} {w.texto}
        </h1>
      </header>
      <FormularioConsulta c={c} />
      <p className="nota-pie enlace-plan">
        <Link
          href={urlPlan({
            cuando: w.fecha ?? MESES[w.mes],
            dias: 3,
            ccaa: c.ccaa,
            lat: c.lat,
            lon: c.lon,
            km: c.km,
          })}
        >
          ¿Varios días? Haz un plan con luz y fauna →
        </Link>
      </p>
      <nav className="pestanas" aria-label="Qué">
        <Link href={urlConsulta(c, { que: "luz" })} aria-current={c.que === "luz" ? "page" : undefined}>
          Luz y cielo
        </Link>
        <Link href={urlConsulta(c, { que: "fauna" })} aria-current={c.que === "fauna" ? "page" : undefined}>
          Fauna
        </Link>
      </nav>

      {c.que === "luz" &&
        (luz.length ? (
          <ol className="lista-cerca-catalogo resultados" aria-label="Spots">
            {luz.map((f) => (
              <li key={f.id}>
                {f.cifra ? (
                  <span className={`cifra cifra-habitual ${f.clase}`}>{f.cifra}</span>
                ) : (
                  <Cifra nota={f.nota} />
                )}
                <span>
                  <Link href={`/luz/spot/${f.id}`}>{f.nombre}</Link>
                  <small>
                    {f.hora ? `${NOMBRE_CORTO[f.momento]} · ${f.hora} · ` : ""}
                    {f.provincia ?? ""}
                    {f.km !== null ? ` · a ${f.km} km` : ""}
                  </small>
                  {f.motivos[0] && <small className="por-que">{f.motivos[0]}</small>}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="vacio">Ningún spot con esa consulta. Prueba con más distancia o en toda España.</p>
        ))}

      {fauna && (
        <>
          {fauna.lugares.length > 0 && (
            <section className="seccion" aria-labelledby="r-lugares">
              <h2 className="rotulo" id="r-lugares">
                Lugares de fauna cerca
              </h2>
              <ol className="lista-cerca-catalogo resultados">
                {fauna.lugares.map((l) => (
                  <li key={l.id}>
                    <span className="punto-cat cat-fauna" aria-hidden />
                    <span>
                      <Link href={`/fauna/lugar/${encodeURIComponent(l.id)}`}>{l.n}</Link>
                      <small>
                        {l.t} · a {l.km.toLocaleString("es-ES")} km
                        {l.especies > 0 ? ` · ${l.especies} especies ese mes` : ""}
                      </small>
                      {l.destacadas.length > 0 && <small>{l.destacadas.join(", ")}</small>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section className="seccion" aria-labelledby="r-fenomenos">
            <h2 className="rotulo" id="r-fenomenos">
              En marcha {w.texto}
            </h2>
            {fauna.fenomenos.length ? (
              <ul className="lista-cerca-catalogo resultados">
                {fauna.fenomenos.map((e) => (
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
            ) : (
              <p className="vacio">Ningún fenómeno de fauna en marcha con esa consulta.</p>
            )}
            {c.lat === null && (
              <p className="nota-pie">
                Para ver los lugares de fauna con lo que se registra cada mes, busca «cerca de mí» o mira el{" "}
                <Link href="/fauna">mapa de fauna</Link>.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
