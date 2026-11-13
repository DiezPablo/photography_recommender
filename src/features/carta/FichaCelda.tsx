"use client";
// Ficha de una cuadrícula de 10 km: el lugar con nombre más cercano, qué se registra ese mes (‰ de su grupo, con la
// muestra detrás y, en las aves, en qué parte de las listas de eBird sale), lo visto en 30 días, la luz y el tiempo
// del día elegido y cómo llegar. Todo con su fuente.
import Link from "next/link";
import { useEffect, useState } from "react";
import { MESES } from "@/lib/fechas";
import { bloque, celda as celdaDe, centroCelda } from "@/lib/rejilla";
import type { BloqueEspana } from "@/features/fauna/zonas";
import FranjaDia from "@/features/carta/FranjaDia";
import CitaEbird from "@/features/fauna/citaEbird";
import { fiabilidad, TEXTO_FIABILIDAD } from "@/features/carta/estado";

const POR_GRUPO = 6;

const NOMBRE_GRUPO: Record<string, string> = {
  Aves: "Aves",
  Mammalia: "Mamíferos",
  Reptilia: "Reptiles",
  Amphibia: "Anfibios",
};

export const GRUPO: Record<string, string> = {
  Aves: "ave",
  Mammalia: "mamífero",
  Reptilia: "reptil",
  Amphibia: "anfibio",
};

interface Cercano {
  n: string;
  t: string;
  km: number;
  id: string;
}

interface Fila {
  k: string;
  nombre: string;
  cientifico: string | null;
  clase: string;
  v: number;
  muestra: number;
  /** % de listas de eBird ese mes (solo aves con 10 listas o más) */
  ebird: number | null;
}

function filas(b: BloqueEspana, codigo: string, mes: number): { filas: Fila[]; listas: number } {
  const d = b.celdas[codigo];
  if (!d) return { filas: [], listas: 0 };
  const muestraDe = (clase: string) =>
    [mes - 1, mes, mes + 1].reduce((a, i) => a + (d.m[clase]?.[(i + 12) % 12] ?? 0), 0);
  const eb = b.ebird?.[codigo];
  const listas = eb?.l[mes] ?? 0;
  const salida = Object.entries(d.e)
    .map(([k, meses]) => {
      const e = b.especies[k];
      const clase = e?.clase ?? "Aves";
      return {
        k,
        nombre: e?.n ?? e?.c ?? k,
        cientifico: e?.c ?? null,
        clase,
        v: meses[mes] ?? 0,
        muestra: muestraDe(clase),
        ebird: clase === "Aves" && listas >= 10 ? (eb?.d[k]?.[mes] ?? 0) : null,
      };
    })
    .filter((f) => f.v > 0 && !b.especies[f.k]?.estado)
    .sort((a, z) => z.v - a.v);
  return { filas: salida, listas };
}

