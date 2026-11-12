// Lista de especies de España para los buscadores (mapa): clave de GBIF, nombres y en cuántas celdas está.
import { listaEspeciesEspana } from "@/features/fauna/datos";

export const dynamic = "force-static";

export function GET() {
  return Response.json({ especies: listaEspeciesEspana() });
}
