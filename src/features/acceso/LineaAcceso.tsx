// Una línea de acceso (spec 023) para los datos de una ficha: el aparcamiento más cercano y los minutos andando,
// con el enlace para llegar en coche. Sin datos, no sale.
import { accesoDe, rutaAparcamiento, textoAcceso } from "@/features/acceso/datos";

export default function LineaAcceso({ catalogo, id }: { catalogo: "luz" | "fauna"; id: string }) {
  const a = accesoDe(catalogo, id);
  if (!a) return null;
  return (
    <div title="Aparcamiento de OpenStreetMap; minutos estimados en línea recta por las vueltas del camino">
      <dt>Acceso</dt>
      <dd className="acceso">
        {textoAcceso(a)} ·{" "}
        <a href={rutaAparcamiento(a)} target="_blank" rel="noopener">
          llegar en coche ↗
        </a>
      </dd>
    </div>
  );
}
