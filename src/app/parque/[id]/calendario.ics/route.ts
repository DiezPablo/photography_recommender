// Calendario suscribible con la buena época de un parque (se repite cada año) y un aviso para reservar.
import { buenaEpoca, cargarSafaris, getParque, getParqueMundo } from "@/features/safaris/datos";
import { CABECERAS_ICS, eventosTemporada, ics, tramos } from "@/features/safaris/calendario";
import { eventosDe } from "@/features/safaris/eventos";
import { SITIO } from "@/lib/sitio";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return (cargarSafaris()?.parques ?? []).map((p) => ({ id: p.id }));
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParque(id);
  const m = p ? undefined : getParqueMundo(id);
  if (!p && !m) return new Response("No existe ese parque", { status: 404 });
  const nombre = (p?.nombre ?? m?.nombre)!;
  const meses = p
    ? p.meses
    : (buenaEpoca({ la: m!.lat, sec: m!.meses_secos, ep: m!.epoca?.meses, em: m!.epoca?.motivo }) ?? []);
  const url = `${SITIO}/parque/${id}`;
  // los fenómenos del parque (partos, cruces, desoves…), cada uno en sus meses
  const fenomenos = eventosDe(id).flatMap((e) =>
    tramos(e.meses).map((t) => ({
      uid: `${e.id}-${t.mes}`,
      mes: t.mes,
      meses: t.meses,
      titulo: `${nombre}: ${e.titulo}`,
      descripcion: e.descripcion,
      url: e.fuente.startsWith("/") ? `${SITIO}${e.fuente}` : e.fuente,
    })),
  );
  return new Response(ics(`Safari: ${nombre}`, [...eventosTemporada(id, nombre, meses, url), ...fenomenos]), {
    headers: CABECERAS_ICS,
  });
}