export default function FichaCelda({
  codigo,
  mes,
  fecha,
  especie,
  alCerrar,
  alElegirEspecie,
}: {
  codigo: string;
  mes: number;
  fecha: string;
  especie: string | null;
  alCerrar: () => void;
  alElegirEspecie: (clave: string) => void;
}) {
  const [lat, lon] = centroCelda(codigo);
  const [datos, setDatos] = useState<{ codigo: string; b: BloqueEspana | null }>();
  const [cercano, setCercano] = useState<{ codigo: string; l: Cercano | null }>();
  const [todas, setTodas] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch(`/fauna/datos/${bloque(codigo)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b: BloqueEspana | null) => vivo && setDatos({ codigo, b }))
      .catch(() => vivo && setDatos({ codigo, b: null }));
    fetch(`/fauna/cerca?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&mes=${mes}&max=1&km=15`)
      .then((r) => (r.ok ? r.json() : { lugares: [] }))
      .then((d: { lugares: Cercano[] }) => vivo && setCercano({ codigo, l: d.lugares[0] ?? null }))
      .catch(() => vivo && setCercano({ codigo, l: null }));
    return () => {
      vivo = false;
    };
    // el mes solo cambia el recuento del lugar cercano, no su nombre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, lat, lon]);

  const b = datos?.codigo === codigo ? datos.b : undefined;
  const lugar = cercano?.codigo === codigo ? cercano.l : undefined;
  const { filas: lista, listas } = b ? filas(b, codigo, mes) : { filas: [], listas: 0 };
  const elegida = especie ? lista.find((f) => f.k === especie) : undefined;
  // por grupos: el ‰ se calcula dentro de cada uno (el 553 ‰ del corzo es sobre pocos registros de mamíferos y no se
  // compara con el de las aves); primero el grupo con más registros
  const porClase = new Map<string, Fila[]>();
  for (const f of lista) porClase.set(f.clase, [...(porClase.get(f.clase) ?? []), f]);
  const grupos = [...porClase.entries()].sort((x, y) => y[1][0].muestra - x[1][0].muestra);
  const recientes = (b?.recientes?.obs ?? []).filter((o) => celdaDe(o.lat, o.lon) === codigo);
  const nombreDe = (c: string) =>
    Object.values(b?.especies ?? {}).find((e) => e.c === c.split(" ").slice(0, 2).join(" "))?.n ?? c;

  return (
    <section className="ficha-celda" aria-labelledby="titulo-celda">
      <header className="ficha-celda-cabecera">
        <div>
          <h2 id="titulo-celda">{lugar ? (lugar.km < 1 ? lugar.n : `Cerca de ${lugar.n}`) : "Cuadrícula de 10 km"}</h2>
          <p className="ficha-celda-sub cifra">
            {codigo.replace("10km", "")} · {lat.toFixed(3)}, {lon.toFixed(3)}
            {lugar && lugar.km >= 1 ? ` · a ${Math.round(lugar.km)} km del centro` : ""}
          </p>
        </div>
        <button type="button" className="boton-cerrar" onClick={alCerrar} aria-label="Cerrar la ficha de la cuadrícula">
          ×
        </button>
      </header>

      {b === undefined ? (
        <p className="ficha-celda-cargando">Cargando la cuadrícula…</p>
      ) : !b || !b.celdas[codigo] ? (
        <p>No hay registros de GBIF en esta cuadrícula.</p>
      ) : (
        <>
          {especie && (
            <p className="ficha-celda-elegida">
              {elegida ? (
                <>
                  <b>{elegida.nombre}</b> en {MESES[mes]}: <span className="cifra">{elegida.v} ‰</span> de los registros
                  de {GRUPO[elegida.clase] ?? "su grupo"}s ({TEXTO_FIABILIDAD[fiabilidad(elegida.muestra)]},{" "}
                  <span className="cifra">{elegida.muestra.toLocaleString("es-ES")}</span> registros de su grupo de{" "}
                  {MESES[(mes + 11) % 12]} a {MESES[(mes + 1) % 12]})
                  {elegida.ebird !== null && (
                    <>
                      ; sale en el <span className="cifra">{elegida.ebird} %</span> de las{" "}
                      <span className="cifra">{listas}</span> listas de eBird de {MESES[mes]}
                    </>
                  )}
                  .
                </>
              ) : (
                <>La especie elegida no tiene registros aquí en {MESES[mes]}.</>
              )}
            </p>
          )}
          <h3 className="ficha-celda-h3">Lo que más se registra en {MESES[mes]}, por grupos</h3>
          {grupos.map(([clase, xs]) => {
            const conEbird = clase === "Aves" && listas >= 10;
            const muestra = xs[0].muestra;
            return (
              <table key={clase} className="tabla-celda" data-fiabilidad={fiabilidad(muestra)}>
                <caption>
                  {NOMBRE_GRUPO[clase] ?? clase} <span className="cifra">{muestra.toLocaleString("es-ES")}</span>{" "}
                  registros · {TEXTO_FIABILIDAD[fiabilidad(muestra)]}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Especie</th>
                    <th scope="col" className="num">
                      ‰
                    </th>
                    {conEbird && (
                      <th scope="col" className="num">
                        eBird
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(todas ? xs : xs.slice(0, POR_GRUPO)).map((f) => (
                    <tr key={f.k}>
                      <th scope="row">
                        <button type="button" className="enlace-especie" onClick={() => alElegirEspecie(f.k)}>
                          {f.nombre}
                        </button>
                      </th>
                      <td className="num cifra">{f.v}</td>
                      {conEbird && <td className="num cifra">{f.ebird === null ? "" : `${f.ebird} %`}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })}
          {grupos.some(([, xs]) => xs.length > POR_GRUPO) && (
            <button type="button" className="boton-texto" onClick={() => setTodas(!todas)}>
              {todas ? "Ver menos" : `Ver las ${lista.length} especies`}
            </button>
          )}
          <p className="nota-celda">
            ‰ grupo: de cada mil registros de su grupo (aves, mamíferos…) en la cuadrícula ese mes y los vecinos,
            cuántos son de la especie (GBIF). Mide lo que se registra, que depende de quién va y qué apunta: no es la
            probabilidad de verla. En gris, los grupos con menos de 100 registros.
            {listas >= 10 ? ` eBird: % de las ${listas} listas completas de ${MESES[mes]} en que sale. ` : ""}
            {listas >= 10 && <CitaEbird />}
          </p>

          {recientes.length > 0 && (
            <>
              <h3 className="ficha-celda-h3">Visto en los últimos 30 días</h3>
              <ul className="lista-recientes">
                {recientes.slice(0, 8).map((o) => (
                  <li key={`${o.c}-${o.f}`}>
                    {nombreDe(o.c)}{" "}
                    <span className="cifra">
                      {o.f.slice(8, 10)}-{o.f.slice(5, 7)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="nota-celda">
                {recientes.some((o) => o.s !== "i") ? "Aves: eBird. " : ""}
                {recientes.some((o) => o.s === "i") ? "Mamíferos, reptiles y anfibios: iNaturalist. " : ""}
                Las especies sensibles solo por zonas.
              </p>
            </>
          )}
        </>
      )}

      <FranjaDia lat={lat} lon={lon} fecha={fecha} />

      <nav className="ficha-celda-acciones" aria-label="Qué hacer con esta cuadrícula">
        <a
          href={`https://www.openstreetmap.org/directions?to=${lat.toFixed(5)}%2C${lon.toFixed(5)}`}
          target="_blank"
          rel="noopener"
        >
          Cómo llegar (OpenStreetMap)
        </a>
        {lugar && <Link href={`/fauna/lugar/${encodeURIComponent(lugar.id)}`}>Ficha de {lugar.n}</Link>}
        <Link href={`/fauna?modo=aqui&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&radio=10&fecha=${fecha}`}>
          Plan del día aquí
        </Link>
      </nav>
      {b?.cita && <p className="nota-celda cita">{b.cita}</p>}
    </section>
  );
}
