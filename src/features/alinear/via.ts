// El núcleo de la Vía Láctea sobre un objeto (spec 026, decisión 0027). El núcleo (Sagitario A*) es un punto fijo del
// cielo: cada noche pasa por el mismo azimut a la misma altura, unos 4 minutos antes que la anterior. Así que, para
// verlo encima de un objeto, basta con ponerse en la dirección contraria a ese azimut y esperar a la hora a la que
// pasa por ahí; la distancia solo cambia el tamaño del objeto en la foto. Lo que decide la fecha es que a esa hora
// sea noche cerrada (sol 18° bajo el horizonte) y no haya luna (bajo el horizonte o casi nueva).
//
// Para cada dirección (cada 10°) en la que el núcleo pasa a 8° de altura o más: la altura a la que pasa, las noches
// buenas de los próximos doce meses agrupadas en ventanas, a qué hora y a qué distancia ponerse. Puro.
import { Body, DefineStar, Equator, Illumination, Observer, SiderealTime } from "astronomy-engine";
import { alturaAparente, destino, posicion } from "./calculo";

// Sagitario A* (J2000): 17 h 45 min 40,04 s; −29° 00′ 28″
DefineStar(Body.Star1, 17.761122, -29.007806, 26_000);

/** por debajo, la bruma del horizonte se come el núcleo */
export const ALTURA_MINIMA_NUCLEO = 8;
const SOL_NOCHE = -18;
/** luna «que no molesta»: bajo el horizonte o con menos de esto iluminado */
const LUNA_MAXIMA = 0.15;
const PASO_RUMBO = 10;
/** lo alto del objeto, al menos tantos grados por debajo del núcleo */
const HUECO = 5;
const DIA_SIDEREO = 0.9972695663;

export interface DireccionVia {
  /** hacia dónde se mira (azimut del núcleo y del objeto) */
  rumbo: number;
  /** altura del núcleo al pasar por ese rumbo */
  altura: number;
  /** distancia mínima para que lo alto del objeto quede 5° por debajo del núcleo, en m */
  dMinima: number;
  /** distancia propuesta: lo alto del objeto a un tercio de la altura del núcleo, en m */
  dPropuesta: number;
  lat: number;
  lon: number;
  /** de las direcciones con el núcleo más alto */
  destacada: boolean;
}

export interface TramoVia {
  direccion: DireccionVia;
  /** primera y última noche de la ventana en las que vale, con su hora */
  primera: Date;
  ultima: Date;
  noches: number;
}

export interface VentanaVia {
  /** primera y última noche (fecha de la tarde, AAAA-MM-DD) */
  inicio: string;
  fin: string;
  tramos: TramoVia[];
}

const rad = Math.PI / 180;

/** Refracción (Bennett), en grados, para una altura aparente h. */
function refraccion(h: number): number {
  if (h < -1) return 0;
  return 1 / Math.tan((h + 7.31 / (h + 4.4)) * rad) / 60;
}

/** Altura (con refracción) y azimut del núcleo para un ángulo horario H (horas), desde la latitud dada. */
function altAz(lat: number, dec: number, H: number): { alt: number; az: number } {
  const f = lat * rad;
  const d = dec * rad;
  const h = H * 15 * rad;
  const alt = Math.asin(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(h)) / rad;
  const az = Math.atan2(
    -Math.cos(d) * Math.sin(h),
    Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.sin(f) * Math.cos(h),
  );
  return { alt: alt + refraccion(alt), az: (((az / rad) % 360) + 360) % 360 };
}

/** Posición del núcleo (azimut y altura aparente) desde un punto en un instante. */
export function posicionNucleo(lat: number, lon: number, t: Date) {
  const eq = Equator(Body.Star1, t, new Observer(lat, lon, 0), true, false);
  const lst = SiderealTime(t) + lon / 15;
  return altAz(lat, eq.dec, lst - eq.ra);
}

/** Fecha local (AAAA-MM-DD) de la tarde de la noche que contiene `t`. */
function noche(t: Date, tz: string): string {
  return new Date(t.getTime() - 12 * 3600e3).toLocaleDateString("sv-SE", { timeZone: tz });
}

