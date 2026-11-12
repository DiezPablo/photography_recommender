// Lugares de fauna dentro del encuadre del mapa (?s&w&n&e&z): espacios protegidos, observatorios y puntos de eBird
// (con el mapa alejado, solo los de 100 especies o más). Como mucho 500, para que el navegador no se atasque.
import { cargarLugares } from "@/features/fauna/datos";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const [s, w, n, e, z] = ["s", "w", "n", "e", "z"].map((k) => Number(q.get(k)));
  if (![s, w, n, e].every(Number.isFinite)) return new Response("Encuadre no válido", { status: 400 });
  const lejos = !(z >= 11);
  const xs = cargarLugares()
    .filter((l) => l.lat >= s && l.lat <= n && l.lon >= w && l.lon <= e)
    .filter((l) => !lejos || !l.id.startsWith("eb-") || (l.e ?? 0) >= 100)
    // primero los espacios protegidos y observatorios, luego los puntos de eBird con más especies
    .sort((a, b) => Number(a.id.startsWith("eb-")) - Number(b.id.startsWith("eb-")) || (b.e ?? 0) - (a.e ?? 0))
    .slice(0, 500)
    .map((l) => [l.id, l.n, l.t, l.lat, l.lon] as const);
  return Response.json(
    { lugares: xs, recortado: xs.length === 500 },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
