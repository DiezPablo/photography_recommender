// Niveles de frecuencia (‰ de los registros de su grupo) y confianza según el tamaño de la muestra. Puro: lo usan
// el servidor y el navegador (carta, fichas de lugar y de especie, «cerca de mí»).

export interface NivelFrecuencia {
  clave: "muy-frecuente" | "frecuente" | "ocasional" | "escaso" | "raro" | "sin-datos";
  texto: string;
}

/** Umbrales heredados de los safaris (se calibraron con el Mara y Kruger) y sin recalibrar para España: revisarlos
 * con los datos de la cuadrícula es tarea pendiente. No los cambies sin esa validación. */
export function nivelFrecuencia(permil: number | null | undefined): NivelFrecuencia {
  if (permil === null || permil === undefined) return { clave: "sin-datos", texto: "sin datos" };
  if (permil >= 50) return { clave: "muy-frecuente", texto: "muy frecuente" };
  if (permil >= 20) return { clave: "frecuente", texto: "frecuente" };
  if (permil >= 5) return { clave: "ocasional", texto: "ocasional" };
  if (permil >= 1) return { clave: "escaso", texto: "escaso" };
  return { clave: "raro", texto: "raro" };
}

/** La palabra y la cifra (decisión de la auditoría, 08-11-2026): «frecuente (32 ‰)». La palabra se lee rápido; la
 * cifra recuerda que es lo que se registra (‰ de su grupo), no la probabilidad de verla. */
export function textoFrecuencia(permil: number | null | undefined): string {
  const n = nivelFrecuencia(permil);
  return permil === null || permil === undefined ? n.texto : `${n.texto} (${Math.round(permil)} ‰)`;
}

export interface Confianza {
  clave: "alta" | "media" | "baja";
  texto: string;
}

/** Con menos de 30 fotos del grupo no se da nivel (safari/frecuencia.py); de 30 a 99, confianza baja. */
export function confianza(n: number | null | undefined): Confianza | null {
  if (n === null || n === undefined || n < 30) return null;
  if (n >= 300) return { clave: "alta", texto: "confianza alta" };
  if (n >= 100) return { clave: "media", texto: "confianza media" };
  return { clave: "baja", texto: "confianza baja" };
}
