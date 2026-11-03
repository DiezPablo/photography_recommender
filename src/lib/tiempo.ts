// Tiempo para una salida: previsión de Open-Meteo (hasta 16 días, nubes por capas, lluvia, viento) o, más allá,
// climatología de esos días del año en los diez últimos (archivo de Open-Meteo, ERA5). Sin clave; en el navegador.
// Siempre dice cuál de las dos es.

export interface HoraTiempo {
  /** "2026-11-08T07:00" en la hora local del punto */
  hora: string;
  /** el mismo instante en UTC */
  instante: Date;
  nubesBajas: number;
  nubesMedias: number;
  nubesAltas: number;
  probLluvia: number | null;
  lluvia: number;
  viento: number;
  rachas: number;
}

export interface Prevision {
  tipo: "prevision";
  horas: HoraTiempo[];
}

export interface Climatologia {
  tipo: "climatologia";
  /** años usados */
  desde: number;
  hasta: number;
  /** % de días con más de 1 mm */
  diasLluvia: number;
  nubes: number;
  vientoMax: number;
}

export const DIAS_PREVISION = 16;

export function diasHasta(fecha: string, hoy = new Date()): number {
  return Math.round(
    (Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${hoy.toISOString().slice(0, 10)}T12:00:00Z`)) / 864e5,
  );
}

export function urlPrevision(lat: number, lon: number, fecha: string): string {
  const q = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    hourly:
      "cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m",
    timezone: "auto",
    start_date: fecha,
    end_date: fecha,
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

export function leerPrevision(d: {
  hourly: Record<string, (number | string | null)[]>;
  utc_offset_seconds?: number;
}): Prevision {
  const h = d.hourly;
  const desfase = (d.utc_offset_seconds ?? 0) * 1000;
  return {
    tipo: "prevision",
    horas: (h.time as string[]).map((hora, i) => ({
      hora,
      instante: new Date(Date.parse(`${hora}:00Z`) - desfase),
      nubesBajas: Number(h.cloud_cover_low[i] ?? 0),
      nubesMedias: Number(h.cloud_cover_mid[i] ?? 0),
      nubesAltas: Number(h.cloud_cover_high[i] ?? 0),
      probLluvia: h.precipitation_probability[i] === null ? null : Number(h.precipitation_probability[i]),
      lluvia: Number(h.precipitation[i] ?? 0),
      viento: Number(h.wind_speed_10m[i] ?? 0),
      rachas: Number(h.wind_gusts_10m[i] ?? 0),
    })),
  };
}

/** Diez años completos hasta el pasado: la ventana de ±7 días alrededor de la fecha se filtra al leer. */
export function urlClimatologia(
  lat: number,
  lon: number,
  hoy = new Date(),
): { url: string; desde: number; hasta: number } {
  const hasta = hoy.getUTCFullYear() - 1;
  const desde = hasta - 9;
  const q = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    daily: "precipitation_sum,cloud_cover_mean,wind_speed_10m_max",
    timezone: "auto",
    start_date: `${desde}-01-01`,
    end_date: `${hasta}-12-31`,
  });
  return { url: `https://archive-api.open-meteo.com/v1/archive?${q}`, desde, hasta };
}

function diaDelAno(fecha: string): number {
  const d = new Date(`${fecha}T12:00:00Z`);
  return Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5);
}

export function leerClimatologia(
  d: { daily: Record<string, (number | string | null)[]> },
  fecha: string,
  desde: number,
  hasta: number,
  margen = 7,
): Climatologia {
  const objetivo = diaDelAno(fecha);
  const dias = (d.daily.time as string[])
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => {
      const dif = Math.abs(diaDelAno(t) - objetivo);
      return Math.min(dif, 365 - dif) <= margen;
    });
  const media = (clave: string) => {
    const v = dias.map(({ i }) => d.daily[clave][i]).filter((x): x is number => typeof x === "number");
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const conLluvia = dias.filter(({ i }) => Number(d.daily.precipitation_sum[i] ?? 0) > 1).length;
  return {
    tipo: "climatologia",
    desde,
    hasta,
    diasLluvia: dias.length ? Math.round((100 * conLluvia) / dias.length) : 0,
    nubes: Math.round(media("cloud_cover_mean")),
    vientoMax: Math.round(media("wind_speed_10m_max")),
  };
}

/** Previsión si la fecha cae en los próximos 16 días; si no, climatología. */
export async function tiempoPara(lat: number, lon: number, fecha: string): Promise<Prevision | Climatologia> {
  const dias = diasHasta(fecha);
  if (dias >= 0 && dias < DIAS_PREVISION) {
    const r = await fetch(urlPrevision(lat, lon, fecha));
    if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
    return leerPrevision(await r.json());
  }
  const { url, desde, hasta } = urlClimatologia(lat, lon);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
  return leerClimatologia(await r.json(), fecha, desde, hasta);
}

/** Penalización por tiempo, 0-1 (1 = sin problema): lluvia y viento fuerte. Factor «tiempo» de la puntuación. */
export function factorTiempo(h: Pick<HoraTiempo, "probLluvia" | "lluvia" | "rachas">): number {
  const lluvia = h.lluvia > 0.5 ? 0.3 : (h.probLluvia ?? 0) > 60 ? 0.6 : 1;
  const viento = h.rachas > 60 ? 0.4 : h.rachas > 40 ? 0.7 : 1;
  return Math.min(lluvia, viento);
}

/** Las nubes bajas espesas apagan la luz (las altas, en cambio, pueden dar color al amanecer y al atardecer):
 * multiplicador de la calidad de luz, 0,6-1. */
export function factorNubes(h: Pick<HoraTiempo, "nubesBajas">): number {
  return h.nubesBajas > 80 ? 0.6 : h.nubesBajas > 50 ? 0.8 : 1;
}
