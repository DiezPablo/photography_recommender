// Fauna en España (docs/especificacion-fauna.md), en dos sentidos: «¿Qué veo aquí?» (un lugar y un día → luz,
// tiempo, mejores franjas y especies probables) y «¿Dónde veo…?» (una especie → dónde y cuándo).
import type { Metadata } from "next";
import Link from "next/link";
import PlanificadorEspana from "@/features/espana/PlanificadorEspana";
import DondeVerEspecie from "@/features/espana/DondeVerEspecie";
import FindeEspana from "@/features/espana/FindeEspana";
import InicioEspana from "@/features/espana/InicioEspana";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: "Fauna en España: qué ver, dónde y cuándo",
  description:
    "Qué especies es probable ver en un lugar y un día, con la luz y el tiempo, o dónde y cuándo ver una especie en España.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ modo?: string; lat?: string; zona?: string }> };

const TITULOS: Record<string, [string, string]> = {
  inicio: [
    "Fauna en España",
    "Qué ver cerca de casa, dónde encontrar cada especie y cuándo ir, con la luz y el tiempo.",
  ],
  aqui: ["Qué veo aquí", "Las especies probables en un lugar y un día, con la luz y el tiempo para fotografiar."],
  finde: ["Este finde", "Los mejores sitios cerca de ti para el sábado y el domingo."],
  donde: ["Dónde ver una especie", "Elige una especie: dónde y en qué meses es más fácil."],
};

export default async function PaginaEspana({ searchParams }: Props) {
  const q = await searchParams;
  const modo = q.modo;
  const donde = modo === "donde";
  const finde = modo === "finde";
  // sin modo ni punto, la portada; los enlaces antiguos (?lat=…, ?zona=…) siguen abriendo «¿Qué veo aquí?»
  const inicio = !modo && !q.lat && !q.zona;
  const aqui = !inicio && !donde && !finde;
  const hoy = fechaLocal(new Date());
  return (
    <main className="calendario safaris espana">
      <header className="titular titular-compacto">
        <h1>{TITULOS[inicio ? "inicio" : donde ? "donde" : finde ? "finde" : "aqui"][0]}</h1>
        <p className="entradilla">{TITULOS[inicio ? "inicio" : donde ? "donde" : finde ? "finde" : "aqui"][1]}</p>
      </header>
      {inicio ? (
        <InicioEspana hoy={hoy} />
      ) : donde ? (
        <DondeVerEspecie hoy={hoy} />
      ) : finde ? (
        <FindeEspana hoy={hoy} />
      ) : (
        <PlanificadorEspana hoy={hoy} />
      )}
      <details className="fuentes">
        <summary>De dónde salen los datos</summary>
        <p className="nota-pie">
          Luz: posición del sol calculada aquí. Tiempo y mareas: Open-Meteo (previsión hasta 16 días; más allá, lo
          normal en los diez últimos años). Especies: GBIF por cuadrícula de 10 km (cuánto se ve cada especie respecto a
          las de su grupo) y, para las aves, eBird (en qué parte de las listas sale). Recientes: eBird e iNaturalist.
          Las especies sensibles, solo por zonas.
        </p>
      </details>
    </main>
  );
}
