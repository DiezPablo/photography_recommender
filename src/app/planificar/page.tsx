import type { Metadata } from "next";
import Link from "next/link";
import { fechaLocal } from "@/lib/sol";
import Planificador from "@/features/safaris/componentes/Planificador";
import { paisesPlanificador } from "@/features/safaris/datos";

export const metadata: Metadata = {
  title: "Planifica tu ruta de safari",
  description:
    "Elige país, días, mes y qué animales quieres ver: circuito de parques con noches, traslados por carretera o en avioneta y avisos de itinerarios poco realistas.",
};

export default function PaginaPlanificar() {
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  return (
    <main className="calendario safaris planificar">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · planificador
        </p>
        <h1>Planifica tu ruta</h1>
        <p className="entradilla">
          Dinos dónde, cuántas noches y qué quieres ver, y te proponemos qué parques encadenar, cuántas noches en cada
          uno y cómo moverte entre ellos. El error más común es meter demasiados parques: aquí te avisamos.
        </p>
      </header>
      <Planificador mesHoy={mesHoy} paisesIniciales={paisesPlanificador()} />
    </main>
  );
}
