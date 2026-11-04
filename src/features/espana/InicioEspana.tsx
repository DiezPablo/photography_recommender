"use client";
// Portada de «Fauna en España»: tres entradas (cerca de mí ahora, este finde, quiero ver una especie), las rarezas
// de la semana, mi lista y lo que pasa este mes.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESES } from "@/lib/fechas";
import { FENOMENOS } from "@/features/espana/fenomenos";
import { guardarUbicacion, useUbicacionGuardada } from "@/features/espana/ubicacion";

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
          <p>
            <button type="button" className="boton" onClick={cercaDeMi}>
              Usar mi ubicación
            </button>{" "}
            {guardada && (
              <Link href={`/espana?modo=aqui&${q(guardada)}&radio=10`}>o {guardada.nombre ?? "el último punto"} →</Link>
            )}
          </p>
          {error && <p className="nota-pie">No se pudo saber tu ubicación: busca un lugar en «¿Qué veo aquí?».</p>}
          <p>
            <Link href="/espana?modo=aqui">Elegir otro lugar →</Link>
          </p>
        </section>
        <section className="entrada">
          <h2>Este finde</h2>
          <p>Los mejores sitios cerca para el sábado y el domingo, por fauna del mes, tiempo y distancia.</p>
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

      <p className="enlaces-inicio">
        <Link href="/espana/mapa">Mapa de fauna →</Link> · <Link href="/espana/hides">Hides y salidas guiadas →</Link> ·{" "}
        <Link href="/espana/rarezas">Rarezas de esta semana →</Link> ·{" "}
        <Link href="/espana/mis-especies">Mis especies vistas →</Link> ·{" "}
        <Link href="/espana/diario">Mi diario de salidas →</Link> ·{" "}
        <Link href="/espana/normas">Normas y código ético →</Link>
      </p>

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