export function ventanasVia(
  o: { lat: number; lon: number; altura: number; desnivel: number },
  desde: Date,
  tz: string,
  dias = 365,
): { direcciones: DireccionVia[]; ventanas: VentanaVia[] } {
  const obs = new Observer(o.lat, o.lon, 0);
  const eq = Equator(Body.Star1, desde, obs, true, false);
  // el ángulo horario de cada rumbo, en la rama visible (el azimut crece con H de la salida a la puesta)
  const tabla: { H: number; alt: number; az: number }[] = [];
  for (let H = -12; H <= 12; H += 0.005) tabla.push({ H, ...altAz(o.lat, eq.dec, H) });
  const visibles = tabla.filter((x) => x.alt >= ALTURA_MINIMA_NUCLEO);
  if (!visibles.length) return { direcciones: [], ventanas: [] };
  const maxAlt = Math.max(...visibles.map((x) => x.alt));
  const dh = o.altura + o.desnivel;
  const direcciones: DireccionVia[] = [];
  /** ángulo horario de cada dirección */
  const horario = new Map<DireccionVia, number>();
  const azMin = Math.ceil(Math.min(...visibles.map((x) => x.az)) / PASO_RUMBO) * PASO_RUMBO;
  const azMax = Math.max(...visibles.map((x) => x.az));
  for (let A = azMin; A <= azMax; A += PASO_RUMBO) {
    const p = visibles.reduce((m, x) => (Math.abs(x.az - A) < Math.abs(m.az - A) ? x : m));
    if (Math.abs(p.az - A) > 0.5) continue;
    const dMinima = p.alt > HUECO ? dh / Math.tan((p.alt - HUECO) * rad) : Infinity;
    // distancia a la que lo alto queda a un tercio de la altura del núcleo (redondeada a 100 m)
    let dPropuesta = Math.max(100, Math.round(dh / Math.tan((p.alt / 3) * rad) / 100) * 100);
    while (alturaAparente(dh, dPropuesta) > p.alt - HUECO) dPropuesta += 100;
    const punto = destino(o.lat, o.lon, (A + 180) % 360, dPropuesta);
    const d: DireccionVia = {
      rumbo: A,
      altura: p.alt,
      dMinima,
      dPropuesta,
      ...punto,
      destacada: p.alt >= maxAlt - 1,
    };
    direcciones.push(d);
    horario.set(d, p.H);
  }

  // cada día, el instante en que el núcleo pasa por cada rumbo: el siguiente a mediodía con ese tiempo sidéreo
  const buenas: { fecha: string; t: Date; d: DireccionVia }[] = [];
  const t0 = Date.parse(`${desde.toISOString().slice(0, 10)}T12:00:00Z`);
  for (let i = 0; i < dias; i++) {
    const mediodia = new Date(t0 + i * 864e5);
    const lst = SiderealTime(mediodia) + o.lon / 15;
    for (const d of direcciones) {
      const horas = (((eq.ra + horario.get(d)! - lst) % 24) + 24) % 24;
      const t = new Date(mediodia.getTime() + horas * DIA_SIDEREO * 3600e3);
      if (posicion("sol", o.lat, o.lon, t).alt > SOL_NOCHE) continue;
      if (posicion("luna", o.lat, o.lon, t).alt > 0 && Illumination(Body.Moon, t).phase_fraction > LUNA_MAXIMA)
        continue;
      buenas.push({ fecha: noche(t, tz), t, d });
    }
  }

  // ventanas: noches seguidas con al menos una dirección buena
  const fechas = [...new Set(buenas.map((b) => b.fecha))].sort();
  const ventanas: VentanaVia[] = [];
  let grupo: string[] = [];
  const cerrar = () => {
    if (!grupo.length) return;
    const dentro = buenas.filter((b) => grupo.includes(b.fecha));
    const tramos: TramoVia[] = [];
    for (const d of direcciones) {
      const xs = dentro.filter((b) => b.d === d).sort((a, b) => a.t.getTime() - b.t.getTime());
      if (xs.length) tramos.push({ direccion: d, primera: xs[0].t, ultima: xs[xs.length - 1].t, noches: xs.length });
    }
    ventanas.push({ inicio: grupo[0], fin: grupo[grupo.length - 1], tramos });
    grupo = [];
  };
  for (const f of fechas) {
    const anterior = grupo[grupo.length - 1];
    if (anterior && Date.parse(`${f}T12:00:00Z`) - Date.parse(`${anterior}T12:00:00Z`) > 864e5) cerrar();
    grupo.push(f);
  }
  cerrar();
  return { direcciones, ventanas };
}
