# rasante/fauna/ — pipeline del modo Fauna (España)

Órdenes: `python -m rasante fauna <orden>` (`ordenes.py`; `--help` las lista).

- `cuadricula`: descarga SQL de GBIF por cuadrícula EEA de 10 km (`rejilla`, `gbif_descarga`), estacionalidad con
  confianza y backtest (`estacionalidad`, `evaluacion`, `frecuencia`) → `espana.json`. `experimentos` y
  `diagnostico` son sus herramientas de análisis.
- `ebird`: frecuencia de detección de aves con el conjunto de eBird en GBIF (`ebird_frecuencia`) →
  `espana_ebird.json`.
- `recientes`: lo visto en 30 días y rarezas (`ebird`, API de eBird; `inat_espana`, iNaturalist) →
  `espana_recientes.json`, `espana_rarezas.json`.
- `lugares`: puntos de eBird, espacios protegidos de Wikidata y observatorios de OSM, sin repetir (`lugares`,
  `nombres_lugares`, `overpass`), y Natura 2000 (`natura`) → `espana_lugares.json`, `espana_natura.json`.
- `listas`: listas de eBird por punto en 7 y 30 días (`ebird_listas`) → `espana_listas.json`.
- `actividad`: hora de actividad por especie (`inat_espana`, con el cliente de `inat.py`) → `espana_actividad.json`.

Workflows: `fauna_cuadricula.yml` (trimestral), `fauna_recientes.yml` (diario: recientes, lugares y listas) y
`fauna_actividad.yml` (semanal). Los ficheros publicados conservan el prefijo `espana_` hasta la spec 007.

Reglas: sin `GBIF_USUARIO`/`GBIF_CLAVE` o `EBIRD_CLAVE` no se pide nada y la web sigue igual; ≤ 1 petición/s a
iNaturalist; nunca coordenadas finas de especies sensibles (decisión 0011); la API de eBird se usa con toda la
información que dé, citando la fuente (decisión 0017). No cambies las claves de caché (`inat_`, `inat_reciente_`,
`fallo_`, `cache/espana_*.json.gz`): la caché de Actions depende de ellas.
