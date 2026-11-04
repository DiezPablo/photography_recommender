// «Cerca de aquí»: los lugares de fauna más cercanos a un punto (?lat&lon&mes=0-11) con cuántas especies hay en
// sus cuadrículas ese mes y las más destacadas de cada grupo.
import { lugaresCerca } from "@/features/espana/datos";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lon = Number(q.get("lon"));
  const mes = Number(q.get("mes") ?? new Date().getMonth());
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 27 || lat > 44.5 || lon < -19 || lon > 5)
    return new Response("Punto fuera de España", { status: 400 });
  const m = Number.isInteger(mes) && mes >= 0 && mes <= 11 ? mes : new Date().getMonth();
  return Response.json(
    { lugares: lugaresCerca(lat, lon, m) },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
