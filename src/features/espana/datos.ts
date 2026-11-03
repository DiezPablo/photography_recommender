// Datos de España en el servidor: espana.json (descarga de GBIF por cuadrícula de 10 km) y, para nombrar cada
// celda, los espacios protegidos de España del catálogo mundial.
import "server-only";
import { leerDatos } from "@/lib/datos";
import { centroCelda } from "@/lib/rejilla";
import { distanciaKm } from "@/lib/fechas";
import type { Mundo } from "@/features/safaris/modelo";
import { ZONAS_ESPANA, type BloqueEspana } from "@/features/espana/zonas";

export interface Espana {
  generado: string;
  fuente?: { cita?: string };
  especies: BloqueEspana["especies"];
  celdas: BloqueEspana["celdas"];
}

let espana: Espana | null | undefined;
export function cargarEspana(): Espana | null {
  if (espana === undefined) espana = leerDatos<Espana>("espana.json");
  return espana;
}

let areas: { nombre: string; lat: number; lon: number }[] | undefined;
function areasEspana() {
  if (areas === undefined) {
    const m = leerDatos<Mundo>("safaris_mundo.json");
    const espanaQ = Object.entries(m?.paises ?? {}).find(([, p]) => p.nombre === "España")?.[0];
    areas = [
      ...ZONAS_ESPANA.map((z) => ({ nombre: z.nombre, lat: z.lat, lon: z.lon })),
      ...(m?.parques ?? [])
        .filter((p) => p.pais === espanaQ)
        .map((p) => ({ nombre: p.nombre, lat: p.lat, lon: p.lon })),
    ];
  }
  return areas;
}

/** «Parque nacional de Doñana» si hay un espacio protegido a menos de 15 km del punto. */
export function nombreLugar(lat: number, lon: number): { nombre: string; km: number } | null {
  let mejor: { nombre: string; km: number } | null = null;
  for (const a of areasEspana()) {
    const km = distanciaKm({ lat, lon }, a);
    if (km < 15 && (!mejor || km < mejor.km)) mejor = { nombre: a.nombre, km: Math.round(km) };
  }
  return mejor;
}

export interface LugarEspecie {
  celda: string;
  lat: number;
  lon: number;
  lugar: { nombre: string; km: number } | null;
  /** ‰ de su grupo por mes */
  meses: (number | null)[];
  /** observaciones de su grupo por mes (tamaño de muestra) */
  muestra: number[];
  /** cuadrículas de 10 km del mismo lugar (se agrupan por espacio protegido; los datos, los de la mejor) */
  celdas: number;
}

/** Las celdas donde se ve la especie, de más a menos frecuente en el mes (0-11) o en su mejor mes. */
export function lugaresDe(clave: string, mes: number | null, max = 40): LugarEspecie[] {
  const e = cargarEspana();
  if (!e) return [];
  const clase = e.especies[clave]?.clase ?? "Aves";
  const valor = (meses: (number | null)[]) =>
    mes === null ? Math.max(0, ...meses.map((v) => v ?? 0)) : (meses[mes] ?? 0);
  const ordenadas = Object.entries(e.celdas)
    .filter(([, c]) => c.e[clave])
    .map(([celda, c]) => ({ celda, meses: c.e[clave], muestra: c.m[clase] ?? Array(12).fill(0) }))
    .filter((x) => valor(x.meses) > 0)
    .sort((a, b) => valor(b.meses) - valor(a.meses));
  // un lugar por espacio protegido (Gallocanta son siete cuadrículas): manda la mejor, se cuentan las demás
  const porLugar = new Map<string, LugarEspecie>();
  for (const x of ordenadas) {
    const [lat, lon] = centroCelda(x.celda);
    const lugar = nombreLugar(lat, lon);
    const k = lugar?.nombre ?? x.celda;
    const ya = porLugar.get(k);
    if (ya) ya.celdas++;
    else if (porLugar.size < max)
      porLugar.set(k, {
        ...x,
        lat: Math.round(lat * 1000) / 1000,
        lon: Math.round(lon * 1000) / 1000,
        lugar,
        celdas: 1,
      });
  }
  return [...porLugar.values()];
}
