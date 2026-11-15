// Acceso a cada lugar (spec 023): el aparcamiento más cercano de OpenStreetMap y unos minutos andando, de
// acceso.json (python -m rasante acceso, mensual). Solo servidor.
import "server-only";
import { leerDatos } from "@/lib/datos";

export interface Acceso {
  /** metros en línea recta hasta el aparcamiento */
  m: number;
  /** minutos andando, estimados (línea recta × 1,3 a 4,5 km/h) */
  min: number;
  lat: number;
  lon: number;
  nombre?: string;
}

interface DocAcceso {
  generado: string;
  luz: Record<string, Acceso>;
  fauna: Record<string, Acceso>;
}

let cache: DocAcceso | null | undefined;

function cargar(): DocAcceso | null {
  if (cache === undefined) cache = leerDatos<DocAcceso>("acceso.json");
  return cache;
}

/** El acceso de un spot («luz») o de un lugar de fauna; null si no hay aparcamiento a menos de 2 km o aún no hay datos. */
export function accesoDe(catalogo: "luz" | "fauna", id: string): Acceso | null {
  return cargar()?.[catalogo]?.[id] ?? null;
}

/** «Junto al aparcamiento» o «aparcamiento a 350 m · unos 6 min andando». */
export function textoAcceso(a: Acceso): string {
  if (a.m < 100) return "junto al aparcamiento";
  const distancia =
    a.m < 1000 ? `${a.m} m` : `${(a.m / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} km`;
  return `aparcamiento a ${distancia} · unos ${a.min} min andando`;
}

/** Cómo llegar en coche al aparcamiento (OpenStreetMap). */
export function rutaAparcamiento(a: Acceso): string {
  return `https://www.openstreetmap.org/directions?to=${a.lat}%2C${a.lon}`;
}
