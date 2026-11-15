// En la ficha de un lugar de fauna: los spots de luz que tiene a menos de 15 km, con su mejor nota de hoy (spec 010).
// Un mismo viaje sirve para la fauna al amanecer y la luz al atardecer.
import Link from "next/link";
import { cercaDe } from "@/features/lugares/datos";
import { cargar, horaDe, NOMBRE_CORTO, notaDe } from "@/features/spots/datos";
import { distanciaKm } from "@/lib/fechas";
import Cifra from "@/ui/Cifra";

export default function LuzCerca({ id, lat, lon }: { id: string; lat: number; lon: number }) {
  const spots = new Map(cargar().spots.map((s) => [s.id, s]));
  const filas = cercaDe(id)
    .filter((c) => c.catalogo === "luz")
    .map((c) => {
      const s = spots.get(c.id);
      const n = s ? notaDe(s.dias[0], "todos") : null;
      return { c, km: distanciaKm({ lat, lon }, c), n, hora: s && n ? horaDe(s.dias[0], n.momento) : null };
    });
  if (!filas.length) return null;
  return (
    <section className="seccion luz-cerca" aria-labelledby="luz-cerca">
      <h2 className="rotulo" id="luz-cerca">
        Luz cerca · hoy
      </h2>
      <ul className="lista-cerca-catalogo">
        {filas.map(({ c, km, n, hora }) => (
          <li key={c.id}>
            {n ? <Cifra nota={n.nota.nota} /> : <span className="cifra n-floja">–</span>}
            <span>
              <Link href={`/luz/spot/${c.id}`}>{c.nombre}</Link>
              <small>
                {n ? `${NOMBRE_CORTO[n.momento]} · ${hora} · ` : ""}a {km < 10 ? km.toFixed(1) : Math.round(km)} km
              </small>
            </span>
          </li>
        ))}
      </ul>
      <p className="nota-pie">Spots de paisaje a menos de 15 km con su mejor momento de hoy.</p>
    </section>
  );
}
