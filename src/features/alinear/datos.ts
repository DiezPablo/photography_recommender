// El cielo cerca de un punto para «La Vía Láctea sobre…» (spec 026): la contaminación lumínica del spot del catálogo
// más cercano (atlas de D. Lorenz, la misma de las fichas). Solo servidor.
import "server-only";
import { leerDatos } from "@/lib/datos";
import { distanciaKm } from "@/lib/fechas";

export interface CieloCerca {
  nombre: string;
  km: number;
  bortle: number;
  descripcion: string;
}

interface Rasgo {
  geometry: { coordinates: [number, number] };
  properties: { nombre: string; contaminacion?: { bortle?: number; descripcion?: string } | null };
}

/** El spot con contaminación conocida más cercano, si está a menos de `maxKm`. */
export function cieloCerca(lat: number, lon: number, maxKm = 15): CieloCerca | null {
  let mejor: CieloCerca | null = null;
  for (const f of leerDatos<{ features: Rasgo[] }>("spots.geojson")?.features ?? []) {
    const c = f.properties.contaminacion;
    if (!c?.bortle) continue;
    const [lo, la] = f.geometry.coordinates;
    const km = distanciaKm({ lat, lon }, { lat: la, lon: lo });
    if (km <= maxKm && (!mejor || km < mejor.km))
      mejor = { nombre: f.properties.nombre, km, bortle: c.bortle, descripcion: c.descripcion ?? "" };
  }
  return mejor;
}
