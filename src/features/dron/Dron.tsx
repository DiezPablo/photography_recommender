// «Dron»: si se puede volar en el spot según las zonas UAS de ENAIRE y los espacios protegidos, en una línea de los
// datos del spot (spec 022: antes era un bloque con cada zona). Orientativo: manda la aplicación oficial de ENAIRE.
import { dronDe, TEXTO_NIVEL } from "@/features/dron/datos";

const RESUMEN = {
  no: "El spot está en una zona donde no se puede volar sin una autorización expresa (aeropuerto, zona militar, parque nacional…).",
  permiso: "Se puede volar pidiendo antes permiso o las condiciones al gestor de la zona.",
  condiciones: "Se puede volar respetando las condiciones de la zona (altura máxima, época de cría…).",
  libre:
    "No hay zonas geográficas de UAS ni espacios protegidos en este punto: se aplican las normas generales de la categoría abierta.",
} as const;

/** Una línea en los datos del spot (spec 022): el nivel y el enlace a ENAIRE, que es quien manda. */
export function SelloDron({ id }: { id: string }) {
  const d = dronDe(id);
  if (!d) return null;
  return (
    <div title={RESUMEN[d.estado]}>
      <dt>Dron</dt>
      <dd>
        <span className={`sello-dron dron-${d.estado}`}>{TEXTO_NIVEL[d.estado]}</span> ·{" "}
        <a href="https://drones.enaire.es/" target="_blank" rel="noopener">
          consulta ENAIRE ↗
        </a>
      </dd>
    </div>
  );
}
