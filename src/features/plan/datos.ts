// El plan de varios días (spec 016), en el servidor. Cada día se arma alrededor de un atardecer (el ancla, en una
// zona distinta de la de los otros días si se puede) y junta lo que hay cerca: un amanecer, un lugar de fauna con lo
// que se registra ese mes, el fenómeno de fauna en marcha más cercano y, si la noche es oscura, un cielo para la Vía
// Láctea. Con fechas dentro de la previsión manda el ranking de ese día; más allá, «lo habitual» del mes (spec 013).
import "server-only";
import { filasHabituales, type TipoHabitual } from "@/features/clima/habitual";
import { dondeFiltra } from "@/features/consulta/resultados";
import {
  activoEn,
  activoEnMes,
  cargarEventos,
  type EventoNaturaleza,
  type LluviaMeteoros,
} from "@/features/eventos/datos";
import { type LugarCerca, lugaresCerca } from "@/features/fauna/datos";
import { cargar, etiquetaDia, type Filtro } from "@/features/spots/datos";
import { filasRanking } from "@/features/spots/ranking";
import type { FilaRanking } from "@/features/spots/tipos";
import { distanciaKm, MESES } from "@/lib/fechas";
import { lunaDeLaNoche } from "@/lib/luna";
import { fechasPlan, type Plan } from "@/features/plan/plan";

/** Distancia máxima del ancla del día a lo demás de ese día. */
export const RADIO_DIA_KM = 60;
/** Distancia mínima entre las anclas de dos días, para que cada día sea una zona. */
const SEPARACION_KM = 25;
/** Por debajo de esta luna (fracción iluminada a medianoche), la noche es buena para la Vía Láctea. */
const LUNA_OSCURA = 0.3;
/** Con previsión, un amanecer o una noche entran en el plan si su nota es al menos «regular». */
export const NOTA_MINIMA = 4.5;

export interface DiaPlan {
  n: number;
  fecha: string | null;
  /** «sábado 10 octubre» o «Día 1» */
  etiqueta: string;
  prevision: boolean;
  /** provincia del atardecer: la zona del día */
  zona: string | null;
  atardecer: FilaRanking | null;
  amanecer: (FilaRanking & { km: number }) | null;
  noche: (FilaRanking & { km: number; motivo: string }) | null;
  fauna: LugarCerca | null;
  fenomeno: (EventoNaturaleza & { km: number }) | null;
}

export interface CieloPlan {
  meteoros: LluviaMeteoros[];
  lunaNueva: string[];
  viaLactea: { desde: string; hasta: string }[];
}

export interface ResultadoPlan {
  dias: DiaPlan[];
  /** fenómenos de fauna en marcha en esos días (o ese mes) en la zona */
  temporada: EventoNaturaleza[];
  cielo: CieloPlan;
  mes: number;
  conPrevision: boolean;
}

const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => Math.round(distanciaKm(a, b));

