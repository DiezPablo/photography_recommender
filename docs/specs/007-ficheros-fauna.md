# 007 — Ficheros de fauna con su nombre

Estado: hecha (faltan la primera publicación de actividad y cuadrícula con el nombre nuevo)
Modo: plataforma
Situación del fotógrafo: —

## Problema
Los datos del modo Fauna se publicaban como `espana_*.json`, el nombre del modo que tenía el repo antes de ser
Rasante. Además se seguían calculando y descargando dos ficheros que ya no usa nadie: `espana_rasante.json` (de
una versión anterior) y `espana_rutas.json` (rutas de senderismo de OSM, aparcadas por la decisión 0019).

## Alcance
- Todos los ficheros publicados de fauna pasan a `fauna_*`: `espana.json` → `fauna_cuadricula.json` y el resto
  cambiando el prefijo (`fauna_lugares.json`, `fauna_natura.json`, `fauna_recientes.json`, `fauna_rarezas.json`,
  `fauna_listas.json` y su historial `fauna_listas_dias.json`, `fauna_actividad.json`, `fauna_ebird.json`,
  `fauna_ebird_regiones.json`, `fauna_especies_punto.json`). Pipeline, workflows, web, pruebas y guías.
- **Transición sin corte**: mientras un workflow no haya publicado con el nombre nuevo, todo lo que descarga de la
  release prueba primero el nuevo y luego el antiguo: el prebuild de la web (`scripts/descargar-datos.mjs`), los
  workflows (`.github/scripts/bajar_dato.sh`, nuevo) y el respaldo de observatorios de `lugares.py`. La cuadrícula
  es trimestral, así que la web leerá `espana.json` hasta su próxima ejecución.
- **Fuera**: las rutas de senderismo (cálculo, publicación, descarga y la sección «Rutas de senderismo cerca» de la
  ficha de lugar). El código queda en el historial por si se retoman (backlog «Después»).
- Las cachés de Actions (`cache/espana_*.json.gz`) **no** cambian de nombre: perderlas obligaría a repetir la
  descarga de GBIF.
- **Fuera de alcance**: borrar los `espana_*` de la release (se quedan sin uso; lo hace Pablo a mano cuando los
  nuevos estén publicados) y renombrar variables o módulos que llevan «espana» en el código (`inat_espana.py`,
  `cargarEspana`): no se ven y no confunden en los datos.

## Criterios de aceptación
- [x] Ningún `espana*.json` en código, workflows ni pruebas, salvo las cachés y el nombre antiguo de la
      transición (grep).
- [x] Compilando con la release de hoy (solo nombres antiguos), la web sale completa: build y e2e en verde.
- [x] `bajar_dato.sh` cae al nombre antiguo y, sin ninguno, no falla (probado contra la release real).
- [x] Pruebas de Python en verde; ya no hay prueba de rutas.
- [x] Primera publicación con el nombre nuevo de `fauna_recientes.yml` (15-11-2026, 12:20 UTC): recientes, rarezas,
      lugares, listas, regiones, especies por punto y Natura 2000; producción desplegada con ellos.
- [ ] Ídem de `fauna_actividad.yml` (semanal, lunes) y `fauna_cuadricula.yml` (lanzada a mano el 15-11-2026).

## Notas
Cuando todos los `fauna_*` estén publicados se puede quitar la transición (`nombreAntiguo` y el caso antiguo de
`bajar_dato.sh`) y borrar los `espana_*` de la release.
