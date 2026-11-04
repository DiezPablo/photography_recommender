// Buscador de lugares de fauna en España (?q=texto): puntos de eBird, espacios protegidos y observatorios.
import { buscarLugares } from "@/features/espana/datos";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return Response.json(
    { lugares: buscarLugares(q.slice(0, 60)) },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
