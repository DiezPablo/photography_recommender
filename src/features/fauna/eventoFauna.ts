// Fenómenos de fauna con varios lugares (spec 014): la berrea, las grullas. Los lugares vienen escritos a mano
// (eventos de `eventos.json`) y la fiabilidad sale de la cuadrícula: lo que se registra de la especie en las
// cuadrículas del lugar en los meses del evento. Solo servidor.
import "server-only";
import { cargarEventos, type EventoNaturaleza, type FenomenoFauna, mesDe } from "@/features/eventos/datos";
import { cargarEspana, claveDe } from "@/features/fauna/datos";
import { confianza, nivelFrecuencia } from "@/features/fauna/frecuencia";
import { celdasEnRadio } from "@/lib/rejilla";

export function fenomenosFauna(): FenomenoFauna[] {
  return cargarEventos()?.fenomenos ?? [];
}

export function getFenomeno(id: string): FenomenoFauna | undefined {
  return fenomenosFauna().find((f) => f.id === id);
}

/** El fenómeno al que pertenece un evento de fauna, si lo hay. */
export function fenomenoDeEvento(idEvento: string): FenomenoFauna | undefined {
  return fenomenosFauna().find((f) => f.eventos.includes(idEvento));
}

/** El fenómeno de una especie (nombre científico), si lo hay. */
export function fenomenoDeEspecie(cientifico: string | null | undefined): FenomenoFauna | undefined {
  if (!cientifico) return undefined;
  const sp = cientifico.split(" ").slice(0, 2).join(" ");
  return fenomenosFauna().find((f) => f.especie === sp);
}

export interface LugarDelFenomeno {
  evento: EventoNaturaleza;
  /** ‰ de los registros de su grupo, el mayor en las cuadrículas del lugar y los meses del evento */
  permil: number | null;
  /** registros del grupo detrás de ese dato */
  muestra: number;
  /** «frecuente (32 ‰) · confianza media», o por qué no hay dato */
  fiabilidad: string;
}

/** Meses (0-11) que toca un evento, contando el paso de diciembre a enero. */
function mesesDe(e: Pick<EventoNaturaleza, "desde" | "hasta">): number[] {
  const meses: number[] = [];
  for (let m = mesDe(e.desde); ; m = (m + 1) % 12) {
    meses.push(m);
    if (m === mesDe(e.hasta)) return meses;
  }
}

/** Los lugares de un fenómeno, primero donde más se registra la especie en esas fechas; a igualdad, por fecha. */
export function lugaresDelFenomeno(f: FenomenoFauna): LugarDelFenomeno[] {
  const eventos = cargarEventos()?.naturaleza ?? [];
  const espana = cargarEspana();
  const clave = claveDe(f.especie);
  const clase = clave ? (espana?.especies[clave]?.clase ?? "Aves") : null;
  const lugares = f.eventos
    .map((id) => eventos.find((e) => e.id === id))
    .filter((e): e is EventoNaturaleza => !!e)
    .map((evento) => {
      let permil: number | null = null;
      let muestra = 0;
      if (espana && clave && clase)
        for (const c of celdasEnRadio(evento.lat, evento.lon, evento.radio_km)) {
          const celda = espana.celdas[c];
          if (!celda) continue;
          for (const m of mesesDe(evento)) {
            const v = celda.e[clave]?.[m];
            const n = celda.m[clase]?.[m] ?? 0;
            if (v !== null && v !== undefined && (permil === null || v > permil)) {
              permil = v;
              muestra = n;
            }
          }
        }
      const conf = confianza(muestra);
      const fiabilidad =
        permil === null || !conf
          ? "sin registros suficientes en la cuadrícula: lugar conocido, dato por confirmar"
          : `${nivelFrecuencia(permil).texto} en la cuadrícula (${Math.round(permil)} ‰) · ${conf.texto}`;
      return { evento, permil: conf ? permil : null, muestra, fiabilidad };
    });
  return lugares.sort((a, b) => (b.permil ?? -1) - (a.permil ?? -1) || a.evento.pico.localeCompare(b.evento.pico));
}
