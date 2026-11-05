import type { Metadata } from "next";
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { MIGRACION } from "@/features/safaris/migracion";
import FotoGrande from "@/ui/FotoGrande";
import QueVer from "@/features/safaris/componentes/QueVer";
import ExploradorSafaris from "@/features/safaris/componentes/ExploradorSafaris";
import {
  cargarMundo,
  cargarRecientes,
  cargarSafaris,
  enTemporada,
  nombreEstrella,
  nombreTaxon,
  puntuacionAhora,
  slugEspecie,
} from "@/features/safaris/datos";
import { fechaLocal } from "@/lib/sol";
import { esDomestica } from "@/features/safaris/modelo";

export const metadata: Metadata = {
  title: "Safaris",
  description:
    "Parques de safari de todo el mundo: cuándo ir, qué especies se ven (y qué se ha visto este mes), tipos de safari, tasas, alojamientos y consejos.",
};

export default function PaginaSafaris() {
  const datos = cargarSafaris();
  const recientes = cargarRecientes();
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  const parques = datos?.parques ?? [];
  const ahora = parques
    .filter((p) => enTemporada(p, mesHoy))
    .sort((a, b) => puntuacionAhora(b, mesHoy, recientes) - puntuacionAhora(a, mesHoy, recientes))
    .slice(0, 6);
  const mundo = cargarMundo();
  // destinos de fauna (niveles A y B); el resto de espacios protegidos solo sale si se busca
  const destinos = (mundo?.parques ?? []).filter((p) => p.nivel !== "C");
  const total = destinos.length || parques.length;
  const paisesMundo = new Set(destinos.map((p) => p.pais)).size;
  // la foto de la portada: el primer destacado en buena época este mes que tenga foto
  const hero = ahora.find((p) => p.foto) ?? parques.find((p) => p.foto);
  const especies = Object.keys(mundo?.estrella ?? {})
    .map((k) => ({ clave: Number(k), nombre: nombreEstrella(k) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <main className="calendario fauna safaris">
      <figure className="portada-hero">
        {hero?.foto && <FotoGrande src={hero.foto.url} />}
        <div className="portada-hero-texto">
          <p className="rotulo">Atlas de fauna · {MESES[mesHoy]}</p>
          <h1>Dónde y cuándo ver cada animal</h1>
          <p>
            Los parques y reservas de todo el mundo con lo que se ve cada mes, lo que se ha visto en las últimas semanas
            y cómo organizarlo: rutas, presupuesto y operadores locales, sin intermediarios.
          </p>
          <div className="acciones">
            <Link href="/planificar">Planifica tu safari</Link>
            <Link href="/migracion">Dónde está la migración</Link>
          </div>
        </div>
        {hero?.foto && (
          <figcaption>
            {hero.nombre} ·{" "}
            {hero.foto.web ? (
              <a href={hero.foto.web} rel="noopener">
                {hero.foto.autor ?? "Wikimedia Commons"}
              </a>
            ) : (
              hero.foto.autor
            )}
            {hero.foto.licencia && ` · ${hero.foto.licencia}`}
          </figcaption>
        )}
      </figure>

      <section className="portada-cifras" aria-label="En cifras">
        <p>
          <b>{total.toLocaleString("es-ES")}</b>
          <span>destinos de fauna</span>
        </p>
        <p>
          <b>{paisesMundo || new Set(parques.map((p) => p.pais)).size}</b>
          <span>países</span>
        </p>
        <p>
          <b>{especies.length}</b>
          <span>especies emblemáticas, mes a mes</span>
        </p>
        <p>
          <b>0 %</b>
          <span>de comisión: reservas directamente</span>
        </p>
      </section>

      <QueVer mesHoy={mesHoy} />

      {ahora.length > 0 && (
        <section className="seccion">
          <h2>En buena época ahora, en {MESES[mesHoy]}</h2>
          <ul className="tarjetas-ahora">
            {ahora.map((p) => {
              const r = recientes?.parques[p.id];
              const top = r?.mamiferos
                .filter((m) => !esDomestica(m.cientifico))
                .slice(0, 3)
                .map((m) => m.nombre ?? m.cientifico);
              return (
                <li key={p.id}>
                  <Link href={`/parque/${p.id}`}>
                    {p.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto.url} alt="" loading="lazy" />
                    )}
                    <span className="rotulo">{p.pais}</span>
                    <b>{p.nombre}</b>
                    {top?.length ? <small>Visto este mes: {top.join(", ")}</small> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="enlaces">
            <Link href={`/safari-en/${MESES[mesHoy]}`}>Todos los parques en su mejor época en {MESES[mesHoy]} →</Link>
            <Link href="/safari-en">Otros meses y países →</Link>
          </p>
        </section>
      )}

      <section className="seccion franja-migracion">
        <p className="rotulo">La gran migración</p>
        <h2>
          En {MESES[mesHoy]}, {MIGRACION[mesHoy].zona}
        </h2>
        <p>{MIGRACION[mesHoy].que}</p>
        <p className="enlaces">
          <Link href="/migracion">Ver el mapa y lo visto este mes</Link>
          <Link href="/planificar?pais=Tanzania">Planificar un safari en Tanzania</Link>
        </p>
      </section>

      {parques.length ? (
        <>
          <ExploradorSafaris
            especies={especies}
            mesHoy={mesHoy}
            fotos={Object.fromEntries(parques.filter((p) => p.foto).map((p) => [p.id, p.foto!.url]))}
          />
          <noscript>
            <ul className="lista-cercanos">
              {parques.map((p) => (
                <li key={p.id}>
                  <Link href={`/parque/${p.id}`}>{p.nombre}</Link>
                  <small>{p.pais}</small>
                </li>
              ))}
            </ul>
          </noscript>
          <section className="seccion">
            <h2 className="rotulo">Por especie</h2>
            <p className="enlaces-especies">
              {(datos?.especies ?? []).slice(0, 24).map((e) => (
                <Link key={e.taxon} href={`/especie/${slugEspecie(e)}`}>
                  {nombreTaxon(e)}
                </Link>
              ))}
            </p>
          </section>
        </>
      ) : (
        <p>Los safaris aún no están disponibles.</p>
      )}
    </main>
  );
}
