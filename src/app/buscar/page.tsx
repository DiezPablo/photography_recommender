// Resultados del buscador de la cabecera: la página a la que lleva el formulario sin JavaScript, o al pulsar
// Intro sin elegir nada.
import type { Metadata } from "next";
import Link from "next/link";
import { entradasBusqueda } from "@/features/safaris/datos";
import { buscar, TIPO_TEXTO } from "@/lib/busqueda";

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function PaginaBuscar({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const resultados = q ? buscar(entradasBusqueda(), q, 40) : [];
  return (
    <main className="calendario safaris">
      <header className="titular titular-compacto">
        <h1>{q ? `Resultados de «${q}»` : "Buscar"}</h1>
      </header>
      <form action="/buscar" className="seccion filtros-fauna" role="search">
        <label className="campo">
          <span className="rotulo">Parque, animal o país</span>
          <input type="search" name="q" defaultValue={q} placeholder="Serengeti, guepardo, Botsuana…" />
        </label>
      </form>
      {q && !resultados.length && (
        <p>
          Nada con «{q}». Prueba con otro nombre (también en inglés o el científico) o{" "}
          <Link href="/">explora todos los destinos</Link>.
        </p>
      )}
      {resultados.length > 0 && (
        <ul className="lista-lugares">
          {resultados.map((r) => (
            <li key={r.href}>
              <Link href={r.href}>{r.t}</Link>{" "}
              <small>
                {TIPO_TEXTO[r.tipo]}
                {r.s ? ` · ${r.s}` : ""}
                {r.d ? ` · ${r.d}` : ""}
              </small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
