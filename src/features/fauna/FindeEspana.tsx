"use client";
// «Este finde»: desde tu ubicación (o un lugar), los lugares de fauna cercanos ordenados para el sábado y el
// domingo por fauna del mes, tiempo y distancia, con el desglose (features/fauna/finde.ts).
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParametrosUrl } from "@/lib/almacen";
import { MESES } from "@/lib/fechas";
import ElegirLugar from "@/features/fauna/ElegirLugar";
import { useUbicacionGuardada } from "@/features/fauna/ubicacion";
import { fenomenosCerca } from "@/features/fauna/fenomenos";
import Alojamientos from "@/features/fauna/Alojamientos";
import GuardarSinConexion from "@/ui/GuardarSinConexion";
import { luzDia } from "@/lib/luz";
import { horaLocal } from "@/lib/sol";
import {
  diasFinde,
  icsPlan,
  planDia,
  tiempoFranja,
  leerPrevisionVarios,
  puntuarFinde,
  tiempoDia,
  urlPrevisionVarios,
  type Factor,
} from "@/features/fauna/finde";
import type { HoraTiempo } from "@/lib/tiempo";
import type { LugarFauna } from "@/features/fauna/zonas";

interface LugarCerca extends LugarFauna {
  km: number;
  especies: number;
  /** especies esperadas en 100 registros (rarefacción); falta en respuestas antiguas */
  esperadas?: number;
  destacadas: string[];
}

const DISTANCIAS = [25, 50, 100];
const MADRID = { lat: 40.417, lon: -3.704 };
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const nombreDia = (f: string) =>
  `${DIAS_SEMANA[new Date(`${f}T12:00:00Z`).getUTCDay()]} ${Number(f.slice(8, 10))} de ${MESES[Number(f.slice(5, 7)) - 1]}`;

