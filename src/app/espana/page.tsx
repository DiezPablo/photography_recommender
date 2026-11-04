// Fauna en España (docs/especificacion-fauna.md), en dos sentidos: «¿Qué veo aquí?» (un lugar y un día → luz,
// tiempo, mejores franjas y especies probables) y «¿Dónde veo…?» (una especie → dónde y cuándo).
import type { Metadata } from "next";
import Link from "next/link";
import PlanificadorEspana from "@/features/espana/PlanificadorEspana";
import DondeVerEspecie from "@/features/espana/DondeVerEspecie";
import FindeEspana from "@/features/espana/FindeEspana";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: "Fauna en España: qué ver, dónde y cuándo",
  description:
    "Qué especies es probable ver en un lugar y un día, con la luz y el tiempo, o dónde y cuándo ver una especie en España.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ modo?: string }> };

export default async function PaginaEspana({ searchParams }: Props) {
  const modo = (await searchParams).modo;
  const donde = modo === "donde";
  const finde = modo === "finde";
  const hoy = fechaLocal(new Date());
  return (
    <main className="calendario safaris espana">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · España
        </p>
        <h1>Fauna en España</h1>
        <p className="entradilla">
          Qué es probable ver en un lugar y un día, con la luz y el tiempo para fotografiar; o, al revés, dónde y cuándo
          ver una especie.
        </p>
      </header>
      <nav className="pestanas-espana" aria-label="Modo">
        <Link href="/espana" aria-current={donde || finde ? undefined : "page"}>
          ¿Qué veo aquí?
        </Link>
        <Link href="/espana?modo=finde" aria-current={finde ? "page" : undefined}>
          Este finde
        </Link>
        <Link href="/espana?modo=donde" aria-current={donde ? "page" : undefined}>
          ¿Dónde veo…?
        </Link>
      </nav>
      {donde ? <DondeVerEspecie hoy={hoy} /> : finde ? <FindeEspana hoy={hoy} /> : <PlanificadorEspana hoy={hoy} />}
      <p className="nota-pie">
        Luz: posición del sol calculada aquí. Tiempo: Open-Meteo (previsión hasta 16 días; más allá, el archivo ERA5 de
        los diez últimos años). Especies: GBIF por cuadrícula europea de 10 km, como frecuencia relativa en su grupo (no
        es una probabilidad: refleja también dónde y cuándo va la gente). Las especies sensibles solo por zonas.
      </p>
    </main>
  );
}
