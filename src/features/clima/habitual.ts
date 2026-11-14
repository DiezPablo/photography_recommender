// «Lo habitual» (spec 013): el ranking de spots para un mes cualquiera, cuando no hay previsión. Ordena por la
// frecuencia de días buenos del mes en la zona (climatología ERA5) × la idoneidad del lugar (relieve hacia el sol
// de ese mes, cielo oscuro). Es un criterio de orden explicado, no una nota: solo servidor.
import "server-only";
import { cargarClima, climaDe, type SerieClima } from "@/features/clima/datos";
import { luzDeLugares, type Idoneidad } from "@/features/lugares/datos";
import { cargar, miniatura, type Momento } from "@/features/spots/datos";
import type { FilaRanking } from "@/features/spots/tipos";
import { MESES } from "@/lib/fechas";

export type TipoHabitual = "amanecer" | "atardecer" | "noche";
export const TIPOS_HABITUAL: TipoHabitual[] = ["amanecer", "atardecer", "noche"];
export const NOMBRE_HABITUAL: Record<TipoHabitual, string> = {
  amanecer: "Amanecer",
  atardecer: "Atardecer",
  noche: "Noche",
};
const MOMENTO: Record<TipoHabitual, Momento> = { amanecer: "amanecer", atardecer: "atardecer", noche: "astro" };
const QUE: Record<TipoHabitual, [string, string]> = {
  amanecer: ["amaneceres", "salen buenos"],
  atardecer: ["atardeceres", "salen buenos"],
  noche: ["noches", "salen despejadas"],
};

/** «El 45 % de los atardeceres de octubre salen buenos en la zona». */
export function motivoClima(pct: number, tipo: TipoHabitual, mes: number): string {
  const [que, como] = QUE[tipo];
  return `El ${Math.round(pct)} % de ${tipo === "noche" ? "las" : "los"} ${que} de ${MESES[mes]} ${como} en la zona`;
}

export function rutaHabitual(mes: number, tipo: TipoHabitual): string {
  return `/luz/habitual/${MESES[mes]}/${tipo}`;
}
export function urlHabitual(mes: number, tipo: TipoHabitual): string {
  return `/luz/datos-habitual/${MESES[mes]}/${tipo}`;
}

/** Color de la cifra: aquí no hay nota, así que la escala va por frecuencia (la mitad de los días ya es mucho). */
export function claseHabitual(valor: number): string {
  return valor >= 50 ? "n-top" : valor >= 35 ? "n-buena" : valor >= 20 ? "n-regular" : "n-floja";
}

const grados = (v: number) => `${v.toLocaleString("es-ES", { maximumFractionDigits: 0 })}°`;

/** Por qué el lugar tiene esa idoneidad, en una frase. */
export function motivoLugar(i: Idoneidad, tipo: TipoHabitual, mes: number, cieloMag: number | null): string {
  if (tipo === "noche") {
    const cielo =
      cieloMag === null
        ? "cielo sin medir"
        : `cielo de ${cieloMag.toLocaleString("es-ES", { maximumFractionDigits: 1 })} mag/arcsec²`;
    const sur = i.relieve.sur;
    return sur !== null && sur > 5
      ? `${cielo}, con relieve de ${grados(sur)} al sur (por donde pasa la Vía Láctea)`
      : cielo;
  }
  const r = i.relieve[tipo][mes];
  if (r === null || r <= 1) return "horizonte libre hacia el sol";
  return tipo === "amanecer"
    ? `el sol asoma tras un relieve de ${grados(r)}`
    : `el sol se esconde tras un relieve de ${grados(r)}`;
}

/** ¿Están ya publicadas la climatología y la idoneidad? */
export function hayHabitual(): boolean {
  if (!cargarClima()) return false;
  for (const l of luzDeLugares().values()) return !!l.idoneidad;
  return false;
}

export function filasHabituales(mes: number, tipo: TipoHabitual): FilaRanking[] {
  const clima = cargarClima();
  const luz = luzDeLugares();
  if (!clima) return [];
  const serie: SerieClima = tipo;
  const candidatas: { fila: FilaRanking; valor: number; calidad: number }[] = [];
  for (const s of cargar().spots) {
    const l = luz.get(s.id);
    const pct = climaDe(clima, s.lat, s.lon)?.[serie][mes];
    if (!l?.idoneidad || pct === null || pct === undefined) continue;
    const ido = tipo === "noche" ? l.idoneidad.noche : l.idoneidad[tipo][mes];
    const valor = (pct * ido) / 10; // 0-100: «de cada 100 días, cuántos son buenos aquí»
    candidatas.push({
      valor,
      calidad: s.descubierto?.puntuacion ?? 0,
      fila: {
        id: s.id,
        nombre: s.nombre,
        lat: s.lat,
        lon: s.lon,
        tipo: s.tipo,
        nota: Math.round(valor) / 10,
        clase: claseHabitual(valor),
        cifra: `${Math.round(valor)} %`,
        momento: MOMENTO[tipo],
        hora: "",
        motivos: [
          motivoClima(pct, tipo, mes),
          `Lugar: ${ido.toLocaleString("es-ES")} de 10, ${motivoLugar(l.idoneidad, tipo, mes, l.cielo_mag)}`,
        ],
        autores: s.descubierto?.fotografos ?? 0,
        dudosa: false,
        provincia: s.provincia ?? s.descubierto?.provincia ?? null,
        ccaa: s.ccaa ?? s.descubierto?.ccaa ?? null,
        foto: miniatura(s.descubierto?.galeria?.[0]?.url, 120),
      },
    });
  }
  // a igualdad (muchos lugares tienen el horizonte libre y comparten zona de clima), el más fotografiado
  return candidatas
    .sort((a, b) => b.valor - a.valor || b.calidad - a.calidad || a.fila.nombre.localeCompare(b.fila.nombre))
    .map((c) => c.fila);
}
