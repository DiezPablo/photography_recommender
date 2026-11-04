// Mareas en la costa: nivel del mar por horas de Open-Meteo Marine (sin clave) → pleamares y bajamares del día
// (máximos y mínimos afinados con una parábola) y la mejor ventana para limícolas: la marea que
// sube las empuja hacia la orilla y se acercan; de ~2 h antes de la pleamar a media hora después.

export interface Marea {
  /** "07:42" en la hora local del punto */
  hora: string;
  tipo: "alta" | "baja";
  m: number;
}

export interface MareasDia {
  /** diferencia entre la pleamar y la bajamar del día, en metros */
  rango: number;
  mareas: Marea[];
  /** ventanas buenas para limícolas, "06:00–08:30" */
  limicolas: string[];
}

/** Por debajo de este rango la marea apenas se nota (Mediterráneo). */
export const MAREA_PEQUENA_M = 0.4;
/** La celda de mar que usa Open-Meteo no puede quedar más lejos: si no, es un punto de interior. */
const MAX_KM_MAR = 15;

export function urlMareas(lat: number, lon: number, fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = (n: number) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
  const q = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    hourly: "sea_level_height_msl",
    timezone: "auto",
    cell_selection: "sea",
    start_date: dia(-1),
    end_date: dia(1),
  });
  return `https://marine-api.open-meteo.com/v1/marine?${q}`;
}

const minutos = (h: string) => Number(h.slice(11, 13)) * 60 + Number(h.slice(14, 16));
const hhmm = (m: number) => {
  const x = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};

function km(a: number, b: number, c: number, d: number) {
  const r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

/** Las mareas del día a partir de la respuesta de Open-Meteo Marine; null en el interior o sin datos. */
export function leerMareas(
  d: { latitude?: number; longitude?: number; hourly?: { time: string[]; sea_level_height_msl: (number | null)[] } },
  fecha: string,
  lat: number,
  lon: number,
): MareasDia | null {
  const h = d.hourly;
  if (!h?.time?.length) return null;
  if (d.latitude !== undefined && d.longitude !== undefined && km(lat, lon, d.latitude, d.longitude) > MAX_KM_MAR)
    return null;
  const t = h.time;
  const v = h.sea_level_height_msl;
  const hoy = t.map((x, i) => [x, v[i]] as const).filter(([x, y]) => x.startsWith(fecha) && y !== null);
  if (hoy.length < 20) return null;
  const valores = hoy.map(([, y]) => y as number);
  const rango = Math.max(...valores) - Math.min(...valores);
  const mareas: Marea[] = [];
  for (let i = 1; i < t.length - 1; i++) {
    const [a, b, c] = [v[i - 1], v[i], v[i + 1]];
    if (a === null || b === null || c === null || !t[i].startsWith(fecha)) continue;
    if ((b > a && b >= c) || (b < a && b <= c)) {
      const curv = a - 2 * b + c;
      const desp = curv ? (0.5 * (a - c)) / curv : 0; // horas, entre −0,5 y 0,5
      mareas.push({
        hora: hhmm(minutos(t[i]) + desp * 60),
        tipo: b > a ? "alta" : "baja",
        m: Math.round((b - 0.25 * (a - c) * desp) * 10) / 10,
      });
    }
  }
  const limicolas =
    rango >= MAREA_PEQUENA_M
      ? mareas
          .filter((m) => m.tipo === "alta")
          .map((m) => `${hhmm(minutos(`0000-00-00T${m.hora}`) - 120)}–${hhmm(minutos(`0000-00-00T${m.hora}`) + 30)}`)
      : [];
  return { rango: Math.round(rango * 10) / 10, mareas, limicolas };
}
