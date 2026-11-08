// Lo que la carta de safaris enseña de un parque al tocarlo: mamíferos más registrados, meses, temporada y
// aeropuerto más cercano.
import { fichaParque } from "@/features/carta/mundo";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = fichaParque(id);
  if (!f) return Response.json({ error: "Parque no encontrado" }, { status: 404 });
  return Response.json(f, { headers: { "Cache-Control": "public, max-age=86400" } });
}
