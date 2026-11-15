# 010 — Fichas de lugar y de especie de fauna: luz cerca y poda

Estado: hecha
Modo: Fauna (y el enlace de vuelta desde Luz)
Situación del fotógrafo: una tarde · un finde

## Problema
Los dos catálogos (decisión 0015) vivían de espaldas: desde un lugar de fauna no se veía qué spot de paisaje tenía
al lado para aprovechar la luz del atardecer, ni al revés. Y la ficha de especie empezaba por cómo fotografiarla,
cuando la pregunta de su pantalla (`docs/producto/modos.md`, pantalla 4) es «¿dónde y cuándo la veo?».

## Alcance
- **Luz cerca** en la ficha de lugar de fauna: los spots a menos de 15 km (`lugares.json`, campo `cerca`) con su
  mejor nota de hoy, el momento y la hora, y la distancia.
- **Fauna cerca** en la ficha de un spot: los lugares de fauna a menos de 15 km. En el pipeline, desde un spot se
  ordenan por interés (espacios protegidos y observatorios, después puntos de eBird con 100 especies o más, y al
  final el resto) y luego por distancia: antes salían cinco puntos de eBird pequeños por delante del parque.
- **Poda de la ficha de especie**: arriba lo que responde a su pregunta (el fenómeno con sus lugares, dónde verla
  y vista estos días); después los momentos especiales, cómo fotografiarla y los hides.
- **Fuera de alcance**: fotos de los lugares de fauna (no hay fuente abierta fiable por lugar) y la consulta
  común (012).

## Criterios de aceptación
- [x] Desde un lugar de fauna se llega a un spot cercano con su nota de hoy, y desde ese spot a la fauna de su
      alrededor (e2e).
- [x] Desde un spot, un espacio protegido a menos de 15 km va antes que un punto de eBird pequeño más cerca (test
      del pipeline).
- [x] La ficha de especie abre con «Dónde verla».
- [ ] Primera publicación de `lugares.json` con el orden nuevo (siguiente `luz_datos.yml`).

## Datos
`lugares.json` (spec 003), que ya se publica dos veces al día; las fichas que se generan bajo demanda lo llevan en
su función (`next.config.ts`).

## Diseño
Lista corta con el sistema de la portada (`docs/diseno/sistema.md`): cifra de la nota, nombre y una línea de
contexto («Atardecer · 17:42 · a 6,3 km»). Fauna, con el punto magenta de su catálogo.
