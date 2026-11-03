// Franjas de luz de un día para fotografiar: hora azul (sol entre -6° y -4°), hora dorada (entre -4° y 6°),
// salida y puesta. Puro, con la posición del sol de sol.ts (NOAA).
import { horaSol } from "@/lib/sol";

export interface Franja {
  desde: Date;
  hasta: Date;
}

export interface LuzDia {
  amanecer: Date | null;
  atardecer: Date | null;
  azulManana: Franja | null;
  doradaManana: Franja | null;
  doradaTarde: Franja | null;
  azulTarde: Franja | null;
}

function franja(a: Date | null, b: Date | null): Franja | null {
  return a && b ? { desde: a < b ? a : b, hasta: a < b ? b : a } : null;
}

export function luzDia(fecha: string, lat: number, lon: number): LuzDia {
  const h = (altura: number, manana: boolean) => horaSol(fecha, lat, lon, altura, manana);
  return {
    amanecer: h(-0.833, true),
    atardecer: h(-0.833, false),
    azulManana: franja(h(-6, true), h(-4, true)),
    doradaManana: franja(h(-4, true), h(6, true)),
    doradaTarde: franja(h(6, false), h(-4, false)),
    azulTarde: franja(h(-4, false), h(-6, false)),
  };
}

/** Calidad de la luz para fotografiar a una hora, 0-1: 1 en la hora dorada, algo menos en la azul y con el sol
 * bajo, poca a mediodía con el sol alto, 0 de noche. Factor «luz» de la puntuación. */
export function calidadLuz(instante: Date, luz: LuzDia): number {
  const en = (f: Franja | null) => f && instante >= f.desde && instante <= f.hasta;
  if (en(luz.doradaManana) || en(luz.doradaTarde)) return 1;
  if (en(luz.azulManana) || en(luz.azulTarde)) return 0.6;
  if (!luz.amanecer || !luz.atardecer || instante < luz.amanecer || instante > luz.atardecer) return 0;
  // de día fuera de la hora dorada: mejor cerca de ella que a mediodía
  const mediodia = (luz.amanecer.getTime() + luz.atardecer.getTime()) / 2;
  const mitad = (luz.atardecer.getTime() - luz.amanecer.getTime()) / 2;
  return 0.3 + 0.4 * (Math.abs(instante.getTime() - mediodia) / mitad);
}
