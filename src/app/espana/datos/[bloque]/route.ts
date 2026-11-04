// Datos de España de un bloque de 100 km de la cuadrícula EEA (los pide el navegador según el punto): celdas, con
// la frecuencia por mes de sus especies y la muestra de cada clase, y los nombres. 404 mientras no haya descarga
// de GBIF (espana.json).
import { leerDatos } from "@/lib/datos";
import type { BloqueEspana, ObsReciente } from "@/features/espana/zonas";
import { bloque as bloqueDe, celda } from "@/lib/rejilla";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

interface Espana {
  fuente?: { cita?: string };
  especies: BloqueEspana["especies"];
  celdas: BloqueEspana["celdas"];
}

let cache: Espana | null | undefined;
let actividad: { especies: Record<string, { f: [number, number, number]; n: number }> } | null | undefined;
let ebird: { celdas: Record<string, { l: number[]; d: Record<string, (number | null)[]> }> } | null | undefined;
let recientes: { generado: string; obs: ObsReciente[] } | null | undefined;

export async function GET(_: Request, { params }: { params: Promise<{ bloque: string }> }) {
  const { bloque } = await params;
  if (!/^100kmE\d+N\d+$/.test(bloque)) return new Response("Bloque no válido", { status: 400 });
  if (cache === undefined) cache = leerDatos<Espana>("espana.json");
  if (!cache) return Response.json({ error: "Aún no hay datos de España" }, { status: 404 });
  const [e, n] = bloque.slice(6).split("N").map(Number);
  const celdas = Object.fromEntries(
    Object.entries(cache.celdas).filter(([c]) => {
      if (!/^10kmE\d+N\d+$/.test(c)) return false;
      const [ce, cn] = c.split("E")[1].split("N").map(Number);
      return Math.floor(ce / 10) === e && Math.floor(cn / 10) === n;
    }),
  );
  const claves = new Set(Object.values(celdas).flatMap((c) => Object.keys(c.e)));
  if (actividad === undefined) actividad = leerDatos("espana_actividad.json");
  const especies = Object.fromEntries(
    Object.entries(cache.especies)
      .filter(([k]) => claves.has(k))
      .map(([k, e]) => [k, { ...e, h: (e.c && actividad?.especies[e.c]) || null }]),
  );
  // aves vistas en 30 días (eBird, la última de cada especie por provincia) dentro del bloque
  if (recientes === undefined) recientes = leerDatos<{ generado: string; obs: ObsReciente[] }>("espana_recientes.json");
  const obs = (recientes?.obs ?? []).filter((o) => bloqueDe(celda(o.lat, o.lon)) === bloque);
  if (ebird === undefined) ebird = leerDatos("espana_ebird.json");
  const deteccion = ebird
    ? Object.fromEntries(Object.keys(celdas).flatMap((c) => (ebird!.celdas[c] ? [[c, ebird!.celdas[c]]] : [])))
    : null;
  const cuerpo: BloqueEspana = {
    celdas,
    especies,
    cita: cache.fuente?.cita ?? null,
    ebird: deteccion,
    recientes: recientes ? { generado: recientes.generado, obs } : null,
  };
  return Response.json(cuerpo, { headers: { "Cache-Control": "public, max-age=86400" } });
}
