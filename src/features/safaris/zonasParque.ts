// Zonas de los parques grandes (T38): en el Serengeti, el Masái Mara o el Kruger, dónde dormir decide qué se ve
// cada mes. Cada alojamiento va a la zona de centro más cercano, y el mes recomienda la zona más cercana a donde
// está la migración (migracion.ts). Coordenadas aproximadas del centro de cada zona, escritas a mano.
import { distanciaKm } from "@/lib/fechas";
import { MIGRACION } from "@/features/safaris/migracion";

export interface ZonaParque {
  nombre: string;
  nota: string;
  lat: number;
  lon: number;
}

export const ZONAS_PARQUE: Record<string, ZonaParque[]> = {
  serengeti: [
    {
      nombre: "Centro (Seronera)",
      nota: "Leones y leopardos todo el año; la migración pasa en abril-mayo y noviembre.",
      lat: -2.43,
      lon: 34.82,
    },
    {
      nombre: "Sur (Ndutu y llanuras)",
      nota: "Partos de la migración de diciembre a marzo; muy tranquilo el resto del año.",
      lat: -2.95,
      lon: 34.95,
    },
    {
      nombre: "Corredor occidental (Grumeti)",
      nota: "Cruces del Grumeti en junio y julio; cocodrilos enormes.",
      lat: -2.15,
      lon: 34.25,
    },
    {
      nombre: "Norte (Kogatende y Lamai)",
      nota: "Cruces del río Mara de julio a octubre, con menos vehículos que en Kenia.",
      lat: -1.65,
      lon: 34.9,
    },
    {
      nombre: "Este (Lobo y Namiri)",
      nota: "Kopjes y guepardos; paso de la migración en noviembre y diciembre.",
      lat: -2.1,
      lon: 35.15,
    },
  ],
  "masai-mara": [
    {
      nombre: "Mara Triangle",
      nota: "Al oeste del río Mara: menos vehículos y buenos puntos de cruce.",
      lat: -1.43,
      lon: 34.98,
    },
    {
      nombre: "Reserva central (Talek y Keekorok)",
      nota: "La parte más visitada: mucha fauna y muchos vehículos en temporada alta.",
      lat: -1.55,
      lon: 35.2,
    },
    {
      nombre: "Conservancies del norte y el este",
      nota: "Pocos vehículos por avistamiento, salidas de pista, a pie y de noche (lo permiten las conservancies).",
      lat: -1.3,
      lon: 35.2,
    },
  ],
  kruger: [
    {
      nombre: "Sur (Skukuza y Lower Sabie)",
      nota: "La mayor densidad de fauna y de visitantes; los cinco grandes, más fáciles.",
      lat: -25.0,
      lon: 31.6,
    },
    {
      nombre: "Centro (Satara y Olifants)",
      nota: "Llanuras con leones y guepardos; menos tráfico que el sur.",
      lat: -24.3,
      lon: 31.8,
    },
    {
      nombre: "Norte (Letaba, Shingwedzi y Punda Maria)",
      nota: "Remoto y tranquilo: elefantes de grandes colmillos y aves; menos depredadores.",
      lat: -23.2,
      lon: 31.4,
    },
  ],
};

/** Zona más cercana a un punto. */
export function zonaDe(parque: string, p: { lat: number; lon: number }): ZonaParque | null {
  const zonas = ZONAS_PARQUE[parque];
  if (!zonas) return null;
  return zonas.reduce((a, b) => (distanciaKm(p, a) <= distanciaKm(p, b) ? a : b));
}

/** La zona recomendada cada mes (índice 0-11; null si no hay recomendación): la más cercana a la migración, si
 * está a menos de 150 km del centro de alguna zona del parque. */
export function zonasRecomendadas(parque: string): (string | null)[] {
  const zonas = ZONAS_PARQUE[parque];
  return Array.from({ length: 12 }, (_, i) => {
    const m = MIGRACION.find((z) => z.mes === i + 1);
    if (!zonas || !m) return null;
    const z = zonaDe(parque, m)!;
    return distanciaKm(m, z) <= 150 ? z.nombre : null;
  });
}
