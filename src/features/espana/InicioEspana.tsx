"use client";
// Portada de «Fauna en España»: tres entradas (cerca de mí ahora, este finde, quiero ver una especie), las rarezas
// de la semana, mi lista y lo que pasa este mes.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESES } from "@/lib/fechas";
import { FENOMENOS } from "@/features/espana/fenomenos";
import { guardarUbicacion, useUbicacionGuardada } from "@/features/espana/ubicacion";

// para empezar sin dar la ubicación: las ciudades más pobladas, repartidas por la península y las islas
const CIUDADES: { nombre: string; lat: number; lon: number }[] = [
  { nombre: "Madrid", lat: 40.417, lon: -3.704 },
  { nombre: "Barcelona", lat: 41.387, lon: 2.17 },
  { nombre: "Valencia", lat: 39.47, lon: -0.376 },
  { nombre: "Sevilla", lat: 37.389, lon: -5.984 },
  { nombre: "Zaragoza", lat: 41.649, lon: -0.889 },
  { nombre: "Bilbao", lat: 43.263, lon: -2.935 },
  { nombre: "A Coruña", lat: 43.362, lon: -8.411 },
  { nombre: "Palma", lat: 39.57, lon: 2.65 },
  { nombre: "Las Palmas", lat: 28.124, lon: -15.43 },
];

export default function InicioEspana({ hoy }: { hoy: string }) {
  const router = useRouter();
  const guardada = useUbicacionGuardada();
  const [error, setError] = useState(false);
  const mes = Number(hoy.slice(5, 7));
  const ahora = FENOMENOS.filter((f) => f.meses.includes(mes));
  const q = (u: { lat: number; lon: number; nombre: string | null }) =>
    `lat=${u.lat.toFixed(3)}&lon=${u.lon.toFixed(3)}${u.nombre ? `&lugar=${encodeURIComponent(u.nombre)}` : ""}`;

  const cercaDeMi = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const u = { lat: p.coords.latitude, lon: p.coords.longitude, nombre: null };
        guardarUbicacion(u);
        router.push(`/espana?modo=aqui&${q(u)}&radio=10`);
      },
      () => setError(true),
    );

  return (
    <>
      <div className="entradas-espana">
        <section className="entrada">
          <h2>Cerca de mí, ahora</h2>
          <p>Qué especies hay a tu alrededor este mes, con la luz, el tiempo y los lugares para ir.</p>
          <p className="ciudades-espana">
            {guardada && (
              <Link className="boton" href={`/espana?modo=aqui&${q(guardada)}&radio=10`}>
                {guardada.nombre ?? "Mi último punto"}
              </Link>
            )}
            {CIUDADES.map((c) => (
              <Link key={c.nombre} className="chip" href={`/espana?modo=aqui&${q(c)}&radio=20`}>
                {c.nombre}
              </Link>
            ))}
          </p>
          <p>
            <button type="button" className="enlace-boton" onClick={cercaDeMi}>
              Usar mi ubicación
            </button>{" "}
            · <Link href="/espana?modo=aqui">Buscar otro lugar →</Link>
          </p>
          {error && <p className="nota-pie">No se pudo saber tu ubicación: elige una ciudad o busca un lugar.</p>}
        </section>
        <section className="entrada">
          <h2>Este finde</h2>
          <p>
            Los mejores sitios para el sábado y el domingo, por fauna del mes, tiempo y distancia
            {guardada?.nombre ? `, cerca de ${guardada.nombre}` : guardada ? "" : ", desde Madrid (cámbialo allí)"}.
          </p>
          <p>
            <Link className="boton" href={`/espana?modo=finde${guardada ? `&${q(guardada)}` : ""}`}>
              Ver el fin de semana
            </Link>
          </p>
        </section>
        <section className="entrada">
          <h2>Quiero ver o fotografiar…</h2>
          <p>Elige una especie y te decimos dónde y cuándo es más fácil, con sus momentos especiales.</p>
          <p>
            <Link className="boton" href="/espana?modo=donde">
              Buscar una especie
            </Link>
          </p>
        </section>
      </div>

      <nav className="mas-espana" aria-label="Más">
        {[
          ["/espana/mapa", "Mapa de fauna", "Lugares, hides y dónde se ve cada especie"],
          ["/espana/hides", "Hides y salidas", "Para fotografiar o ver con guía"],
          ["/espana/rarezas", "Rarezas", "Lo raro visto esta semana"],
          ["/espana/mis-especies", "Mis especies", "Las que has visto"],
          ["/espana/diario", "Mi diario", "Tus salidas"],
          ["/espana/normas", "Normas", "Ley, drones y código ético"],
        ].map(([href, titulo, texto]) => (
          <Link key={href} href={href}>
            <b>{titulo}</b>
            <small>{texto}</small>
          </Link>
        ))}
      </nav>

      {ahora.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Qué pasa en {MESES[mes - 1]} en España</h2>
          <ul className="lista-lugares">
            {ahora.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/espana?modo=aqui&lat=${f.lat}&lon=${f.lon}&radio=${f.radioKm <= 10 ? 10 : 20}&lugar=${encodeURIComponent(f.titulo)}`}
                >
                  {f.titulo}
                </Link>{" "}
                <small>{f.descripcion.split(".")[0]}.</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
