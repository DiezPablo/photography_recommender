// Resultados de una consulta (spec 012), en el servidor. Luz: con previsión, el ranking de ese día; más allá, «lo
// habitual» del mes (spec 013). Fauna: con punto, los lugares cerca con lo que hay ese mes; con comunidad o en toda
// España, los fenómenos de fauna en marcha y los espacios protegidos. Siempre filtrado por dónde.
import "server-only";
import { filasHabituales, type TipoHabitual } from "@/features/clima/habitual";
import { activoEnMes, cargarEventos, type EventoNaturaleza } from "@/features/eventos/datos";
import { type LugarCerca, lugaresCerca } from "@/features/fauna/datos";
import { cargar, etiquetaDia, type Filtro } from "@/features/spots/datos";
import { filasRanking } from "@/features/spots/ranking";
import type { FilaRanking } from "@/features/spots/tipos";
import { distanciaKm, MESES } from "@/lib/fechas";
import type { Consulta } from "@/features/consulta/consulta";

export interface Cuando {
  /** índice del día en la previsión, o null si cae fuera */
  d: number | null;
  /** mes 0-11 */
  mes: number;
  /** «hoy», «el sábado 21 nov», «en octubre» */
  texto: string;
  /** con previsión o con lo habitual */
  prevision: boolean;
}

export function resolverCuando(c: Consulta): Cuando {
  const fechas = cargar().informe?.fechas ?? [];
  const hoy = fechas[0] ?? new Date().toISOString().slice(0, 10);
  let fecha: string | null = null;
  if (c.cuando === "hoy") fecha = hoy;
  else if (c.cuando === "manana") fecha = fechas[1] ?? null;
  else if (c.cuando === "finde")
    fecha = fechas.find((f, i) => i > 0 && [6, 0].includes(new Date(`${f}T12:00:00Z`).getUTCDay())) ?? null;
  else if (/^\d{4}-\d{2}-\d{2}$/.test(c.cuando)) fecha = c.cuando;
  const mesNombre = MESES.indexOf(c.cuando);
  if (mesNombre >= 0) return { d: null, mes: mesNombre, texto: `en ${MESES[mesNombre]}`, prevision: false };
  const d = fecha ? fechas.indexOf(fecha) : -1;
  if (d >= 0)
    return { d, mes: Number(fechas[d].slice(5, 7)) - 1, texto: etiquetaDia(fechas[d], d).largo, prevision: true };
  // una fecha fuera de la previsión (o un finde que aún no entra): lo habitual de su mes
  const mes = fecha ? Number(fecha.slice(5, 7)) - 1 : Number(hoy.slice(5, 7)) % 12;
  return { d: null, mes, texto: `en ${MESES[mes]} (sin previsión aún)`, prevision: false };
}

const FILTRO: Record<Consulta["momento"], Filtro> = {
  todos: "todos",
  amanecer: "amanecer",
  atardecer: "atardecer",
  noche: "astro",
};
const TIPO: Record<Consulta["momento"], TipoHabitual> = {
  todos: "atardecer",
  amanecer: "amanecer",
  atardecer: "atardecer",
  noche: "noche",
};

export type FilaLuz = FilaRanking & { km: number | null };

function dondeFiltra<T extends { lat: number; lon: number; ccaa?: string | null }>(c: Consulta, xs: T[]) {
  return xs
    .map((x) => ({ ...x, km: c.lat !== null && c.lon !== null ? distanciaKm({ lat: c.lat, lon: c.lon }, x) : null }))
    .filter((x) => (x.km !== null ? x.km <= c.km : !c.ccaa || x.ccaa === c.ccaa));
}

export function resultadosLuz(c: Consulta, w: Cuando, max = 30): FilaLuz[] {
  const filas = w.d !== null ? filasRanking(w.d, FILTRO[c.momento]) : filasHabituales(w.mes, TIPO[c.momento]);
  return dondeFiltra(c, filas)
    .slice(0, max)
    .map((f) => ({ ...f, km: f.km === null ? null : Math.round(f.km) }));
}

export interface ResultadosFauna {
  lugares: LugarCerca[];
  fenomenos: EventoNaturaleza[];
}

export function resultadosFauna(c: Consulta, w: Cuando): ResultadosFauna {
  const lugares = c.lat !== null && c.lon !== null ? lugaresCerca(c.lat, c.lon, w.mes, 15, Math.min(c.km, 100)) : [];
  const fenomenos = dondeFiltra(
    c,
    (cargarEventos()?.naturaleza ?? []).filter((e) => e.categoria === "fauna" && activoEnMes(e, w.mes)),
  );
  return { lugares, fenomenos };
}

/** Las comunidades con spots, para el formulario. */
export function comunidades(): string[] {
  return [
    ...new Set(
      cargar()
        .spots.map((s) => s.ccaa ?? s.descubierto?.ccaa)
        .filter((x): x is string => !!x),
    ),
  ].sort((a, b) => a.localeCompare(b, "es"));
}

/** Los días de la previsión, para el formulario. */
export function diasPrevision(): { valor: string; texto: string }[] {
  return (cargar().informe?.fechas ?? []).slice(2).map((f, i) => ({ valor: f, texto: etiquetaDia(f, i + 2).largo }));
}
