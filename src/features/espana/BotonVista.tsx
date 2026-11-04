"use client";
// «La he visto»: marca o desmarca una especie en mi lista (solo en este navegador).
import { useHidratado } from "@/lib/almacen";
import { useVistas, type Vista } from "@/features/espana/vistas";

export default function BotonVista({ clave, especie }: { clave: string; especie: Omit<Vista, "f"> }) {
  const { vistas, alternar } = useVistas();
  const hidratado = useHidratado();
  if (!hidratado) return null;
  const vista = Boolean(vistas[clave]);
  return (
    <button
      type="button"
      className={`boton-vista${vista ? " vista" : ""}`}
      aria-pressed={vista}
      title={vista ? "Quitar de mi lista" : "Añadir a mi lista de especies vistas"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        alternar(clave, especie);
      }}
    >
      {vista ? "✓ vista" : "+ la he visto"}
    </button>
  );
}
