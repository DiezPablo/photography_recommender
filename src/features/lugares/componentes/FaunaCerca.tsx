// En la ficha de un spot: los lugares de fauna que tiene a menos de 15 km (spec 010), primero los espacios
// protegidos y observatorios. El catálogo de fauna es otro (decisión 0015): aquí solo se enlaza.
import Link from "next/link";
import { cercaDe } from "@/features/lugares/datos";
import { lugarPorId } from "@/features/fauna/datos";
import { distanciaKm } from "@/lib/fechas";

const TIPO: Record<string, string> = {
  espacio_protegido: "Espacio protegido",
  humedal: "Humedal",
  observatorio: "Observatorio de aves",
  punto_de_observacion: "Punto de observación (eBird)",
};

export default function FaunaCerca({ id, lat, lon }: { id: string; lat: number; lon: number }) {
  // lugares.json sale del cálculo de luz y el catálogo de fauna se publica aparte (a diario): solo se enlaza lo que
  // sigue en él, o la ficha daría 404
  const lugares = cercaDe(id).filter((c) => c.catalogo === "fauna" && lugarPorId(c.id));
  if (!lugares.length) return null;
  return (
    <section className="seccion fauna-cerca" aria-labelledby="fauna-cerca">
      <h2 className="rotulo" id="fauna-cerca">
        Fauna cerca
      </h2>
      <ul className="lista-cerca-catalogo">
        {lugares.map((c) => {
          const km = distanciaKm({ lat, lon }, c);
          return (
            <li key={c.id}>
              <span className="punto-cat cat-fauna" aria-hidden />
              <span>
                <Link href={`/fauna/lugar/${encodeURIComponent(c.id)}`}>{c.nombre}</Link>
                <small>
                  {TIPO[c.tipo] ?? "Lugar de fauna"} · a {km < 10 ? km.toFixed(1) : Math.round(km)} km
                </small>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
