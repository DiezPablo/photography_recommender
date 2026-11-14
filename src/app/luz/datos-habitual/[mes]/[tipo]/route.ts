// JSON estático con todos los spots de «lo habitual» de un mes y momento (spec 013): lo usan el mapa y los
// filtros de distancia y comunidad, igual que el del ranking del día.
import { filasHabituales, type TipoHabitual, TIPOS_HABITUAL } from "@/features/clima/habitual";
import { MESES } from "@/lib/fechas";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return MESES.flatMap((mes) => TIPOS_HABITUAL.map((tipo) => ({ mes, tipo })));
}

export async function GET(_: Request, { params }: { params: Promise<{ mes: string; tipo: string }> }) {
  const { mes, tipo } = await params;
  // sin el motivo del lugar: el JSON lo descarga el móvil
  const filas = filasHabituales(MESES.indexOf(mes), tipo as TipoHabitual).map((f) => ({
    ...f,
    motivos: f.motivos.slice(0, 1),
  }));
  return Response.json(filas);
}
