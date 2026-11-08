// Temporada verde: cuánto se ahorra en cada parque fuera de la temporada alta y qué se pierde a cambio.
import type { Metadata } from "next";
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { getParque } from "@/features/safaris/datos";
import { CONSULTADO, TARIFAS, ahorro, indicePrecios } from "@/features/safaris/temporadaVerde";
import { cambiosEspecies } from "@/features/safaris/componentes/TemporadaVerde";
import { lista } from "@/features/safaris/respuestas";

export const metadata: Metadata = {
  title: "Temporada verde: cuánto se ahorra y qué se pierde",
  description:
    "Cuánto bajan los lodges de safari fuera de temporada en el Masái Mara, el Serengeti, el Okavango, Etosha y más, con la lluvia y los animales que se siguen viendo.",
};

export default function PaginaTemporadaVerde() {
  const ids = [...new Set(TARIFAS.map((t) => t.parque))];
  const filas = ids
    .map((id) => ({ p: getParque(id), ix: indicePrecios(id)! }))
    .filter((x) => x.p)
    .map((x) => ({ ...x, a: ahorro(x.ix) }))
    .sort((x, y) => y.a.ahorro - x.a.ahorro);
  return (
    <main className="calendario safaris respuesta">
      <header className="titular">
        <p className="rotulo">
          <Link href="/safaris">Safaris</Link> · Cuándo ir
        </p>
        <h1>Temporada verde: cuánto se ahorra y qué se pierde</h1>
        <p className="entradilla">
          Fuera de la temporada alta los lodges bajan precios, a cambio de más lluvia, hierba alta y algunos animales
          más difíciles. Aquí está cuánto bajan en {filas.length} parques, según las tarifas que publican{" "}
          {TARIFAS.length} lodges, y qué se sigue viendo esos meses.
        </p>
      </header>
      <section className="seccion">
        <div className="tabla-desliza">
          <table className="tabla-comparar tabla-verde">
            <thead>
              <tr>
                <th scope="col">Parque</th>
                <th scope="col">Ahorro</th>
                <th scope="col">Meses más baratos</th>
                <th scope="col">Lluvia</th>
                <th scope="col">Qué cambia</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ p, a }) => {
                const barato = a.baratos[0];
                const caro = a.caros.includes(7) ? 7 : a.caros[0];
                const ll = p!.clima?.lluvia_mm;
                const { igual, bajan } = cambiosEspecies(p!, barato, caro);
                const plano = a.ahorro < 0.05;
                return (
                  <tr key={p!.id}>
                    <th scope="row">
                      <Link href={`/parque/${p!.id}#cuando`}>{p!.nombre}</Link>
                      <small>{p!.pais}</small>
                    </th>
                    <td className="ahorro">{plano ? "casi nada" : `hasta ${Math.round(a.ahorro * 100)} %`}</td>
                    <td>{plano ? "–" : lista(a.baratos.map((m) => MESES[m]))}</td>
                    <td>{ll && !plano ? `${ll[barato]} mm (${ll[caro]} en ${MESES[caro]})` : "–"}</td>
                    <td>
                      {plano
                        ? "Mismo precio todo el año"
                        : [
                            igual.length ? `Igual: ${lista(igual.slice(0, 4))}` : "",
                            bajan.length ? `Menos: ${lista(bajan.slice(0, 3))}` : "",
                            !p!.meses.includes(barato + 1) ? "Fuera de su mejor época" : "En su mejor época",
                          ]
                            .filter(Boolean)
                            .join(". ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="nota-pie">
          Ahorro: el mes más barato frente al más caro, en la mediana de los lodges de cada parque (por persona y noche
          en doble). Tarifas copiadas a mano de las que publican los lodges, consultadas el {CONSULTADO}; algunas son de
          agentes, y se dice en cada ficha. Animales: nivel de avistamiento ese mes según las fotos de iNaturalist.
          Lluvia: climatología de la NASA (POWER). Muchos campamentos cierran en lo peor de las lluvias (abril-mayo en
          África oriental).
        </p>
      </section>
      <section className="seccion">
        <h2 className="rotulo">Cómo aprovecharla</h2>
        <ul className="lista-organiza">
          <li>
            Los meses «entre temporadas» (noviembre-diciembre y enero-marzo en África oriental; abril-mayo y noviembre
            en el sur) suelen ser el mejor equilibrio: precio medio o bajo y lluvias cortas por la tarde.
          </li>
          <li>
            En el Serengeti, enero-marzo es temporada media y coincide con los partos en Ndutu: mucha acción de
            depredadores.
          </li>
          <li>
            En el Okavango y Khwai, la temporada verde (enero-marzo) es la de los nacimientos y las aves migratorias;
            muchos lodges quitan el suplemento individual.
          </li>
          <li>
            En las reservas privadas de Sudáfrica no hay temporada verde: el precio es el mismo todo el año salvo
            Navidad.
          </li>
        </ul>
        <p className="enlaces">
          <Link href="/presupuesto">Calcular el presupuesto →</Link>
          <Link href="/safari-en">Safari por meses →</Link>
        </p>
      </section>
    </main>
  );
}
