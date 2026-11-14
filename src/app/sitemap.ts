// Mapa del sitio para los buscadores: las páginas fijas de los dos modos, las especies de fauna y las fichas de
// los lugares con más que contar.
import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";
import { cargarEspana, cargarLugares } from "@/features/fauna/datos";
import { fenomenosFauna } from "@/features/fauna/eventoFauna";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const espana = cargarEspana();
  const fecha = espana?.generado ? new Date(espana.generado) : new Date();
  const url = (ruta: string, prioridad = 0.5): MetadataRoute.Sitemap[number] => ({
    url: `${SITIO}${ruta}`,
    lastModified: fecha,
    priority: prioridad,
  });
  return [
    url("/", 1),
    url("/luz", 0.9),
    ...["/luz/calendario", "/luz/habitual", "/luz/alertas", "/luz/metodo"].map((r) => url(r, 0.6)),
    url("/fauna", 0.9),
    ...["/fauna/hides", "/fauna/rarezas", "/fauna/normas", "/fuentes"].map((r) => url(r, 0.6)),
    ...fenomenosFauna().map((f) => url(`/fauna/evento/${f.id}`, 0.6)),
    ...Object.keys(espana?.especies ?? {}).map((k) => url(`/fauna/especie/${k}`, 0.5)),
    // fichas de lugares: espacios protegidos, observatorios y los puntos de eBird con 100 especies o más
    ...cargarLugares()
      .filter((l) => !l.id.startsWith("eb-") || (l.e ?? 0) >= 100)
      .map((l) => url(`/fauna/lugar/${encodeURIComponent(l.id)}`, 0.4)),
  ];
}
