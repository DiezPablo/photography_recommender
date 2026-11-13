"use client";
// Selector del mes del viaje en la cabecera de safaris (T32): fijo y siempre a la vista. Cambiarlo reordena los
// listados, resalta ese mes en los calendarios y cambia el veredicto de la ficha del parque.
import { usePathname, useRouter } from "next/navigation";
import { MESES } from "@/lib/fechas";
import { useHidratado } from "@/lib/almacen";
import { useMesElegido, useMesEnPagina } from "@/lib/mes";

// páginas cuyo contenido calcula el servidor con ?mes=
const SERVIDOR = ["/comparar"];
const CORTOS = MESES.map((m) => m.slice(0, 3));

export default function SelectorMes() {
  const ruta = usePathname();
  const router = useRouter();
  const hidratado = useHidratado();
  // el mes de hoy en el navegador (la cabecera se genera al compilar, quizá otro mes)
  const mesHoy = hidratado ? new Date().getMonth() : 0;
  // solo en el modo Safaris
  const activo =
    hidratado && ruta !== "/" && !ruta.startsWith("/fuentes") && !ruta.startsWith("/fauna") && !ruta.startsWith("/luz");
  useMesEnPagina(mesHoy, activo);
  const [mes, cambiar] = useMesElegido(mesHoy);
  if (!activo) return null;
  return (
    <label className="selector-mes">
      <span className="sr">Mes del viaje</span>
      <select
        value={mes}
        title="Mes del viaje"
        onChange={(e) => {
          const m = Number(e.target.value);
          cambiar(m);
          // las páginas que se pintan en el servidor según el mes (el comparador) se vuelven a pedir
          if (SERVIDOR.some((r) => ruta.startsWith(r)))
            router.replace(`${ruta}${window.location.search}`, { scroll: false });
        }}
      >
        {MESES.map((m, i) => (
          <option key={m} value={i}>
            {CORTOS[i]}
          </option>
        ))}
      </select>
    </label>
  );
}
