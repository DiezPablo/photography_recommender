"use client";
// Acción principal de la ficha (T42): añadir el parque a «Mi viaje» (con las noches habituales y el mes elegido),
// o ir al viaje si ya está. En el móvil, fija abajo, encima de la barra de navegación.
import Link from "next/link";
import { guardarViaje, useViajeGuardado } from "@/features/safaris/viaje";
import { useMesElegido } from "@/lib/mes";

export default function BotonViaje({
  id,
  nombre,
  noches,
  mesHoy,
}: {
  id: string;
  nombre: string;
  noches: number;
  mesHoy: number;
}) {
  const viaje = useViajeGuardado();
  const [mes] = useMesElegido(mesHoy);
  const dentro = viaje?.etapas.some((e) => e.id === id) ?? false;
  if (dentro)
    return (
      <span className="accion-viaje">
        <Link href="/viaje" className="accion-principal dentro">
          ✓ En mi viaje · Ver
        </Link>
      </span>
    );
  return (
    <span className="accion-viaje">
      <button
        type="button"
        className="accion-principal"
        onClick={() =>
          guardarViaje(
            viaje
              ? { ...viaje, etapas: [...viaje.etapas, { id, noches }] }
              : { nombre: "Mi safari", etapas: [{ id, noches }], mes, personas: 2, ver: [] },
          )
        }
      >
        + Añadir a mi viaje <small>({noches} noches)</small>
      </button>
    </span>
  );
}
