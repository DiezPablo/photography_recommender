// «Kenia o Tanzania en agosto»: los dos países lado a lado ese mes, con datos y sin veredicto inventado. Cuántos
// de sus parques están en su mejor época, qué se registra más, la lluvia, dónde está la migración y lo práctico.
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { cargarSafaris, enTemporada, paisesDe, paisesDestacados, type Parque } from "@/features/safaris/datos";
import { MIGRACION } from "@/features/safaris/migracion";
import { POR_TU_CUENTA, practicoDe, TEXTO_POR_TU_CUENTA, type PorTuCuenta } from "@/features/safaris/paises";
import { SIN_MALARIA } from "@/features/safaris/familias";
import { NavMeses, PAREJAS, clavePareja, lista, probables } from "@/features/safaris/respuestas";

interface Lado {
  slug: string;
  nombre: string;
  parques: Parque[];
  enEpoca: Parque[];
  lluvia: number | null;
  especies: string[];
}

function lado(slug: string, mes: number): Lado {
  const nombre = paisesDestacados().get(slug)!;
  const parques = (cargarSafaris()?.parques ?? []).filter((p) => paisesDe(p).includes(nombre));
  const enEpoca = parques.filter((p) => enTemporada(p, mes));
  const lluvias = parques.map((p) => p.clima?.lluvia_mm[mes]).filter((x): x is number => typeof x === "number");
  // lo frecuente en los registros de cualquiera de sus parques, de más parques a menos
  const cuenta = new Map<string, number>();
  for (const p of parques) for (const e of probables(p, mes)) cuenta.set(e, (cuenta.get(e) ?? 0) + 1);
  return {
    slug,
    nombre,
    parques,
    enEpoca,
    lluvia: lluvias.length ? Math.round(lluvias.reduce((a, b) => a + b, 0) / lluvias.length) : null,
    especies: [...cuenta].sort((a, b) => b[1] - a[1]).map(([e]) => e),
  };
}

function porTuCuenta(l: Lado): string {
  // con nombres: «Con guía (lo habitual): Masái Mara» (solo los destacados que tienen el dato)
  const orden: PorTuCuenta[] = ["turismo", "4x4", "guia"];
  const partes = orden
    .map((n) => [n, l.parques.filter((p) => POR_TU_CUENTA[p.id]?.nivel === n).map((p) => p.nombre)] as const)
    .filter(([, ps]) => ps.length > 0)
    .map(([n, ps]) => `${TEXTO_POR_TU_CUENTA[n]}: ${lista(ps)}`);
  return partes.length ? partes.join(". ") : "Lo habitual es con guía.";
}

