// Mapa del sitio para los buscadores: páginas fijas, respuestas por mes y país, especies y parques (los
// destacados y los destinos de fauna; los espacios de nivel C no, que tienen poco que contar).
import type { MetadataRoute } from "next";
import { MESES } from "@/lib/fechas";
import { SITIO } from "@/lib/sitio";
import { PAREJAS, clavePareja } from "@/features/safaris/respuestas";
import { cargarMundo, cargarSafaris, paisesDestacados, slugEspecie } from "@/features/safaris/datos";
import { cargarEspana, cargarLugares } from "@/features/espana/datos";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const safaris = cargarSafaris();
  const fecha = safaris?.generado ? new Date(safaris.generado) : new Date();
  const url = (ruta: string, prioridad = 0.5): MetadataRoute.Sitemap[number] => ({
    url: `${SITIO}${ruta}`,
    lastModified: fecha,
    priority: prioridad,
  });
  const destacados = new Set((safaris?.parques ?? []).map((p) => p.id));
  return [
    url("/", 1),
    ...["/especies", "/migracion", "/safari-en", "/temporada-verde", "/guia", "/planificar", "/presupuesto"].map((r) =>
      url(r, 0.8),
    ),
    ...MESES.map((m) => url(`/safari-en/${m}`, 0.8)),
    ...[...paisesDestacados().keys()].map((s) => url(`/safari-en/${s}`, 0.8)),
    ...PAREJAS.flatMap(([a, b]) => MESES.map((_, i) => url(`/safari-en/${clavePareja(a, b, i)}`, 0.6))),
    ...(safaris?.especies ?? []).map((e) => url(`/especie/${slugEspecie(e)}`, 0.7)),
    ...(safaris?.parques ?? []).map((p) => url(`/parque/${p.id}`, 0.7)),
    ...(cargarMundo()?.parques ?? [])
      .filter((p) => !destacados.has(p.id) && p.nivel !== "C")
      .map((p) => url(`/parque/${p.id}`, 0.4)),
    url("/espana", 0.8),
    ...["/mapa", "/espana/hides", "/espana/rarezas", "/espana/normas"].map((r) => url(r, 0.6)),
    ...Object.keys(cargarEspana()?.especies ?? {}).map((k) => url(`/espana/especie/${k}`, 0.5)),
    // fichas de lugares de España: espacios protegidos, observatorios y los puntos de eBird con 100 especies o más
    ...cargarLugares()
      .filter((l) => !l.id.startsWith("eb-") || (l.e ?? 0) >= 100)
      .map((l) => url(`/espana/lugar/${encodeURIComponent(l.id)}`, 0.4)),
  ];
}
