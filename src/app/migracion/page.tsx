import type { Metadata } from "next";
import Link from "next/link";
import { Suscribir } from "@/ui/Suscribir";
import { MESES } from "@/lib/fechas";
import { fechaLocal } from "@/lib/sol";
import Migracion from "@/features/safaris/componentes/Migracion";
import { MIGRACION } from "@/features/safaris/migracion";

export const metadata: Metadata = {
  title: "La gran migración, mes a mes",
  description:
    "Dónde está la gran migración de ñus del Serengeti y el Masái Mara cada mes, cuándo son los cruces del río Mara y los partos, y dónde se han visto ñus en los últimos 30 días.",
};

export default function PaginaMigracion() {
  const mesHoy = Number(fechaLocal(new Date()).slice(5, 7)) - 1;
  return (
    <main className="calendario safaris">
      <header className="titular">
        <p className="rotulo">
          <Link href="/safaris">Safaris</Link> · Serengeti (Tanzania) y Masái Mara (Kenia)
        </p>
        <h1>La gran migración, mes a mes</h1>
        <p className="entradilla">
          Cerca de 1,3 millones de ñus, con cebras y gacelas, dan cada año la vuelta entre el sur del Serengeti y el
          Masái Mara siguiendo la lluvia. Aquí está dónde suelen estar cada mes y dónde los han visto de verdad en las
          últimas semanas: la lluvia adelanta o retrasa el ciclo varias semanas de un año a otro.
        </p>
      </header>
      <Migracion mesHoy={mesHoy} />
      <Suscribir
        ruta="/migracion.ics"
        texto="La migración en tu calendario: cada mes, dónde suelen estar las manadas."
      />
      <section className="seccion">
        <h2 className="rotulo">El año completo</h2>
        <table className="tabla-migracion">
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Dónde</th>
              <th scope="col">Qué pasa</th>
            </tr>
          </thead>
          <tbody>
            {MIGRACION.map((z) => (
              <tr key={z.mes} className={z.mes === mesHoy + 1 ? "actual" : undefined}>
                <th scope="row">{MESES[z.mes - 1]}</th>
                <td>{z.zona}</td>
                <td>
                  {z.que}
                  {z.lluvias ? " (lluvias largas: temporada verde)" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="nota-pie">
          Consejos: para los cruces del Mara, reserva al menos dos o tres días en la misma zona (se espera horas en la
          orilla); julio-agosto es temporada alta en Kenia y el norte de Tanzania, así que conviene reservar con 6-12
          meses. Los partos (febrero) son la mejor época para ver depredadores cazando. Calendario típico según TANAPA,
          el Mara Triangle y Boone et al. (2006); observaciones de iNaturalist (CC BY-NC).
        </p>
      </section>
    </main>
  );
}
