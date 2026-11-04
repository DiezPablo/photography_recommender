"use client";
// Mi lista de especies vistas: solo en este navegador (localStorage), sin cuentas. Clave de GBIF → nombre, grupo
// y fecha en que la marcaste.
import { useCallback, useMemo } from "react";
import { escribirAlmacen, leerAlmacen, useAlmacen } from "@/lib/almacen";

const CLAVE = "espana-vistas";

export interface Vista {
  n: string;
  c: string | null;
  clase: string | null;
  /** aaaa-mm-dd */
  f: string;
}

function leer(bruto: string | null): Record<string, Vista> {
  if (!bruto) return {};
  try {
    const d = JSON.parse(bruto);
    return d && typeof d === "object" ? (d as Record<string, Vista>) : {};
  } catch {
    return {};
  }
}

export function useVistas() {
  const bruto = useAlmacen(CLAVE);
  const vistas = useMemo(() => leer(bruto), [bruto]);
  const alternar = useCallback((clave: string, e: Omit<Vista, "f">) => {
    const actual = leer(leerAlmacen(CLAVE));
    if (actual[clave]) delete actual[clave];
    else actual[clave] = { ...e, f: new Date().toISOString().slice(0, 10) };
    escribirAlmacen(CLAVE, JSON.stringify(actual));
  }, []);
  const borrarTodo = useCallback(() => escribirAlmacen(CLAVE, null), []);
  return { vistas, alternar, borrarTodo };
}
