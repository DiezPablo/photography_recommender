// Puntuación de una especie en un lugar y una franja (docs/especificacion-fauna.md, §5). Dos notas, para que un día
// nublado no esconda una especie que sí está:
//   verla         = frecuencia estacional · presencia reciente · ventana de actividad
//   fotografiarla = calidad de luz · tiempo
// y la combinada. Cada factor en [0, 1] con un suelo (no haber avistamientos en 30 días es normal con pocos datos;
// la actividad por hora está sesgada por cuándo sale la gente) y se guarda para el desglose. Media geométrica con
// pesos: un factor bajo resta, pero ninguno anula por sí solo.

export type Actividad = "diurna" | "crepuscular" | "nocturna";

export interface Pesos {
  frecuencia: number;
  presencia: number;
  actividad: number;
  luz: number;
  tiempo: number;
}

export const PESOS: Pesos = { frecuencia: 3, presencia: 1, actividad: 1, luz: 1, tiempo: 1 };

export interface Factor {
  clave: keyof Pesos;
  nombre: string;
  valor: number;
  detalle: string;
}

export interface Puntuacion {
  verla: number;
  fotografiarla: number;
  total: number;
  factores: Factor[];
}

/** ‰ de su grupo → 0-1: 5 ‰ ≈ 0,12; 20 ‰ ≈ 0,4; 50 ‰ ≈ 0,7; 100 ‰ ≈ 0,9. */
export function factorFrecuencia(permil: number | null | undefined): number {
  return permil ? 1 - Math.exp(-permil / 40) : 0;
}

/** Visto en los últimos días: 1 si hace ≤ 7, baja hasta 0,5 a los 30; sin dato, 0,5 (suelo). */
export function factorPresencia(diasDesdeUltimo: number | null | undefined): number {
  if (diasDesdeUltimo === null || diasDesdeUltimo === undefined) return 0.5;
  if (diasDesdeUltimo <= 7) return 1;
  return Math.max(0.5, 1 - (0.5 * (diasDesdeUltimo - 7)) / 23);
}

/** Cuánto encaja la franja con el patrón de la especie; suelo 0,3. `momento`: noche, azul, dorada o día. */
export function factorActividad(actividad: Actividad, momento: "noche" | "azul" | "dorada" | "dia"): number {
  const tabla: Record<Actividad, Record<typeof momento, number>> = {
    diurna: { noche: 0.3, azul: 0.5, dorada: 1, dia: 0.9 },
    crepuscular: { noche: 0.6, azul: 1, dorada: 1, dia: 0.4 },
    nocturna: { noche: 1, azul: 0.8, dorada: 0.5, dia: 0.3 },
  };
  return tabla[actividad][momento];
}

/** Sin tabla de actividad por especie todavía: aves de día, mamíferos al amanecer y al atardecer. */
export function actividadPorDefecto(clase: string): Actividad {
  return clase === "Mammalia" ? "crepuscular" : "diurna";
}

function geometrica(fs: Factor[], pesos: Pesos): number {
  const suma = fs.reduce((a, f) => a + pesos[f.clave], 0);
  if (!suma) return 0;
  return Math.exp(fs.reduce((a, f) => a + pesos[f.clave] * Math.log(Math.max(f.valor, 1e-3)), 0) / suma);
}

export function puntuar(
  entrada: {
    permil: number | null | undefined;
    diasDesdeUltimo?: number | null;
    actividad: Actividad;
    momento: "noche" | "azul" | "dorada" | "dia";
    luz: number;
    tiempo: number;
  },
  pesos: Pesos = PESOS,
): Puntuacion {
  const ver: Factor[] = [
    {
      clave: "frecuencia",
      nombre: "Frecuencia en la época",
      valor: factorFrecuencia(entrada.permil),
      detalle: entrada.permil ? `${entrada.permil} ‰ de su grupo` : "sin datos ese mes",
    },
    {
      clave: "presencia",
      nombre: "Vista hace poco",
      valor: factorPresencia(entrada.diasDesdeUltimo),
      detalle:
        entrada.diasDesdeUltimo === null || entrada.diasDesdeUltimo === undefined
          ? "sin avistamientos recientes registrados"
          : `última hace ${entrada.diasDesdeUltimo} días`,
    },
    {
      clave: "actividad",
      nombre: "Activa a esa hora",
      valor: factorActividad(entrada.actividad, entrada.momento),
      detalle: `especie ${entrada.actividad}, franja ${entrada.momento}`,
    },
  ];
  const foto: Factor[] = [
    { clave: "luz", nombre: "Luz", valor: entrada.luz, detalle: entrada.momento },
    {
      clave: "tiempo",
      nombre: "Tiempo",
      valor: entrada.tiempo,
      detalle: entrada.tiempo < 1 ? "lluvia o viento" : "bueno",
    },
  ];
  // sin frecuencia no hay nada que ver: es el único factor que puede anular
  const verla = ver[0].valor === 0 ? 0 : geometrica(ver, pesos);
  const fotografiarla = geometrica(foto, pesos);
  const total = verla === 0 ? 0 : geometrica([...ver, ...foto], pesos);
  const r = (x: number) => Math.round(x * 100) / 100;
  return { verla: r(verla), fotografiarla: r(fotografiarla), total: r(total), factores: [...ver, ...foto] };
}