export default function FindeEspana({ hoy }: { hoy: string }) {
  const [parametros, actualizar] = useParametrosUrl();
  const guardada = useUbicacionGuardada();
  const base = parametros.has("lat") ? null : (guardada ?? null);
  const lat = Number(parametros.get("lat") ?? base?.lat ?? MADRID.lat);
  const lon = Number(parametros.get("lon") ?? base?.lon ?? MADRID.lon);
  const km = Number(parametros.get("km") ?? 50);
  const nombre =
    parametros.get("lugar") ??
    (parametros.has("lat") ? "Tu punto" : base ? (base.nombre ?? "Tu punto") : "Madrid (cámbialo arriba)");
  const dias = diasFinde(hoy);
  const mes = Number(dias[0].slice(5, 7)) - 1;

  const clave = `${lat.toFixed(3)},${lon.toFixed(3)},${km},${dias.join(",")}`;
  const [res, setRes] = useState<{ clave: string; lugares: LugarCerca[]; horas: HoraTiempo[][] | null }>();
  useEffect(() => {
    let vivo = true;
    fetch(`/fauna/cerca?lat=${lat}&lon=${lon}&mes=${mes}&max=20&km=${km}`)
      .then((r) => (r.ok ? r.json() : { lugares: [] }))
      .then(async (d: { lugares: LugarCerca[] }) => {
        let horas: HoraTiempo[][] | null = null;
        if (d.lugares.length) {
          try {
            const r = await fetch(urlPrevisionVarios(d.lugares, dias[0], dias[dias.length - 1]));
            if (r.ok) horas = leerPrevisionVarios(await r.json());
          } catch {
            horas = null;
          }
        }
        if (vivo) setRes({ clave, lugares: d.lugares, horas });
      })
      .catch(() => vivo && setRes({ clave, lugares: [], horas: null }));
    return () => {
      vivo = false;
    };
    // dias sale de hoy y clave ya lo incluye
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  const datos = res?.clave === clave ? res : undefined;

  // la riqueza comparable entre sitios: especies esperadas con los mismos registros (rarefacción)
  const maxEspecies = Math.max(1, ...(datos?.lugares ?? []).map((l) => l.esperadas ?? l.especies));
  const porDia = dias.map((dia) => ({
    dia,
    lista: (datos?.lugares ?? [])
      .map((l, i) => {
        const f = fenomenosCerca(l.lat, l.lon, l.r, mes + 1)[0];
        const tiempo = datos?.horas?.[i] ? tiempoDia(datos.horas[i], dia) : null;
        return {
          l,
          nota: puntuarFinde({
            especies: l.especies,
            esperadas: l.esperadas,
            maxEspecies,
            km: l.km,
            maxKm: km,
            tiempo,
            fenomeno: f?.titulo ?? null,
          }),
        };
      })
      .sort((a, b) => b.nota.total - a.nota.total)
      .slice(0, 8),
  }));

  // el plan de cada día: mañana en el mejor sitio para la mañana; tarde, en otro a menos de 60 km
  const lugaresD = datos?.lugares ?? [];
  const planes = dias.map((dia) => {
    const nota = (i: number, franja: "mañana" | "tarde") => {
      const l = lugaresD[i];
      const f = fenomenosCerca(l.lat, l.lon, l.r, mes + 1)[0];
      const t = datos?.horas?.[i] ? tiempoFranja(datos.horas[i], dia, franja) : null;
      return puntuarFinde({
        especies: l.especies,
        esperadas: l.esperadas,
        maxEspecies,
        km: l.km,
        maxKm: km,
        tiempo: t,
        fenomeno: f?.titulo ?? null,
      }).total;
    };
    const plan = planDia(
      lugaresD,
      (i) => nota(i, "mañana"),
      (i) => nota(i, "tarde"),
    );
    const salidas = plan
      ? [
          { i: plan.manana, titulo: "Mañana", franja: "mañana" as const },
          ...(plan.tarde !== null ? [{ i: plan.tarde, titulo: "Tarde", franja: "tarde" as const }] : []),
        ].map(({ i, titulo, franja }) => {
          const l = lugaresD[i];
          const luz = luzDia(dia, l.lat, l.lon);
          const f = franja === "mañana" ? luz.doradaManana : luz.doradaTarde;
          const inicio = f
            ? new Date(f.desde.getTime() - (franja === "mañana" ? 30 : 60) * 60000)
            : new Date(`${dia}T08:00:00Z`);
          const fin = f
            ? new Date(f.hasta.getTime() + (franja === "mañana" ? 90 : 15) * 60000)
            : new Date(`${dia}T11:00:00Z`);
          const t = datos?.horas?.[i] ? tiempoFranja(datos.horas[i], dia, franja) : null;
          return {
            titulo,
            id: l.id,
            lugar: l.n,
            lat: l.lat,
            lon: l.lon,
            inicio,
            fin,
            nota: `${horaLocal(inicio, l.lon)}–${horaLocal(fin, l.lon)}${t ? ` · ${t.probLluvia} % lluvia, rachas ${t.rachas} km/h` : ""} · ${l.especies} especies este mes${l.destacadas.length ? ` (${l.destacadas.slice(0, 3).join(", ")})` : ""}`,
          };
        })
      : [];
    return { dia, plan, salidas };
  });
  const descargarIcs = () => {
    const texto = icsPlan(
      planes.flatMap((x) => x.salidas.map((y) => ({ ...y, titulo: `Fauna: ${y.lugar} (${y.titulo.toLowerCase()})` }))),
    );
    const url = URL.createObjectURL(new Blob([texto], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fin-de-semana-fauna.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="seccion formulario-plan">
        <ElegirLugar
          lat={lat}
          lon={lon}
          mes={mes}
          nombre={nombre}
          conCerca={false}
          elegir={(e) => actualizar({ lat: e.lat.toFixed(3), lon: e.lon.toFixed(3), lugar: e.nombre })}
        />
        <label className="campo">
          <span className="rotulo">Hasta</span>
          <select value={km} onChange={(e) => actualizar({ km: e.target.value })}>
            {DISTANCIAS.map((d) => (
              <option key={d} value={d}>
                {d} km
              </option>
            ))}
          </select>
        </label>
      </section>

      {!datos && <p className="nota-pie">Buscando lugares y previsión…</p>}
      {datos && !datos.lugares.length && (
        <p className="nota-pie">No hay lugares de fauna a menos de {km} km. Prueba con más distancia.</p>
      )}
      {datos && datos.lugares.length > 0 && !datos.horas && (
        <p className="nota-pie">
          No se pudo consultar la previsión de Open-Meteo: el orden es solo por fauna y distancia.
        </p>
      )}
      {datos && datos.lugares.length > 0 && planes.some((x) => x.plan) && (
        <section className="seccion plan-finde" aria-labelledby="plan-titulo">
          <h2 className="rotulo" id="plan-titulo">
            Plan propuesto
          </h2>
          {planes.map(({ dia, plan, salidas }) =>
            plan ? (
              <div key={dia} className="plan-dia">
                <h3>{nombreDia(dia)}</h3>
                <ol>
                  {salidas.map((x) => (
                    <li key={x.titulo}>
                      <b>{x.titulo}</b>: <Link href={`/fauna/lugar/${encodeURIComponent(x.id)}`}>{x.lugar}</Link>{" "}
                      <small>{x.nota}</small>
                    </li>
                  ))}
                </ol>
                {plan.km !== null && (
                  <p className="nota-pie">Entre los dos sitios, unos {plan.km} km en línea recta.</p>
                )}
                <Alojamientos {...salidas[salidas.length - 1]} nombre={salidas[salidas.length - 1].lugar} />
              </div>
            ) : null,
          )}
          <p>
            <button type="button" className="boton" onClick={descargarIcs}>
              Añadir al calendario (.ics)
            </button>{" "}
            <GuardarSinConexion
              urls={planes.flatMap((x) => x.salidas.map((y) => `/fauna/lugar/${encodeURIComponent(y.id)}`))}
            />
          </p>
        </section>
      )}
      {datos &&
        datos.lugares.length > 0 &&
        porDia.map(({ dia, lista }) => (
          <section key={dia} className="seccion" aria-label={nombreDia(dia)}>
            <h2 className="rotulo">{nombreDia(dia)}</h2>
            <ol className="lista-finde">
              {lista.map(({ l, nota }) => (
                <li key={l.id}>
                  <details>
                    <summary>
                      <b>{l.n}</b> <small>{l.t}</small>{" "}
                      <span className="nota-finde">{Math.round(nota.total * 10)}/10</span>
                      <br />
                      <small>{nota.factores.map((f) => f.detalle).join(" · ")}</small>
                    </summary>
                    <ul className="desglose">
                      {nota.factores.map((f: Factor) => (
                        <li key={f.nombre}>
                          {f.nombre}: {Math.round(f.valor * 100)} % <small>({f.detalle})</small>
                        </li>
                      ))}
                      {l.destacadas.length > 0 && <li>Destacadas este mes: {l.destacadas.join(", ")}</li>}
                    </ul>
                    <p>
                      <Link
                        href={`/fauna?lat=${l.lat}&lon=${l.lon}&radio=5&fecha=${dia}&lugar=${encodeURIComponent(l.n)}`}
                      >
                        Especies, luz y franjas ese día →
                      </Link>{" "}
                      · <Link href={`/fauna/lugar/${encodeURIComponent(l.id)}`}>Ficha del lugar</Link>
                    </p>
                  </details>
                </li>
              ))}
            </ol>
          </section>
        ))}
      <p className="nota-pie">
        Nota = fauna del mes en sus cuadrículas (comparada con el mejor de la lista) × tiempo en la mejor franja (mañana
        7-11 o tarde 16-20: lluvia y rachas, de Open-Meteo) × distancia; un fenómeno de temporada cerca suma un 15 %.
      </p>
    </>
  );
}
