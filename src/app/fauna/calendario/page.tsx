import type { Metadata } from "next";
import Link from "next/link";
import { activoEnMes, cargarEventos, fechaCorta, MESES, mesDe, rutaEvento } from "@/features/eventos/datos";
import { fenomenosFauna } from "@/features/fauna/eventoFauna";

export const metadata: Metadata = {
  title: "Calendario de fauna",
  description: "Qué pasa con la fauna en España cada mes: berrea, grullas, celos, invernadas y pasos migratorios.",
};

export default function CalendarioFauna() {
  const eventos = cargarEventos();
  const fauna = (eventos?.naturaleza ?? []).filter((e) => e.categoria === "fauna");
  const mesHoy = Number((eventos?.desde ?? new Date().toISOString()).slice(5, 7)) - 1;
  const fenomenos = fenomenosFauna();
  return (
    <main className="calendario calendario-fauna">
      <header className="titular">
        <p className="rotulo">Fauna · calendario</p>
        <h1>Qué pasa con la fauna cada mes</h1>
        <p className="entradilla">
          Celos, invernadas y pasos migratorios con fecha y lugar. Las fechas son las habituales y cambian cada año con
          el tiempo; las especies amenazadas, solo por zona.
        </p>
      </header>
      {fenomenos.length > 0 && (
        <p className="enlace-fenomeno">
          Con varios lugares para elegir:{" "}
          {fenomenos.map((f, i) => (
            <span key={f.id}>
              {i > 0 ? " · " : ""}
              <Link href={`/fauna/evento/${f.id}`}>
                {f.nombre} ({f.eventos.length})
              </Link>
            </span>
          ))}
        </p>
      )}
      {fauna.length === 0 && <p className="vacio">El calendario aún no está disponible.</p>}
      {MESES.map((nombre, m) => {
        // el mes en curso primero: el calendario empieza por lo que se puede ir a ver ya
        const mes = (mesHoy + m) % 12;
        const activos = fauna
          .filter((e) => activoEnMes(e, mes))
          .sort(
            (a, b) => Number(mesDe(b.pico) === mes) - Number(mesDe(a.pico) === mes) || a.nombre.localeCompare(b.nombre),
          );
        if (!activos.length) return null;
        return (
          <section key={mes} className="seccion mes-fauna" id={MESES[mes]} aria-labelledby={`t-${MESES[mes]}`}>
            <h2 className="rotulo" id={`t-${MESES[mes]}`}>
              {MESES[mes]}
              {mes === mesHoy ? " · ahora" : ""}
            </h2>
            <ul className="lista-cercanos">
              {activos.map((e) => (
                <li key={e.id}>
                  <Link href={rutaEvento(e)}>{e.nombre}</Link>
                  <small>
                    {e.provincia ? `${e.provincia} · ` : ""}del {fechaCorta(e.desde)} al {fechaCorta(e.hasta)}
                    {mesDe(e.pico) === mes ? " · en su mejor momento" : ""}
                  </small>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
