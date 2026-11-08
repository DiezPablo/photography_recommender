// Fauna en España (docs/especificacion-fauna.md). Sin modo, la carta (mapa con la fauna por cuadrícula, la luz y la
// ficha de cada cuadrícula); «¿Qué veo aquí?» (un lugar y un día → luz, tiempo, mejores franjas y especies), «¿Dónde
// veo…?» (una especie → lista de lugares y meses) y «Este finde» siguen con su modo.
import type { Metadata } from "next";
import PlanificadorEspana from "@/features/espana/PlanificadorEspana";
import DondeVerEspecie from "@/features/espana/DondeVerEspecie";
import FindeEspana from "@/features/espana/FindeEspana";
import CartaEspana from "@/features/carta/CartaEspana";
import { especiesPorMes, listaEspeciesEspana } from "@/features/espana/datos";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: "Fauna en España: dónde y cuándo, en el mapa",
  description:
    "Mapa de España por cuadrícula de 10 km: cuánto se registra cada especie cada mes (GBIF y eBird), con la muestra detrás, la luz del día y el tiempo.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ modo?: string; lat?: string; zona?: string }> };

const TITULOS: Record<string, [string, string]> = {
  aqui: ["Cerca de mí", "Las especies probables en un lugar y un día, con la luz y el tiempo para fotografiar."],
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
  const hoy = fechaLocal(new Date());
  if (inicio)
    return (
      <main className="carta-pagina">
        <CartaEspana hoy={hoy} delMes={especiesPorMes()} />
      </main>
    );
  return (
    <main className="calendario safaris espana">
      <header className="titular titular-compacto">
        <h1>{TITULOS[donde ? "donde" : finde ? "finde" : "aqui"][0]}</h1>
        <p className="entradilla">{TITULOS[donde ? "donde" : finde ? "finde" : "aqui"][1]}</p>
      </header>
      {donde ? (
        <DondeVerEspecie hoy={hoy} inicial={listaEspeciesEspana()} />
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
