// Los parques donde se ha registrado un mamífero (clave de GBIF), con su ‰ de los registros de mamíferos del parque
// y la muestra detrás: la capa de fauna de la carta de safaris.
import { parquesDeEspecie } from "@/features/carta/mundo";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

export async function GET(_: Request, { params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  if (!/^\d+$/.test(clave)) return new Response("Clave no válida", { status: 400 });
  return Response.json({ parques: parquesDeEspecie(clave) }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
