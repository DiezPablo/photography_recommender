// Mamíferos registrados en los parques del mundo, para el buscador de la carta de safaris, y cuántos guarda como
// mucho cada parque.
import { especiesMundo, mamiferosPorParque } from "@/features/carta/mundo";

export const dynamic = "force-static";

export function GET() {
  return Response.json({ especies: especiesMundo(), maximo: mamiferosPorParque() });
}
