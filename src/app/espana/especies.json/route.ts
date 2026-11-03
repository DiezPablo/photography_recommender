// Lista de especies de España para el buscador de «¿Dónde veo…?»: clave de GBIF, nombres y en cuántas celdas está.
import { cargarEspana } from "@/features/espana/datos";

export const dynamic = "force-static";

export function GET() {
  const e = cargarEspana();
  if (!e) return Response.json({ especies: [] });
  const celdas = new Map<string, number>();
  for (const c of Object.values(e.celdas)) for (const k of Object.keys(c.e)) celdas.set(k, (celdas.get(k) ?? 0) + 1);
  const especies = Object.entries(e.especies)
    .map(([k, v]) => ({ k, n: v.n, c: v.c, clase: v.clase ?? null, celdas: celdas.get(k) ?? 0 }))
    .filter((x) => x.celdas > 0)
    .sort((a, b) => b.celdas - a.celdas);
  return Response.json({ especies });
}
