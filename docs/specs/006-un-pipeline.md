# 006 — Un solo pipeline

Estado: hecha
Modo: plataforma
Situación del fotógrafo: —

## Problema
Tras la consolidación (001) y la retirada de safaris (005) quedaban dos paquetes Python: `rasante` (Luz) y
`safari` (del que solo vivía `safari/espana`, la fauna). Dos `comun` gemelos que podían divergir, dos formas de
lanzar órdenes (`python -m rasante …`, `python -m safari --espana…`) y workflows con el nombre de un modo que ya
no existe (`espana*.yml`).

## Alcance
- `safari/espana/*` pasa a `rasante/fauna/*` (el antiguo `cli.py` es `cuadricula.py`), con `frecuencia.py`, el
  cliente de iNaturalist (`inat.py`) y `overpass.py`. Los recursos (`nombres_espana.csv`,
  `especies_estado_espana.csv`) van a `rasante/recursos/`. El paquete `safari` desaparece.
- Un único `comun`: `safari/comun` era igual que `rasante/comun` salvo el User-Agent, que ahora nombra a Rasante.
- Órdenes: `python -m rasante fauna <orden>` con `cuadricula`, `ebird`, `recientes`, `lugares`, `listas`,
  `actividad`, `diagnostico` y `experimentos` (`rasante/fauna/ordenes.py`). Hacen lo mismo que las banderas
  `--espana…` que sustituyen.
- Workflows: `espana.yml` → `fauna_cuadricula.yml`, `espana_recientes.yml` → `fauna_recientes.yml`,
  `espana_actividad.yml` → `fauna_actividad.yml`. Mismos horarios, pasos, entorno de secretos, claves de caché y
  grupos de concurrencia.
- Pruebas renombradas a `tests/test_fauna_*.py`; `pyproject.toml`, `Makefile`, `pruebas.yml` y `.vercelignore`
  con un solo paquete.
- **Fuera de alcance**: renombrar los ficheros publicados `espana_*` y retirar `espana_rutas.json` y
  `espana_rasante.json` (007); cambiar cualquier cálculo.

## Criterios de aceptación
- [x] `ruff` y `pytest` en verde (188 pruebas, las mismas que antes); `import safari` falla.
- [x] `python -m rasante fauna --help` lista las órdenes; sin claves, `listas` y `recientes` terminan sin error y
      sin escribir nada, como antes.
- [x] Los nombres de los ficheros publicados y las claves de caché no cambian: la web no nota nada.
- [x] `tsc`, ESLint y Prettier en verde (en `src/` solo cambian comentarios).
- [ ] Primera ejecución de `fauna_recientes.yml` en Actions en verde tras fusionar (lanzarla a mano).

## Datos
Ninguno nuevo. `espana.json`, `espana_ebird.json`, `espana_recientes.json`, `espana_rarezas.json`,
`espana_lugares.json`, `espana_natura.json`, `espana_listas.json` y `espana_actividad.json` se siguen
publicando con el mismo nombre y el mismo contenido.

## Notas
Al renombrar los workflows, GitHub empieza su historial de ejecuciones de cero (el antiguo queda visible con el
nombre viejo). Las cachés de Actions se conservan porque las claves no cambian. `rasante/lugares` ya no importa
de otro paquete: usa `rasante.fauna.rejilla`.