export function armarPlan(p: Plan): ResultadoPlan {
  const fechas = fechasPlan(p);
  const prevision = cargar().informe?.fechas ?? [];
  const mesPlan = fechas ? Number(fechas[0].slice(5, 7)) - 1 : MESES.indexOf(p.cuando);
  const eventos = cargarEventos();

  // las listas de cada día, con caché: lo habitual de un mes es el mismo para todos sus días
  const habituales = new Map<string, FilaRanking[]>();
  const lista = (d: number, mes: number, tipo: TipoHabitual): FilaRanking[] => {
    if (d >= 0) {
      const filtro: Filtro = tipo === "noche" ? "astro" : tipo;
      // el atardecer es el ancla del día aunque salga flojo; lo demás, solo si merece la pena ir
      const filas = filasRanking(d, filtro).filter((f) => tipo === "atardecer" || f.nota >= NOTA_MINIMA);
      return dondeFiltra(p, filas);
    }
    const clave = `${mes}-${tipo}`;
    if (!habituales.has(clave)) habituales.set(clave, dondeFiltra(p, filasHabituales(mes, tipo)));
    return habituales.get(clave)!;
  };

  const usados = new Set<string>();
  const anclas: FilaRanking[] = [];
  const fauna = (eventos?.naturaleza ?? []).filter((e) => e.categoria === "fauna");
  const dias: DiaPlan[] = [];

  for (let i = 0; i < p.dias; i++) {
    const fecha = fechas?.[i] ?? null;
    const d = fecha ? prevision.indexOf(fecha) : -1;
    const mes = fecha ? Number(fecha.slice(5, 7)) - 1 : mesPlan;
    const libres = (xs: FilaRanking[]) => xs.filter((x) => !usados.has(x.id));

    // el ancla: el mejor atardecer libre lejos de las anclas anteriores (si no hay, el mejor libre)
    const atardeceres = libres(lista(d, mes, "atardecer"));
    const atardecer =
      atardeceres.find((x) => anclas.every((a) => distanciaKm(a, x) >= SEPARACION_KM)) ?? atardeceres[0] ?? null;
    const amaneceres = libres(lista(d, mes, "amanecer"));
    const ancla = atardecer ?? amaneceres[0] ?? null;
    if (!ancla) break;
    anclas.push(ancla);
    usados.add(ancla.id);

    const cerca = <T extends { lat: number; lon: number }>(xs: T[]) =>
      xs.map((x) => ({ ...x, km: km(ancla, x) })).find((x) => x.km <= RADIO_DIA_KM) ?? null;

    // sin atardeceres en la zona, el ancla es el propio amanecer
    const amanecer = atardecer ? cerca(amaneceres.filter((x) => !usados.has(x.id))) : { ...ancla, km: 0 };
    if (amanecer) usados.add(amanecer.id);

    // de noche, solo si hay fecha y la luna deja ver la Vía Láctea o hay lluvia de meteoros
    let noche: DiaPlan["noche"] = null;
    if (fecha) {
      const luna = lunaDeLaNoche(fecha);
      const meteoro = eventos?.meteoros.find((m) => m.noche === fecha);
      if (luna <= LUNA_OSCURA || meteoro) {
        const cielo = cerca(libres(lista(d, mes, "noche")));
        if (cielo) {
          usados.add(cielo.id);
          noche = {
            ...cielo,
            motivo: meteoro
              ? `${meteoro.nombre}: máximo esta noche`
              : `Luna al ${Math.round(luna * 100)} %: noche oscura`,
          };
        }
      }
    }

    // fauna: el lugar cerca con más especies esperadas ese mes; y el fenómeno en marcha más cercano
    const lugar =
      lugaresCerca(ancla.lat, ancla.lon, mes, 10, RADIO_DIA_KM)
        .filter((l) => !usados.has(l.id))
        .sort((a, b) => b.esperadas - a.esperadas || a.km - b.km)[0] ?? null;
    if (lugar) usados.add(lugar.id);
    const fenomeno =
      fauna
        .filter((e) => !usados.has(e.id) && (fecha ? activoEn(e, fecha) : activoEnMes(e, mes)))
        .map((e) => ({ ...e, km: km(ancla, e) }))
        .filter((e) => e.km <= e.radio_km + RADIO_DIA_KM)
        .sort((a, b) => a.km - b.km)[0] ?? null;
    if (fenomeno) usados.add(fenomeno.id);

    dias.push({
      n: i + 1,
      fecha,
      etiqueta: fecha ? etiquetaDia(fecha, 2).largo : `Día ${i + 1}`,
      prevision: d >= 0,
      zona: ancla.provincia,
      atardecer,
      amanecer,
      noche,
      fauna: lugar,
      fenomeno,
    });
  }

  // lo de temporada y el cielo de todo el plan
  const enPlan = (e: Pick<EventoNaturaleza, "desde" | "hasta">) =>
    fechas ? fechas.some((f) => activoEn(e, f)) : activoEnMes(e, mesPlan);
  const temporada = dondeFiltra(p, fauna.filter(enPlan));
  const dentro = (f: string) => (fechas ? fechas.includes(f) : Number(f.slice(5, 7)) - 1 === mesPlan);
  // en un mes sin fechas: la próxima vez que llega ese mes (los datos del cielo cubren un año desde hoy)
  const unaVez = <T>(xs: T[], fecha: (x: T) => string) => {
    const delMes = xs.filter((x) => dentro(fecha(x)));
    if (fechas) return delMes;
    const ano = delMes.map((x) => fecha(x).slice(0, 4)).sort()[0];
    return delMes.filter((x) => fecha(x).startsWith(ano));
  };
  const cielo: CieloPlan = {
    meteoros: unaVez(eventos?.meteoros ?? [], (m) => m.noche),
    lunaNueva: unaVez(
      (eventos?.luna ?? []).filter((l) => l.fase === "nueva"),
      (l) => l.fecha,
    ).map((l) => l.fecha),
    viaLactea: (eventos?.via_lactea.ventanas ?? [])
      .filter((v) => (fechas ? fechas.some((f) => v.desde <= f && f <= v.hasta) : dentro(v.luna_nueva)))
      .map((v) => ({ desde: v.desde, hasta: v.hasta })),
  };

  return { dias, temporada, cielo, mes: mesPlan, conPrevision: dias.some((x) => x.prevision) };
}
