"use client";
// El mes del viaje, elegido una vez y conservado en toda la parte de safaris (T32): vive en la URL (?mes=marzo) y
// en el navegador, así que al entrar en un parque o una especie sigue siendo el mismo. Si no se ha elegido, el mes
// en curso. Los enlaces antiguos con el número (?mes=2, de 0 a 11) siguen valiendo.
import { useCallback, useEffect } from "react";
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

/** Lleva el mes elegido a <html data-mes="3"> (1-12, para que el CSS resalte esa columna en todos los
 * calendarios, también los pintados en el servidor) y a la URL de la página si aún no lo tiene. */
export function useMesEnPagina(mesHoy: number, activo: boolean): void {
  const [parametros, actualizar] = useParametrosUrl();
  const [mes, , elegido] = useMesElegido(mesHoy);
  const enUrl = parametros.get("mes");
  useEffect(() => {
    const raiz = document.documentElement;
    if (!activo) {
      delete raiz.dataset.mes;
      return;
    }
    raiz.dataset.mes = String(mes + 1);
    // si lo trae la URL de otra página (un enlace compartido), se guarda; si no, se escribe en esta
    const deUrl = mesDeParametro(enUrl);
    if (deUrl !== null) escribirAlmacen(CLAVE, MESES[deUrl]);
    else if (elegido) actualizar({ mes: MESES[mes] });
  }, [activo, mes, elegido, enUrl, actualizar]);
}
