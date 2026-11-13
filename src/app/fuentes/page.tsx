// Fuentes y licencias de los dos modos, en una sola página (spec 020). La lista vive en src/lib/fuentes.ts.
import type { Metadata } from "next";
import Link from "next/link";
import TablaFuentes from "@/ui/TablaFuentes";

export const metadata: Metadata = {
  title: "Fuentes y licencias",
  description: "De dónde salen los datos de Rasante y con qué licencia: previsión, mapas, fotos, fauna y espacios.",
};

export default function Fuentes() {
  return (
    <main className="prosa">
      <h1>Fuentes y licencias</h1>
      <p>
        Rasante se hace con datos abiertos. Aquí está cada fuente, para qué se usa y con qué licencia se publica. Los
        cálculos (notas, horizonte, frecuencias) son nuestros; cómo se hacen está en{" "}
        <Link href="/luz/metodo">Método</Link>.
      </p>
      <h2>Luz y cielo</h2>
      <TablaFuentes modo="luz" />
      <h2>Fauna</h2>
      <TablaFuentes modo="fauna" />
      <p className="nota-pie">
        Las observaciones de especies sensibles (lince, oso, lobo…) solo se muestran por zonas. Hides, fenómenos y
        normas están escritos a mano, con el enlace a su fuente en cada ficha. Uso personal, sin fines comerciales.
      </p>
    </main>
  );
}
