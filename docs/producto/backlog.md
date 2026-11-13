# Backlog

Una línea por spec, en orden de prioridad. Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecha.
Lo crea y reordena `/producto`; lo marca como hecho `/implementar`.

## Ahora
- [~] 001 — Consolidación en photography_recommender (`docs/specs/001-consolidacion.md`): fase 1 hecha (Luz traído, `/luz` y `/fauna`, redirecciones); queda lo de abajo
- [x] 003 — Núcleo común de "lugar" para los dos catálogos: `lugares.json` y validador (`docs/specs/003-esquema-lugar.md`)
- [x] 002 — Auditoría de cobertura y licencias: `python -m rasante auditar`, `docs/datos/` (`docs/specs/002-auditoria-datos.md`)
- [ ] 017 — Cierre del repo anterior: apagar workflows de `photo_recommender` y redirigir su web al dominio nuevo (001 §4)
- [ ] 005 — Safaris del mundo: retirar o dejar congelados (decide Pablo; 001 §4)
- [ ] 006 — Un solo pipeline: `safari/espana` → `rasante/fauna`, un único `comun`, workflows `fauna_*.yml` (001 §4)
- [ ] 007 — Limpieza de datos de fauna: fuera `espana_rutas.json` y `espana_rasante.json`; `espana_*` → `fauna_*` (001 §4)
- [ ] 018 — Cobertura de spots: 30 provincias en el mínimo de 12 y un 32 % en cielo urbano (auditoría 002). CA: criterio de selección revisado (variedad de tipos y cielo, no solo popularidad); ninguna provincia peninsular con menos de 20; informe de auditoría antes y después; `luz_descubrir.yml` vuelve a tener calendario mensual cuando su caché de Commons esté completa
- [x] 019 — Lugares de fauna sin repetir: de 48 y 41 pares duplicados a 3 y 3 (`docs/specs/019-duplicados-fauna.md`)
- [x] 020 — Página única de fuentes (`/fuentes`) y créditos que faltaban (`docs/specs/020-fuentes.md`)
- [~] 021 — eBird a fondo (`docs/specs/021-ebird-a-fondo.md`): hecho el bloque 1 (listas por punto); quedan actividad por provincia y especies de cada punto
- [ ] 012 — Consulta común "cuándo / dónde / qué" en la URL y portada que la lanza. CA: una URL reproduce cualquier resultado; funciona sin JS; pestañas Luz/Fauna
- [ ] 004 — Sistema de diseño y rediseño de portada y fichas (sobre las seis pantallas de `modos.md`); incluye web instalable y modo noche
- [ ] 010 — Ficha de lugar de fauna y ficha de especie: "luz cerca" y poda de bloques
- [ ] 013 — Idoneidad del lugar por momento y resultados fuera de previsión. CA: `luz.idoneidad` (amanecer, atardecer, noche) como criterio de orden con desglose, no como nota validada; ranking para cualquier fecha = climatología × idoneidad, marcado como "lo habitual"
- [ ] 014 — Eventos con varios lugares. CA: la berrea lista ≥ 8 lugares de ≥ 4 comunidades con franja y fiabilidad (semilla a mano + cuadrícula de la especie); `fenomenos.ts` fusionado con `eventos_naturaleza.csv`; los eventos de fauna salen de `/luz/evento`
- [ ] 015 — "¿Dónde verlo?" en eventos de cielo. CA: la ficha de Perseidas enlaza a resultados de noche para su fecha y la zona elegida, con luna y horas de Vía Láctea
- [ ] 016 — Plan de varios días. CA: Asturias-octubre da por día luz + fauna + eventos en temporada; vive en `/plan` (hoy `/viaje` es de safaris)

## Después
- [ ] Rutas de senderismo: valorar integrarlas cuando Luz y Fauna estén montados (decisión 0019; el código está en `photo_recommender`)
- [ ] Poda de "información justa": decidir sobre los candidatos de 001 §5 (alineaciones, mareas, dron, `.ics` por comunidad…)

## Cubierto por la base (no hace falta spec)
- Cuadrícula de fauna, recientes, rarezas y actividad, carta de fauna, "cerca de mí / este finde", hides y normas: ya existían en este repo y están en `/fauna`

## Descartado
- «Mis especies» y «Diario de salidas»: estado de usuario, no "dónde ir" (0016). Quitados el 13-11-2026
- Ficha única que fusione spot y lugar de fauna (0015)
