"use client";
// «Mi viaje»: el plan que une planificador, presupuesto y lista de cosas por hacer. Vive en este navegador
// (localStorage) y se comparte por URL: /viaje?p=serengeti:3,ngorongoro:1&mes=7&personas=2&ver=5219404
import { escribirAlmacen, useAlmacen } from "@/lib/almacen";
import { escribirEtapas, leerEtapas } from "@/features/safaris/presupuesto";
import { fechaValida } from "@/features/safaris/calendario";
import { mesDeParametro } from "@/lib/fechas";

export const CLAVE_VIAJE = "safaris.viaje";
export const CLAVE_LISTA = "safaris.lista";
export const CLAVE_SUPUESTOS = "safaris.supuestos";
export const CLAVE_OFERTAS = "safaris.ofertas";
/** animales vistos, de todos los viajes: clave de GBIF → fecha (AAAA-MM-DD) */
export const CLAVE_VISTOS = "safaris.vistos";

/** Webs oficiales de visado electrónico (para el resto, las recomendaciones de viaje de Exteriores). */
export const VISADO: Record<string, string> = {
  Kenia: "https://www.etakenya.go.ke/",
  Tanzania: "https://visa.immigration.go.tz/",
  Uganda: "https://visas.immigration.go.ug/",
  Ruanda: "https://irembo.gov.rw/",
};
export const EXTERIORES = "https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Recomendaciones-de-viaje.aspx";

export interface Viaje {
  nombre: string;
  etapas: { id: string; noches: number }[];
  /** 0-11 */
  mes: number;
  personas: number;
  /** claves de GBIF de lo que se quiere ver */
  ver: number[];
  /** día de llegada (AAAA-MM-DD), opcional: con él, fechas en el itinerario y calendario del viaje */
  salida?: string;
}

export function leerJson<T>(texto: string | null, defecto: T): T {
  try {
    return texto ? { ...defecto, ...JSON.parse(texto) } : defecto;
  } catch {
    return defecto;
  }
}

export function viajeDeUrl(q: URLSearchParams, mesHoy: number): Viaje | null {
  const etapas = leerEtapas(q.get("p"));
  if (!etapas.length) return null;
  return {
    nombre: q.get("nombre") ?? "Mi safari",
    etapas,
    mes: mesDeParametro(q.get("mes")) ?? mesHoy,
    personas: Math.max(1, Number(q.get("personas") ?? 2) || 2),
    ver: (q.get("ver") ?? "").split(",").filter(Boolean).map(Number),
    salida: fechaValida(q.get("salida")),
  };
}

export function urlDeViaje(v: Viaje, ruta = "/viaje"): string {
  const q = new URLSearchParams({
    p: escribirEtapas(v.etapas) ?? "",
    mes: String(v.mes),
    personas: String(v.personas),
  });
  if (v.ver.length) q.set("ver", v.ver.join(","));
  if (v.nombre && v.nombre !== "Mi safari") q.set("nombre", v.nombre);
  if (v.salida) q.set("salida", v.salida);
  return `${ruta}?${q.toString().replace(/%2C/g, ",").replace(/%3A/g, ":")}`;
}

export function useViajeGuardado(): Viaje | null {
  const t = useAlmacen(CLAVE_VIAJE);
  if (!t) return null;
  try {
    const v = JSON.parse(t) as Viaje;
    return v.etapas?.length ? v : null;
  } catch {
    return null;
  }
}

export function guardarViaje(v: Viaje | null): void {
  escribirAlmacen(CLAVE_VIAJE, v ? JSON.stringify(v) : null);
}
