// Rarezas en España: las observaciones notables de eBird de los últimos 7 días (rarezas para la zona o la fecha),
// por provincia. Se regenera con cada despliegue (los datos llegan a diario).
import type { Metadata } from "next";
import Link from "next/link";
import ListaRarezas from "@/features/espana/ListaRarezas";
import { cargarRarezas, claveDe } from "@/features/espana/datos";

export const metadata: Metadata = {
  title: "Rarezas de aves en España esta semana",
  description: "Observaciones notables de aves en España en los últimos 7 días, por provincia, con datos de eBird.",
};

export const dynamic = "force-static";

export default function PaginaRarezas() {
  const d = cargarRarezas();
  const obs = d?.obs ?? [];
  const provincias = [...new Set(obs.map((o) => o.p ?? "Sin provincia"))].sort((a, b) => a.localeCompare(b, "es"));
  const claves = Object.fromEntries(obs.map((o) => [o.c, claveDe(o.c)]));
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/espana">España</Link>
        </p>
        <h1>Rarezas esta semana</h1>
        <p className="entradilla">
          Aves fuera de lo normal para la zona o la fecha vistas en los últimos 7 días en España: {obs.length}{" "}
          observaciones en {provincias.length} provincias. Las «sin revisar» aún no las ha validado eBird.
        </p>
      </header>
      {!obs.length && <p className="nota-pie">Aún no hay datos de rarezas.</p>}
      {provincias.length > 1 && (
        <nav className="indice-provincias" aria-label="Provincias">
          {provincias.map((p) => (
            <a key={p} href={`#${encodeURIComponent(p)}`}>
              {p}
            </a>
          ))}
        </nav>
      )}
      {provincias.map((p) => (
        <section key={p} id={encodeURIComponent(p)} className="seccion">
          <h2 className="rotulo">{p}</h2>
          <ListaRarezas obs={obs.filter((o) => (o.p ?? "Sin provincia") === p)} claves={claves} />
        </section>
      ))}
      <p className="nota-pie">
        Datos de <a href="https://ebird.org">eBird</a> (Cornell Lab of Ornithology), observaciones «notables». eBird
        oculta las especies sensibles. Respeta a las aves y la propiedad privada: una rareza no justifica molestar.
      </p>
    </main>
  );
}
