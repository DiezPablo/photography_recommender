# rasante/fauna/ — pipeline del modo Fauna (España)

Órdenes: `python -m rasante fauna <orden>` (`ordenes.py`; `--help` las lista).

- `cuadricula`: descarga SQL de GBIF por cuadrícula EEA de 10 km (`rejilla`, `gbif_descarga`), estacionalidad con
  confianza y backtest (`estacionalidad`, `evaluacion`, `frecuencia`) → `fauna_cuadricula.json`.
- `ebird`: frecuencia de detección de aves con el conjunto de eBird en GBIF (`ebird_frecuencia`) →
  `fauna_ebird.json`.
- `recientes`: lo visto en 30 días y rarezas (`ebird`, API de eBird; `inat_espana`, iNaturalist) →
  `fauna_recientes.json`, `fauna_rarezas.json`.
- `lugares`: puntos de eBird, espacios protegidos de Wikidata y observatorios de OSM, sin repetir (`lugares`,
  `nombres_lugares`, `overpass`), y Natura 2000 (`natura`) → `fauna_lugares.json`, `fauna_natura.json`.
- `listas`: listas de eBird por punto en 7 y 30 días (`ebird_listas`) → `fauna_listas.json`.
- `regiones`: actividad diaria de eBird por región, 30 días (`ebird_actividad`) → `fauna_ebird_regiones.json`.
- `especies`: especies registradas en cada punto de eBird, por tandas (`ebird_especies`) →
  `fauna_especies_punto.json`. Las dos se ajustan al presupuesto diario de peticiones (`ebird.PRESUPUESTO`,
  compartido entre órdenes con `EBIRD_CONTADOR`).
- `actividad`: hora de actividad por especie (`inat_espana`, con el cliente de `inat.py`) → `fauna_actividad.json`.

Workflows: `fauna_cuadricula.yml` (trimestral), `fauna_recientes.yml` (diario: recientes, lugares, listas, regiones y especies) y
`fauna_actividad.yml` (semanal). Desde la spec 007 los ficheros publicados se llaman `fauna_*` (antes
`espana_*`; la descarga acepta los dos nombres con `.github/scripts/bajar_dato.sh` y `scripts/descargar-datos.mjs`).

Reglas: sin `GBIF_USUARIO`/`GBIF_CLAVE` o `EBIRD_CLAVE` no se pide nada y la web sigue igual; ≤ 1 petición/s a
iNaturalist; nunca coordenadas finas de especies sensibles (decisión 0011); la API de eBird se usa con toda la
información que dé, citando la fuente (decisión 0017). No cambies las claves de caché (`inat_`, `inat_reciente_`,
`fallo_`, `cache/espana_*.json.gz`): la caché de Actions depende de ellas.
