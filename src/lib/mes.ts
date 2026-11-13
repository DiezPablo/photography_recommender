"use client";
// El mes que se está mirando en las tablas de frecuencia, elegido una vez y conservado: vive en la URL
// (?mes=marzo) y en el navegador. Si no se ha elegido, el mes en curso. Los enlaces antiguos con el número
// (?mes=2, de 0 a 11) siguen valiendo.
import { useCallback } from "react";
import { MESES, mesDeParametro } from "@/lib/fechas";

export { mesDeParametro };
import { escribirAlmacen, useAlmacen, useParametrosUrl } from "@/lib/almacen";

const CLAVE = "mes-elegido";

/** [mes elegido 0-11, cambiarlo, si se ha elegido (o es el de hoy por defecto)]. */
export function useMesElegido(mesHoy: number): [number, (m: number) => void, boolean] {
  const [parametros, actualizar] = useParametrosUrl();
  const guardado = mesDeParametro(useAlmacen(CLAVE));
  const enUrl = mesDeParametro(parametros.get("mes"));
  const mes = enUrl ?? guardado ?? mesHoy;
  const cambiar = useCallback(
    (m: number) => {
      escribirAlmacen(CLAVE, MESES[m]);
      actualizar({ mes: MESES[m] });
    },
    [actualizar],
  );
  return [mes, cambiar, enUrl !== null || guardado !== null];
}
