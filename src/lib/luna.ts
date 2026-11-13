// Fase de la Luna (cálculo local, precisión de unas horas: de sobra para planificar). Una noche oscura (luna
// nueva) es la mejor para la fotografía nocturna y para mamíferos que evitan la luz; con luna llena, siluetas.

const SINODICO = 29.530588853;
// una luna nueva conocida: 6-1-2000 18:14 UTC
const LUNA_NUEVA = Date.UTC(2000, 0, 6, 18, 14);

export interface Luna {
  /** 0 = nueva, 0,5 = llena */
  fase: number;
  /** fracción iluminada, 0-1 */
  iluminada: number;
  nombre: string;
}

export function luna(fecha: string, hora = 22): Luna {
  const t = Date.parse(`${fecha}T${String(hora).padStart(2, "0")}:00:00Z`);
  const dias = (t - LUNA_NUEVA) / 864e5;
  const fase = (((dias / SINODICO) % 1) + 1) % 1;
  const iluminada = (1 - Math.cos(2 * Math.PI * fase)) / 2;
  const nombre =
    fase < 0.03 || fase > 0.97
      ? "luna nueva"
      : fase < 0.22
        ? "creciente"
        : fase < 0.28
          ? "cuarto creciente"
          : fase < 0.47
            ? "creciente gibosa"
            : fase < 0.53
              ? "luna llena"
              : fase < 0.72
                ? "menguante gibosa"
                : fase < 0.78
                  ? "cuarto menguante"
                  : "menguante";
  return { fase, iluminada, nombre };
}

// --- Modo Luz: iluminación de Meeus (cap. 48, error < 1 %), igual que rasante.cielo.astro.iluminacion_luna

const RAD = Math.PI / 180;

/** Fracción iluminada (0-1) en un instante. */
export function iluminacionLuna(t: Date): number {
  const jd = t.getTime() / 864e5 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  const D = (297.8501921 + 445267.1114034 * T) % 360;
  const M = (357.5291092 + 35999.0502909 * T) % 360;
  const Mp = (134.9633964 + 477198.8675055 * T) % 360;
  const i =
    180 -
    D -
    6.289 * Math.sin(Mp * RAD) +
    2.1 * Math.sin(M * RAD) -
    1.274 * Math.sin((2 * D - Mp) * RAD) -
    0.658 * Math.sin(2 * D * RAD) -
    0.214 * Math.sin(2 * Mp * RAD) -
    0.11 * Math.sin(D * RAD);
  return (1 + Math.cos(i * RAD)) / 2;
}

/** Iluminación a medianoche (hora peninsular) de la noche que empieza la tarde de `fecha`. */
export function lunaDeLaNoche(fecha: string): number {
  return iluminacionLuna(new Date(Date.parse(`${fecha}T23:00:00Z`)));
}
