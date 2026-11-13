// Portada de Rasante: las dos puertas (Luz y Fauna). Es provisional hasta la spec 012 (consulta «cuándo / dónde /
// qué»). Los enlaces antiguos a la carta de fauna, que vivía aquí con sus parámetros, se redirigen en next.config.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { NOMBRE_CORTO } from "@/features/spots/modelo";
import { filasRanking } from "@/features/spots/ranking";
import Cifra from "@/ui/Cifra";

export const metadata: Metadata = {
  title: { absolute: "Rasante · dónde ir a fotografiar naturaleza en España" },
  description:
    "Dime cuándo tienes tiempo y qué te apetece: los mejores spots para el amanecer, el atardecer y la noche de hoy, y dónde ver fauna en España según la época.",
};

export default function Portada() {
  const mejores = filasRanking(0, "todos").slice(0, 3);
  return (
    <main className="calendario portada-rasante">
      <header className="titular">
        <h1>¿Dónde voy a fotografiar?</h1>
        <p className="entradilla">
          Rasante te dice el lugar y el momento, en toda España: la mejor luz de los próximos días y la fauna que se ve
          en cada época.
        </p>
      </header>
      <div className="puertas">
        <section className="puerta">
          <p className="rotulo">Luz y cielo</p>
          <h2>
            <Link href="/luz">Amanecer, atardecer y noche</Link>
          </h2>
          <p>Nota de 0 a 10 para cada spot y cada día, con el porqué: nubes, horizonte, luna y cielo oscuro.</p>
          {mejores.length > 0 && (
            <ol className="puerta-lista">
              {mejores.map((f) => (
                <li key={f.id}>
                  <Cifra nota={f.nota} />
                  <span>
                    <Link href={`/luz/spot/${f.id}`}>{f.nombre}</Link>
                    <small>
                      {NOMBRE_CORTO[f.momento]} de hoy · {f.hora}
                      {f.provincia ? ` · ${f.provincia}` : ""}
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="puerta-acciones">
            <Link href="/luz" className="boton">
              Los mejores spots de hoy
            </Link>
            <Link href="/luz/calendario">Calendario del cielo</Link>
          </p>
        </section>
        <section className="puerta">
          <p className="rotulo">Fauna</p>
          <h2>
            <Link href="/fauna">Qué se ve, dónde y cuándo</Link>
          </h2>
          <p>
            Mapa de España por cuadrícula de 10 km: cuánto se registra cada especie cada mes, lo visto estos días, hides
            y normas.
          </p>
          <ul className="puerta-lista">
            <li>
              <Link href="/fauna?modo=aqui">Cerca de mí</Link>
              <small>qué veo hoy en un lugar, con la luz y el tiempo</small>
            </li>
            <li>
              <Link href="/fauna?modo=finde">Este finde</Link>
              <small>los mejores sitios para el sábado y el domingo</small>
            </li>
            <li>
              <Link href="/fauna/rarezas">Rarezas</Link>
              <small>aves fuera de lo normal vistas esta semana</small>
            </li>
          </ul>
          <p className="puerta-acciones">
            <Link href="/fauna" className="boton">
              Abrir el mapa de fauna
            </Link>
            <Link href="/fauna/hides">Hides</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
