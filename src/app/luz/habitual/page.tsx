import type { Metadata } from "next";
import Link from "next/link";
import { NOMBRE_HABITUAL, rutaHabitual, TIPOS_HABITUAL } from "@/features/clima/habitual";
import { MESES } from "@/lib/fechas";

export const metadata: Metadata = {
  title: "Lo habitual: dónde suele ir mejor cada mes",
  description:
    "Para fechas sin previsión: los spots donde mejor suele ir el amanecer, el atardecer y la noche cada mes.",
};

export default function Pagina() {
  return (
    <main className="calendario habitual-indice">
      <header className="titular">
        <p className="rotulo">Lo habitual · sin previsión</p>
        <h1>Dónde suele ir mejor cada mes</h1>
        <p className="entradilla">
          La previsión llega a cinco días. Para un viaje o un finde más lejano, elige el mes y el momento: los spots se
          ordenan por lo que suele pasar ese mes en su zona y por lo que da de sí el lugar.
        </p>
      </header>
      <ul className="lista-habitual">
        {MESES.map((m, i) => (
          <li key={m}>
            <strong>{m}</strong>
            {TIPOS_HABITUAL.map((t) => (
              <Link key={t} href={rutaHabitual(i, t)}>
                {NOMBRE_HABITUAL[t]}
              </Link>
            ))}
          </li>
        ))}
      </ul>
    </main>
  );
}
