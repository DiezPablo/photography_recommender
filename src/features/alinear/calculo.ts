// La luna llena sobre un objeto (spec 025, decisión 0026). Dado un objeto (posición y altura), busca en los próximos
// meses cada salida o puesta de la luna casi llena con el sol cerca del horizonte y, para varias distancias, la hora a
// la que la luna queda apoyada en lo alto del objeto y el punto desde el que se ve así.
//
// Geometría: desde un punto a d km, lo alto del objeto se ve a una altura angular a(d) (con la curvatura y la
// refracción terrestre). La luna está apoyada cuando su centro está a a(d) + un radio, y entonces hay que estar
// justo enfrente: a d km del objeto en el rumbo opuesto al de la luna. La dirección de la luna es la misma desde
// cualquier punto a unos km (la diferencia de paralaje es de milésimas de grado). Puro: sin red ni datos.
import { Body, Equator, Horizon, Illumination, MakeTime, Observer, SearchRiseSet } from "astronomy-engine";

const R_TIERRA = 6_371_000;
/** coeficiente de refracción terrestre habitual (como `rasante/terreno/horizonte.py`) */
const K_REFRACCION = 0.13;
/** radio aparente medio de la luna, en grados */
export const RADIO_LUNA = 0.26;
export const DISTANCIAS_KM = [3, 5, 8, 12, 16, 20];
/** por debajo, el objeto queda pegado al horizonte: cualquier cosa delante lo tapa */
const ALTURA_MINIMA = 0.4;
export const ILUMINACION_MINIMA = 0.85;
/** el sol entre estas alturas: paisaje con algo de luz y luna que se distingue */
const SOL_MIN = -12;
const SOL_MAX = 8;

export interface Objeto {
  lat: number;
  lon: number;
  /** altura del objeto sobre su base, en m */
  altura: number;
  /** cuánto más alta está su base que el sitio desde donde se mira, en m (0 si están a la misma altura) */
  desnivel: number;
}

export interface Fila {
  km: number;
  /** instante en el que la luna está apoyada en lo alto */
  instante: Date;
  /** dónde ponerse */
  lat: number;
  lon: number;
  /** hacia dónde mirar (azimut de la luna y del objeto) */
  rumbo: number;
  /** altura angular de lo alto del objeto vista desde ahí */
  alturaObjeto: number;
  /** altura del sol en ese momento */
  sol: number;
  /** diámetro de la luna en metros a esa distancia */
  diametroLuna: number;
  destacada: boolean;
}

export interface Cita {
  momento: "sale" | "se pone";
  /** salida o puesta de la luna en el horizonte */
  instante: Date;
  iluminacion: number;
  filas: Fila[];
}

/** Altura angular (grados) de algo dh metros por encima del ojo, visto a d metros. */
export function alturaAparente(dh: number, d: number): number {
  return (Math.atan2(dh - ((d * d) / (2 * R_TIERRA)) * (1 - K_REFRACCION), d) * 180) / Math.PI;
}

/** Punto a d metros de (lat, lon) con rumbo az (grados). */
export function destino(lat: number, lon: number, az: number, d: number): { lat: number; lon: number } {
  const r = Math.PI / 180;
  const la1 = lat * r;
  const ang = d / R_TIERRA;
  const b = az * r;
  const la2 = Math.asin(Math.sin(la1) * Math.cos(ang) + Math.cos(la1) * Math.sin(ang) * Math.cos(b));
  const lo2 =
    lon * r + Math.atan2(Math.sin(b) * Math.sin(ang) * Math.cos(la1), Math.cos(ang) - Math.sin(la1) * Math.sin(la2));
  return { lat: la2 / r, lon: lo2 / r };
}

/** Azimut y altura de la luna (aparente, con refracción) o del sol (geométrica, como en las definiciones de
 *  crepúsculo) vistos desde un punto. */
export function posicion(cuerpo: "luna" | "sol", lat: number, lon: number, t: Date) {
  const obs = new Observer(lat, lon, 0);
  const b = cuerpo === "luna" ? Body.Moon : Body.Sun;
  const eq = Equator(b, t, obs, true, true);
  const h = Horizon(t, obs, eq.ra, eq.dec, cuerpo === "luna" ? "normal" : undefined);
  return { az: h.azimuth, alt: h.altitude };
}

