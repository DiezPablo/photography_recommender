// «¿Dónde veo esta especie?» en España: sus celdas de 10 km, de más a menos frecuente en el mes (?mes=0-11) o en
// su mejor mes, con el espacio protegido más cercano, la curva del año y el tamaño de muestra; con ?celdas=1, todas
// sus cuadrículas con el ‰ (mapa de calor).
import { cargarEspana, celdasDeEspecie, lugaresDe } from "@/features/espana/datos";

export const dynamicParams = true;

export async function GET(req: Request, { params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  if (!/^\d+$/.test(clave)) return new Response("Clave no válida", { status: 400 });
  const e = cargarEspana();
  if (!e) return Response.json({ error: "Aún no hay datos de España" }, { status: 404 });
  if (!e.especies[clave]) return Response.json({ error: "Especie sin datos en España" }, { status: 404 });
  const q = new URL(req.url).searchParams.get("mes");
  const mes = q !== null && Number(q) >= 0 && Number(q) <= 11 ? Number(q) : null;
  // ?celdas=1: todas sus cuadrículas con el ‰, para el mapa de calor del explorador
  if (new URL(req.url).searchParams.get("celdas"))
    return Response.json(
      { especie: e.especies[clave], celdas: celdasDeEspecie(clave, mes) },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  return Response.json(
    { especie: e.especies[clave], lugares: lugaresDe(clave, mes), cita: e.fuente?.cita ?? null },
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
