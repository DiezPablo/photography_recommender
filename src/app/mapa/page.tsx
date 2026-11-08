// La carta de safaris: los parques del mundo en el mapa, con el mismo sistema que la carta de España (rediseño B,
// fase 3). Estado en la URL: especie, mes, parque, centro (c) y zoom (z).
import type { Metadata } from "next";
import CartaMundo from "@/features/carta/CartaMundo";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: "Mapa de safaris: dónde y cuándo",
  description:
    "Los parques y reservas del mundo en un mapa: cuáles están en temporada cada mes y dónde se registra más cada mamífero (GBIF), con la muestra detrás.",
};

export const dynamic = "force-dynamic";

export default function PaginaMapa() {
  return (
    <main className="carta-pagina">
      <CartaMundo hoy={fechaLocal(new Date())} />
    </main>
  );
}