/** El instante en [a, b] en el que la luna llega a la altura `objetivo` (sube o baja de forma monótona ahí). */
function cuandoAltura(lat: number, lon: number, a: Date, b: Date, objetivo: number, sube: boolean): Date | null {
  const f = (t: Date) => posicion("luna", lat, lon, t).alt - objetivo;
  let lo = a.getTime();
  let hi = b.getTime();
  const fa = f(a);
  const fb = f(b);
  if (sube ? !(fa <= 0 && fb >= 0) : !(fa >= 0 && fb <= 0)) return null;
  for (let i = 0; i < 30 && hi - lo > 5000; i++) {
    const m = (lo + hi) / 2;
    const fm = f(new Date(m));
    if (sube ? fm < 0 : fm > 0) lo = m;
    else hi = m;
  }
  return new Date((lo + hi) / 2);
}

/** Las citas desde `desde` durante `dias` días. */
export function citas(o: Objeto, desde: Date, dias = 365): Cita[] {
  const obs = new Observer(o.lat, o.lon, 0);
  const dh = o.altura + o.desnivel;
  const distancias = DISTANCIAS_KM.map((km) => ({ km, alt: alturaAparente(dh, km * 1000) })).filter(
    (x) => x.alt >= ALTURA_MINIMA,
  );
  const fin = desde.getTime() + dias * 864e5;
  const salida: Cita[] = [];
  for (const [momento, dir] of [
    ["sale", 1],
    ["se pone", -1],
  ] as const) {
    let t = MakeTime(desde);
    for (;;) {
      const ev = SearchRiseSet(Body.Moon, obs, dir, t, 2);
      if (!ev || ev.date.getTime() > fin) break;
      t = ev.AddDays(0.5);
      const iluminacion = Illumination(Body.Moon, ev).phase_fraction;
      if (iluminacion < ILUMINACION_MINIMA) continue;
      const filas: Fila[] = [];
      for (const { km, alt } of distancias) {
        const objetivo = alt + RADIO_LUNA;
        // la luna tarda menos de 3 h en subir (o bajar) 10°; antes de la puesta, buscamos hacia atrás
        const a = momento === "sale" ? ev.date : new Date(ev.date.getTime() - 3 * 3600e3);
        const b = momento === "sale" ? new Date(ev.date.getTime() + 3 * 3600e3) : ev.date;
        const instante = cuandoAltura(o.lat, o.lon, a, b, objetivo, momento === "sale");
        if (!instante) continue;
        const sol = posicion("sol", o.lat, o.lon, instante).alt;
        if (sol < SOL_MIN || sol > SOL_MAX) continue;
        const rumbo = posicion("luna", o.lat, o.lon, instante).az;
        const p = destino(o.lat, o.lon, (rumbo + 180) % 360, km * 1000);
        filas.push({
          km,
          instante,
          lat: p.lat,
          lon: p.lon,
          rumbo,
          alturaObjeto: alt,
          sol,
          diametroLuna: km * 1000 * Math.tan((2 * RADIO_LUNA * Math.PI) / 180),
          destacada: sol >= -6 && sol <= 3,
        });
      }
      if (filas.length) salida.push({ momento, instante: ev.date, iluminacion, filas });
    }
  }
  return salida.sort((x, y) => x.instante.getTime() - y.instante.getTime());
}

/** «día», «hora dorada», «hora azul», «crepúsculo» o «noche», según la altura del sol. */
export function luz(sol: number): string {
  if (sol > 6) return "de día";
  if (sol >= -4) return "hora dorada";
  if (sol >= -6) return "hora azul";
  if (sol >= -12) return "crepúsculo";
  return "de noche";
}

const RUMBOS = ["norte", "nordeste", "este", "sudeste", "sur", "suroeste", "oeste", "noroeste"];
/** El rumbo en palabras (ocho direcciones). */
export function rumboTexto(az: number): string {
  return RUMBOS[Math.round((((az % 360) + 360) % 360) / 45) % 8];
}
