// «Este finde cerca de mí»: los lugares cercanos ordenados para el sábado y el domingo por fauna del mes, tiempo
// (lluvia y viento en la mejor franja, mañana o tarde) y distancia, con el desglose de cada factor. Sin servidor
// para el tiempo: una sola petición a Open-Meteo con todos los puntos.
import { leerPrevision, type HoraTiempo } from "@/lib/tiempo";

/** Los días del próximo fin de semana (sábado y domingo; si hoy es domingo, solo hoy), como "aaaa-mm-dd". */
export function diasFinde(hoy: string): string[] {
  const d = new Date(`${hoy}T12:00:00Z`);
  const dow = d.getUTCDay();
  const dia = (n: number) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
  if (dow === 0) return [hoy];
  const hastaSabado = (6 - dow + 7) % 7;
  return [dia(hastaSabado), dia(hastaSabado + 1)];
}

export function urlPrevisionVarios(puntos: { lat: number; lon: number }[], desde: string, hasta: string): string {
  const q = new URLSearchParams({
    latitude: puntos.map((p) => p.lat.toFixed(3)).join(","),
    longitude: puntos.map((p) => p.lon.toFixed(3)).join(","),
    hourly:
      "cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m",
    timezone: "auto",
    start_date: desde,
    end_date: hasta,
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

/** Open-Meteo devuelve un objeto con un punto y una lista con varios. */
export function leerPrevisionVarios(d: unknown): HoraTiempo[][] {
  const lista = Array.isArray(d) ? d : [d];
  return lista.map((x) => leerPrevision(x as Parameters<typeof leerPrevision>[0]).horas);
}

export interface TiempoDia {
  valor: number;
  franja: "mañana" | "tarde";
  probLluvia: number;
  rachas: number;
}

const FRANJAS: [TiempoDia["franja"], number, number][] = [
  ["mañana", 7, 11],
  ["tarde", 16, 20],
];

/** El tiempo de una franja concreta del día (para el itinerario: mañana en un sitio, tarde en otro). */
export function tiempoFranja(horas: HoraTiempo[], fecha: string, franja: TiempoDia["franja"]): TiempoDia | null {
  const [, desde, hasta] = FRANJAS.find(([f]) => f === franja)!;
  const hs = horas.filter((h) => {
    const hora = Number(h.hora.slice(11, 13));
    return h.hora.startsWith(fecha) && hora >= desde && hora <= hasta;
  });
  if (!hs.length) return null;
  const probLluvia = Math.max(...hs.map((h) => h.probLluvia ?? (h.lluvia > 0.2 ? 80 : 0)));
  const rachas = Math.max(...hs.map((h) => h.rachas));
  const valor = (1 - (0.7 * probLluvia) / 100) * (rachas > 50 ? 0.6 : rachas > 35 ? 0.8 : 1);
  return { valor, franja, probLluvia, rachas: Math.round(rachas) };
}

/** Un día del itinerario: el mejor sitio de mañana y, para la tarde, el mejor de los demás a menos de `maxKm` del
 * de la mañana (para no cruzar media España); cada uno con su nota. `notas[i]` es la nota de cada lugar para
 * la franja dada. */
export function planDia<T extends { lat: number; lon: number }>(
  lugares: T[],
  notaManana: (i: number) => number,
  notaTarde: (i: number) => number,
  maxKm = 60,
): { manana: number; tarde: number | null; km: number | null } | null {
  if (!lugares.length) return null;
  const idx = lugares.map((_, i) => i);
  const manana = idx.reduce((a, b) => (notaManana(b) > notaManana(a) ? b : a));
  const candidatos = idx.filter((i) => i !== manana && kmEntre(lugares[i], lugares[manana]) <= maxKm);
  const tarde = candidatos.length ? candidatos.reduce((a, b) => (notaTarde(b) > notaTarde(a) ? b : a)) : null;
  return { manana, tarde, km: tarde === null ? null : Math.round(kmEntre(lugares[manana], lugares[tarde])) };
}

function kmEntre(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = Math.PI / 180;
  const x =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

/** Calendario (.ics) del plan: un evento por salida, con la hora dorada y el lugar. */
export function icsPlan(
  salidas: { titulo: string; inicio: Date; fin: Date; lugar: string; lat: number; lon: number; nota: string }[],
): string {
  const f = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const esc = (t: string) => t.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ahora = f(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Safaris//Fauna en España//ES",
    ...salidas.flatMap((s, i) => [
      "BEGIN:VEVENT",
      `UID:finde-${f(s.inicio)}-${i}@safarirecommender.vercel.app`,
      `DTSTAMP:${ahora}`,
      `DTSTART:${f(s.inicio)}`,
      `DTEND:${f(s.fin)}`,
      `SUMMARY:${esc(s.titulo)}`,
      `LOCATION:${esc(s.lugar)}`,
      `GEO:${s.lat};${s.lon}`,
      `DESCRIPTION:${esc(s.nota)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");
}

/** La mejor franja del día (mañana 7-11 o tarde 16-20, cuando más se mueve la fauna) por lluvia y rachas. */
export function tiempoDia(horas: HoraTiempo[], fecha: string): TiempoDia | null {
  let mejor: TiempoDia | null = null;
  for (const [franja, desde, hasta] of FRANJAS) {
    const hs = horas.filter((h) => {
      const hora = Number(h.hora.slice(11, 13));
      return h.hora.startsWith(fecha) && hora >= desde && hora <= hasta;
    });
    if (!hs.length) continue;
    const probLluvia = Math.max(...hs.map((h) => h.probLluvia ?? (h.lluvia > 0.2 ? 80 : 0)));
    const rachas = Math.max(...hs.map((h) => h.rachas));
    const valor = (1 - (0.7 * probLluvia) / 100) * (rachas > 50 ? 0.6 : rachas > 35 ? 0.8 : 1);
    if (!mejor || valor > mejor.valor) mejor = { valor, franja, probLluvia, rachas: Math.round(rachas) };
  }
  return mejor;
}

export interface Factor {
  nombre: string;
  valor: number;
  detalle: string;
}

/** Nota 0-1 de un lugar un día: fauna del mes (especies esperadas con los mismos registros en todas partes,
 * relativas al mejor de la lista, con raíz para no aplastar a los pequeños), tiempo y distancia (hasta un 40 % menos
 * en el límite del radio); un fenómeno en su mes suma un 15 %. Con el recuento bruto de especies ganaban los sitios
 * más visitados (análisis del 09-11-2026). */
export function puntuarFinde(e: {
  especies: number;
  /** especies esperadas en 100 registros (rarefacción); sin ella, el recuento bruto */
  esperadas?: number;
  maxEspecies: number;
  km: number;
  maxKm: number;
  tiempo: TiempoDia | null;
  fenomeno: string | null;
}): { total: number; factores: Factor[] } {
  const riqueza = e.esperadas ?? e.especies;
  const fauna = e.maxEspecies ? Math.sqrt(Math.min(1, riqueza / e.maxEspecies)) : 0;
  const tiempo = e.tiempo?.valor ?? 0.7;
  const distancia = 1 - 0.4 * Math.min(1, e.km / e.maxKm);
  const extra = e.fenomeno ? 1.15 : 1;
  const factores: Factor[] = [
    {
      nombre: "Fauna este mes",
      valor: fauna,
      detalle:
        e.esperadas !== undefined
          ? `unas ${Math.round(e.esperadas)} especies esperadas en 100 registros (${e.especies} con registros en sus cuadrículas)`
          : `${e.especies} especies en sus cuadrículas`,
    },
    {
      nombre: "Tiempo",
      valor: tiempo,
      detalle: e.tiempo
        ? `mejor por la ${e.tiempo.franja}: ${e.tiempo.probLluvia} % de lluvia, rachas de ${e.tiempo.rachas} km/h`
        : "sin previsión",
    },
    { nombre: "Distancia", valor: distancia, detalle: `a ${e.km.toLocaleString("es-ES")} km` },
  ];
  if (e.fenomeno) factores.push({ nombre: "Fenómeno", valor: 1, detalle: e.fenomeno });
  return { total: Math.min(1, fauna * tiempo * distancia * extra), factores };
}