export default function ComparaPaises({ a, b, mes }: { a: string; b: string; mes: number }) {
  const lados = [lado(a, mes), lado(b, mes)];
  const nombreMes = MESES[mes];
  const migracion = MIGRACION.find((z) => z.mes === mes + 1);
  const conMigracion = migracion ? lados.find((l) => l.parques.some((p) => p.id === migracion.parque)) : undefined;
  const filas: [string, (l: Lado) => React.ReactNode][] = [
    [
      "En su mejor época",
      (l) => (
        <>
          <b>
            {l.enEpoca.length} de {l.parques.length}
          </b>{" "}
          parques destacados
          {l.enEpoca.length > 0 && `: ${lista(l.enEpoca.map((p) => p.nombre))}`}
        </>
      ),
    ],
    [
      "Frecuente en los registros ese mes",
      (l) => (l.especies.length ? lista(l.especies.slice(0, 8)) : "Sin datos de frecuencia"),
    ],
    ["Lluvia media", (l) => (l.lluvia !== null ? `${l.lluvia} mm en el mes (media de sus parques)` : "Sin datos")],
    ["Visado", (l) => practicoDe(l.nombre)?.visado.texto ?? "Consúltalo en Exteriores"],
    ["Malaria", (l) => practicoDe(l.nombre)?.malaria ?? "Consúltalo en Sanidad"],
    [
      "Sin malaria",
      (l) => {
        const sin = l.parques.filter((p) => SIN_MALARIA.has(p.id));
        return sin.length ? lista(sin.map((p) => p.nombre)) : "Ninguno de los destacados";
      },
    ],
    ["Por tu cuenta", porTuCuenta],
    ["Se conduce por la", (l) => practicoDe(l.nombre)?.conduce ?? "–"],
  ];
  const [x, y] = lados;
  return (
    <main className="calendario safaris respuesta">
      <header className="titular">
        <p className="rotulo">
          <Link href="/safaris">Safaris</Link> · <Link href="/safari-en">Comparativas</Link>
        </p>
        <h1>
          {x.nombre} o {y.nombre} en {nombreMes}
        </h1>
        <p className="entradilla">
          En {nombreMes}, {x.nombre} tiene {x.enEpoca.length} de sus {x.parques.length} parques destacados en su mejor
          época y {y.nombre}, {y.enEpoca.length} de {y.parques.length}.
          {conMigracion && migracion ? ` La gran migración está en ${conMigracion.nombre}: ${migracion.zona}.` : ""}
          {x.lluvia !== null && y.lluvia !== null && Math.abs(x.lluvia - y.lluvia) >= 30
            ? ` Llueve más en ${x.lluvia > y.lluvia ? x.nombre : y.nombre} (${Math.max(x.lluvia, y.lluvia)} mm frente a ${Math.min(x.lluvia, y.lluvia)}).`
            : ""}
        </p>
      </header>

      <section className="seccion">
        <h2 className="rotulo">Lado a lado</h2>
        <div className="tabla-desliza">
          <table className="tabla-comparar tabla-paises-mes">
            <thead>
              <tr>
                <td />
                {lados.map((l) => (
                  <th key={l.slug} scope="col">
                    <Link href={`/safari-en/${l.slug}`}>{l.nombre}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map(([titulo, celda]) => (
                <tr key={titulo}>
                  <th scope="row">{titulo}</th>
                  {lados.map((l) => (
                    <td key={l.slug}>{celda(l)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota-pie">
          Mejor época: la recomendada para cada parque. Frecuente: especies con al menos un 2 % (20 ‰) de las fotos de
          su grupo ese mes en iNaturalist. Lluvia: climatología de la NASA (POWER). Visados y salud revisados a mano:
          confírmalos antes de viajar.
        </p>
      </section>

      {lados.map((l) => (
        <section className="seccion" key={l.slug}>
          <h2 className="rotulo">
            {l.nombre} en {nombreMes}
          </h2>
          <ul className="lista-respuesta compacta">
            {l.parques.map((p) => {
              const ver = probables(p, mes);
              return (
                <li key={p.id}>
                  <Link href={`/parque/${p.id}`}>{p.nombre}</Link>:{" "}
                  {enTemporada(p, mes) ? "en su mejor época" : "fuera de su mejor época"}
                  {ver.length ? `; frecuentes ${lista(ver.slice(0, 4))}` : ""}.
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="seccion no-imprimir">
        <h2 className="rotulo">Organízalo</h2>
        <p className="enlaces">
          {lados.map((l) => (
            <Link key={l.slug} href={`/planificar?pais=${encodeURIComponent(l.nombre)}&mes=${mes}`}>
              Planificar {l.nombre} en {nombreMes} →
            </Link>
          ))}
          <Link href={`/safari-en/${nombreMes}`}>Todo el mundo en {nombreMes} →</Link>
        </p>
        <nav className="nav-respuestas" aria-label="Otros meses">
          {MESES.map((m, i) => (
            <Link key={m} href={`/safari-en/${clavePareja(a, b, i)}`} aria-current={i === mes ? "page" : undefined}>
              {m}
            </Link>
          ))}
        </nav>
        <nav className="nav-respuestas" aria-label="Otras comparativas">
          {PAREJAS.filter(([p, q]) => p !== a || q !== b).map(([p, q]) => (
            <Link key={`${p}-${q}`} href={`/safari-en/${clavePareja(p, q, mes)}`}>
              {paisesDestacados().get(p)} o {paisesDestacados().get(q)}
            </Link>
          ))}
        </nav>
        <NavMeses actual={-1} />
      </section>
    </main>
  );
}
