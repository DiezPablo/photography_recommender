// Diario de salidas de fauna (solo en el navegador).
import type { Metadata } from "next";
import Link from "next/link";
import Diario from "@/features/espana/Diario";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: "Mi diario de salidas",
  description: "Tus salidas de fauna: fecha, lugar, especies y fotos, guardadas solo en tu navegador.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function PaginaDiario() {
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/espana">España</Link> · <Link href="/espana/mis-especies">Mis especies</Link>
        </p>
        <h1>Mi diario de salidas</h1>
      </header>
      <Diario hoy={fechaLocal(new Date())} />
    </main>
  );
}
