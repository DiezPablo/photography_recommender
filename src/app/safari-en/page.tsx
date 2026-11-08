// Índice de las páginas de respuesta: cuándo ir (por meses) y adónde (por países).
import type { Metadata } from "next";
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { PAREJAS, clavePareja } from "@/features/safaris/respuestas";
import { cargarSafaris, enTemporada, paisesDe, paisesDestacados } from "@/features/safaris/datos";

export const metadata: Metadata = {
  title: "Safari por meses y por países",
  description: "Dónde ir de safari cada mes del año y los mejores parques de cada país, con su mejor época.",
};

export default function IndiceRespuestas() {
  const parques = cargarSafaris()?.parques ?? [];
  return (
    <main className="calendario safaris respuesta">
      <header className="titular">
        <p className="rotulo">
          <Link href="/safaris">Safaris</Link> · Cuándo y adónde
        </p>
        <h1>Calendario: cuándo ir</h1>
        <p className="entradilla">
          Cada mes, los parques que están en su mejor época; cada país, sus parques y cuándo ir a cada uno; y la
          migración y la temporada verde.
        </p>
      </header>
      <p className="enlaces">
        <Link href="/migracion">La gran migración, mes a mes →</Link>
        <Link href="/temporada-verde">Temporada verde: cuánto se ahorra →</Link>
      </p>
      <section className="seccion">
        <h2 className="rotulo">Por meses</h2>
        <ul className="lista-respuesta compacta columnas-respuesta">
          {MESES.map((m, i) => (
            <li key={m}>
              <Link href={`/safari-en/${m}`}>Safari en {m}</Link>{" "}
              <small>{parques.filter((p) => enTemporada(p, i)).length} parques en su mejor época</small>
            </li>
          ))}
        </ul>
      </section>
      <section className="seccion">
        <h2 className="rotulo">Por países</h2>
        <ul className="lista-respuesta compacta columnas-respuesta">
          {[...paisesDestacados()].map(([s, n]) => (
            <li key={s}>
              <Link href={`/safari-en/${s}`}>Safari en {n}</Link>{" "}
              <small>{parques.filter((p) => paisesDe(p).includes(n)).length} destacados</small>
            </li>
          ))}
        </ul>
      </section>
      <section className="seccion">
        <h2 className="rotulo">Comparativas</h2>
        <ul className="lista-respuesta compacta">
          {PAREJAS.map(([a, b]) => (
            <li key={`${a}-${b}`} className="fila-pareja">
              <b>
                {paisesDestacados().get(a)} o {paisesDestacados().get(b)}
              </b>
              <span className="nav-respuestas">
                {MESES.map((m, i) => (
                  <Link key={m} href={`/safari-en/${clavePareja(a, b, i)}`} aria-label={`${m}`}>
                    {m.slice(0, 3)}
                  </Link>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
