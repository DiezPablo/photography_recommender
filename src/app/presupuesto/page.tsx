import type { Metadata } from "next";
import Link from "next/link";
import { fechaLocal } from "@/lib/sol";
import Presupuesto from "@/features/safaris/componentes/Presupuesto";

export const metadata: Metadata = {
  title: "Presupuesto de safari sin sorpresas",
  description:
    "Calcula cuánto cuesta tu safari con las tasas oficiales de cada parque, pide presupuesto a varios operadores con el mismo texto y compara sus ofertas sumando lo que no incluyen.",
};

export default function PaginaPresupuesto() {
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  return (
    <main className="calendario safaris presupuesto">
      <header className="titular">
        <p className="rotulo">
          <Link href="/safaris">Safaris</Link> · presupuesto
        </p>
        <h1>Presupuesto sin sorpresas</h1>
        <p className="entradilla">
          Las tasas de los parques son la parte que más sorprende y la única con precio público: aquí van con su fuente.
          El resto lo pones tú con los precios que te den. Luego, el mismo texto para pedir presupuesto a varios
          operadores y una tabla para comparar lo que te ofrecen.
        </p>
      </header>
      <Presupuesto mesHoy={mesHoy} />
    </main>
  );
}
