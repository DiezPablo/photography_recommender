// Mi lista de especies vistas en España (solo en este navegador).
import type { Metadata } from "next";
import Link from "next/link";
import MisEspecies from "@/features/espana/MisEspecies";

export const metadata: Metadata = {
  title: "Mis especies vistas en España",
  description: "Tu lista de especies vistas, guardada solo en tu navegador.",
  robots: { index: false },
};

export default function PaginaMisEspecies() {
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">España</Link>
        </p>
        <h1>Mis especies</h1>
      </header>
      <MisEspecies />
    </main>
  );
}
