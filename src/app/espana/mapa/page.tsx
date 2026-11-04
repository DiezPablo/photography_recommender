// Explorador de fauna en España: mapa con lugares, hides, fenómenos y el mapa de calor de una especie por mes.
import type { Metadata } from "next";
import Link from "next/link";
import MapaExplorador from "@/features/espana/MapaExplorador";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: "Mapa de fauna en España",
  description:
    "Explora en el mapa espacios protegidos, observatorios, hides y dónde se ve cada especie cada mes en España.",
};

export const dynamic = "force-dynamic";

export default function PaginaMapa() {
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · <Link href="/espana">España</Link>
        </p>
        <h1>Mapa de fauna</h1>
      </header>
      <MapaExplorador hoy={fechaLocal(new Date())} />
    </main>
  );
}
