// El plan de varios días (spec 016): dónde (comunidad o radio desde un punto), desde cuándo (una fecha o un mes) y
// cuántos días, siempre en la URL de /plan. Puro: lo usan el servidor y el formulario.
import { MESES } from "@/lib/fechas";
import { RADIOS } from "@/features/consulta/consulta";

export interface Plan {
  /** una fecha AAAA-MM-DD (el primer día) o un mes («octubre»: lo habitual, sin fechas) */
  cuando: string;
  dias: number;
  ccaa: string | null;
  lat: number | null;
  lon: number | null;
  km: number;
}

export const DIAS_PLAN = [2, 3, 4, 5, 7];

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** El mes que viene, para cuando la URL no dice cuándo. */
function mesSiguiente(hoy = new Date()): string {
  return MESES[(hoy.getUTCMonth() + 1) % 12];
}

export function leerPlan(q: Params): Plan {
  const cuando = uno(q.cuando).toLowerCase();
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(cuando) && !Number.isNaN(Date.parse(`${cuando}T12:00:00Z`));
  const lat = Number(uno(q.lat));
  const lon = Number(uno(q.lon));
  const conPunto = uno(q.lat) !== "" && Number.isFinite(lat) && Number.isFinite(lon) && lat > 27 && lat < 44.5;
  const km = Number(uno(q.km));
  const dias = Number(uno(q.dias));
  return {
    cuando: fecha || MESES.includes(cuando) ? cuando : mesSiguiente(),
    dias: DIAS_PLAN.includes(dias) ? dias : 3,
    ccaa: conPunto ? null : uno(q.ccaa) || null,
    lat: conPunto ? Math.round(lat * 1000) / 1000 : null,
    lon: conPunto ? Math.round(lon * 1000) / 1000 : null,
    km: RADIOS.includes(km) ? km : 100,
  };
}

export function urlPlan(p: Plan, cambios: Partial<Plan> = {}): string {
  const x = { ...p, ...cambios };
  const q = new URLSearchParams();
  q.set("cuando", x.cuando);
  q.set("dias", String(x.dias));
  if (x.lat !== null && x.lon !== null) {
    q.set("lat", String(x.lat));
    q.set("lon", String(x.lon));
    q.set("km", String(x.km));
  } else if (x.ccaa) q.set("ccaa", x.ccaa);
  return `/plan?${q.toString()}`;
}

/** Las fechas del plan, o null si es un mes (lo habitual, sin días concretos). */
export function fechasPlan(p: Plan): string[] | null {
  if (!/^\d{4}-/.test(p.cuando)) return null;
  const t0 = Date.parse(`${p.cuando}T12:00:00Z`);
  return Array.from({ length: p.dias }, (_, i) => new Date(t0 + i * 86400000).toISOString().slice(0, 10));
}
