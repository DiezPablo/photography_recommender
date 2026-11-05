// Índice del buscador de la cabecera (parques, animales y países), generado en el build. El índice completo del
// explorador pesa más de 1 MB; este lleva solo lo que se busca.
import { entradasBusqueda } from "@/features/safaris/datos";

export const dynamic = "force-static";

export function GET() {
  // solo los destinos de fauna; la página /buscar busca también en el resto de espacios protegidos
  return Response.json(entradasBusqueda(false));
}
