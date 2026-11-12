"use client";
// La última ubicación elegida en /fauna (un lugar o «Mi ubicación»), recordada solo en este navegador: así
// «¿Qué veo aquí?» y «Este finde» abren donde lo dejaste.
import { useMemo } from "react";
import { escribirAlmacen, useAlmacen } from "@/lib/almacen";

const CLAVE = "espana-ubicacion";

export interface Ubicacion {
  lat: number;
  lon: number;
  nombre: string | null;
}

export function guardarUbicacion(u: Ubicacion): void {
  escribirAlmacen(CLAVE, JSON.stringify(u));
}

export function useUbicacionGuardada(): Ubicacion | null {
  const bruto = useAlmacen(CLAVE);
  return useMemo(() => {
    if (!bruto) return null;
    try {
      const u = JSON.parse(bruto) as Ubicacion;
      return Number.isFinite(u.lat) && Number.isFinite(u.lon) ? u : null;
    } catch {
      return null;
    }
  }, [bruto]);
}
