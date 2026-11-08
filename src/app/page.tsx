// Portada (decisión de la auditoría, 08-11-2026): la carta de España, la parte más útil de la web. Los safaris
// están en /safaris; los enlaces antiguos a la portada de safaris (con ?ver=, ?q=, ?continente=… o una especie que
// no es una clave de GBIF) se llevan allí con sus parámetros.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CartaEspana from "@/features/carta/CartaEspana";
import { especiesPorMes, listaEspeciesEspana } from "@/features/espana/datos";
import { fechaLocal } from "@/lib/sol";

export const metadata: Metadata = {
  title: { absolute: "Atlas de fauna · dónde y cuándo ver cada animal en España y en el mundo" },
  description:
    "Mapa de España por cuadrícula de 10 km: cuánto se registra cada especie cada mes (GBIF y eBird), con la muestra detrás, la luz del día y el tiempo. Y los parques de safari del mundo.",
};

export const dynamic = "force-dynamic";

/** Los parámetros que entiende la carta; cualquier otro es de la portada antigua de safaris. */
const DE_LA_CARTA = new Set(["especie", "mes", "fecha", "celda", "c", "z", "sin"]);

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Portada({ searchParams }: Props) {
  const q = await searchParams;
  const claves = Object.keys(q);
  const especie = typeof q.especie === "string" ? q.especie : null;
  // ?especie= también lo usaba la portada de safaris (clave de GBIF de un mamífero del mundo): si no es una especie
  // de España, es un enlace antiguo de safaris
  const deSafaris = especie !== null && !listaEspeciesEspana().some((e) => e.k === especie);
  if (claves.some((k) => !DE_LA_CARTA.has(k)) || deSafaris) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) for (const x of [v ?? []].flat()) p.append(k, x);
    redirect(`/safaris?${p}`);
  }
  return (
    <main className="carta-pagina">
      <CartaEspana hoy={fechaLocal(new Date())} delMes={especiesPorMes()} />
    </main>
  );
}
