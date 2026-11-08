import type { Metadata } from "next";
import Link from "next/link";
import { fechaLocal } from "@/lib/sol";
import MiViaje from "@/features/safaris/componentes/MiViaje";

export const metadata: Metadata = {
  title: "Mi viaje",
  description:
    "Tu safari en una página: itinerario con traslados, qué verás en cada parque ese mes, presupuesto y lista de cosas por hacer. Para compartir o imprimir.",
};

export default function PaginaViaje() {
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  return (
    <main className="calendario safaris viaje">
      <header className="titular">
        <p className="rotulo no-imprimir">
          <Link href="/safaris">Safaris</Link> · mi viaje
        </p>
        <h1>Mi viaje</h1>
      </header>
      <MiViaje mesHoy={mesHoy} />
    </main>
  );
}
