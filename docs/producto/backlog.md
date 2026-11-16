# Backlog

Una línea por spec, en orden de prioridad. Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecha.
Lo crea y reordena `/producto`; lo marca como hecho `/implementar`.

## Ahora
- [~] 001 — Consolidación en photography_recommender (`docs/specs/001-consolidacion.md`): fase 1 hecha (Luz traído, `/luz` y `/fauna`, redirecciones); queda lo de abajo
- [x] 003 — Núcleo común de "lugar" para los dos catálogos: `lugares.json` y validador (`docs/specs/003-esquema-lugar.md`)
- [x] 002 — Auditoría de cobertura y licencias: `python -m rasante auditar`, `docs/datos/` (`docs/specs/002-auditoria-datos.md`)
- [~] 017 — Cierre del repo anterior: workflows de `photo_recommender` apagados (Pablo, 15-11-2026); falta redirigir su web al dominio nuevo (001 §4)
- [x] 005 — Safaris del mundo, fuera de esta versión (`docs/specs/005-safaris-fuera.md`)
- [x] 006 — Un solo pipeline: Fauna en `rasante/fauna`, un único `comun`, workflows `fauna_*.yml` (`docs/specs/006-un-pipeline.md`)
- [x] 007 — Ficheros de fauna con su nombre: `espana_*` → `fauna_*` con transición sin corte; fuera rutas y `espana_rasante` (`docs/specs/007-ficheros-fauna.md`)
- [x] 018 — Cobertura de spots (`docs/specs/018-cobertura-spots.md`): selección con 20 por provincia, variedad y tope urbano; el descubrimiento solo publica con la popularidad completa y vuelve a ser mensual. 20 o más por provincia salvo Ceuta y Melilla, 20 % de cielo urbano (era 32 %); auditoría del 16-11
- [x] 019 — Lugares de fauna sin repetir: de 48 y 41 pares duplicados a 3 y 3 (`docs/specs/019-duplicados-fauna.md`)
- [x] 020 — Página única de fuentes (`/fuentes`) y créditos que faltaban (`docs/specs/020-fuentes.md`)
- [x] 021 — eBird a fondo (`docs/specs/021-ebird-a-fondo.md`): los tres bloques en producción (listas por punto, actividad por región, especies por punto)
- [x] 012 — Consulta común «cuándo / dónde / qué» en la URL (`/buscar`), lanzada desde la portada, sin JS y con pestañas Luz/Fauna (`docs/specs/012-consulta.md`)
- [x] 004 — Sistema de diseño y portada «¿cuándo tienes tiempo?», web instalable, modo noche y poda del CSS (`docs/specs/004-diseno-portada.md`)
- [x] 010 — Fichas de fauna: «Luz cerca» y «Fauna cerca» entre los dos catálogos, y la de especie empieza por dónde verla (`docs/specs/010-fichas-fauna.md`)
- [x] 013 — Idoneidad del lugar por momento y «lo habitual» de cada mes en `/luz/habitual` (`docs/specs/013-idoneidad.md`)
- [x] 014 — Eventos de fauna con varios lugares: la berrea en `/fauna/evento/berrea`, una sola lista de fenómenos y calendario de fauna (`docs/specs/014-eventos-fauna.md`)
- [x] 015 — «¿Dónde verlo?» en los eventos de cielo: del calendario a «lo habitual» de noche (`docs/specs/015-donde-verlo.md`)
- [x] 022 — Poda de «información justa»: fuera alineaciones, panorama, brújula del sol, marcador, Telegram, `.ics` por comunidad, alojamientos y experimentos; dron y mar en una línea (`docs/specs/022-poda.md`)
- [x] 023 — Acceso a cada spot: aparcamiento más cercano y minutos andando, en las fichas y en el plan (`docs/specs/023-acceso.md`)
- [x] 016 — Plan de varios días en `/plan`: cada día una zona con amanecer, fauna, lo que está en temporada, atardecer y, si toca, noche (`docs/specs/016-plan.md`)

## Después
(vacío)

## Cubierto por la base (no hace falta spec)
- Cuadrícula de fauna, recientes, rarezas y actividad, carta de fauna, "cerca de mí / este finde", hides y normas: ya existían en este repo y están en `/fauna`

## Descartado
- «Mis especies» y «Diario de salidas»: estado de usuario, no "dónde ir" (0016). Quitados el 13-11-2026
- Ficha única que fusione spot y lugar de fauna (0015)
- Safaris del mundo (0022) y catálogo de rutas de senderismo (0023; del que solo se aprovecha el acceso a los spots)
