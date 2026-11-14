# rasante/ — pipeline de datos (Python)

Una orden por subpaquete: `python -m rasante <orden>` (`--help` para verlas).

- `comun`: caché `CacheJson` (no cambies su formato), sesión HTTP, `escribir_json` sin NaN, `id_spot`,
  `territorio` (CCAA siempre con `territorio.ccaa_de`, por código INE de provincia).
- `cielo` (astro, contaminación lumínica), `terreno` (DEM, horizonte), `notas` (modelos con desglose; ver
  `docs/modelos.md`).
- `prevision`: Open-Meteo (+ Marine en costa) → `informe.json`. `spots`: Commons + Wikidata + OSM →
  `spots.geojson`. `eventos`: luna, meteoros, Vía Láctea, eclipses, auroras, Starlight y
  `recursos/eventos_naturaleza.csv` → `eventos.json`; alineaciones.
- `notas/idoneidad.py`: lo que da de sí un spot sin el tiempo (relieve hacia el sol de cada mes, cielo), con los
  factores de la previsión; va en `lugares.json` (`luz.idoneidad`, spec 013).
- `lugares`: índice común de spots y lugares de fauna → `lugares.json` (contrato en
  `recursos/lugar.schema.json`; lee también `espana_lugares.json` y `espana_natura.json`).
- `auditar` (`lugares/auditoria.py`): informe de cobertura, vacíos y duplicados de `lugares.json` →
  `docs/datos/auditoria-AAAA-MM-DD.md`. Pásalo antes y después de tocar el catálogo.
- `clima` (ERA5 por mes), `dron` (ENAIRE + AEMA), `verificacion` (METAR), `validacion` (ERA5 + Commons +
  METAR), `avisos` (Telegram, opcional).
- `fauna`: el modo Fauna entero, con sus propias órdenes (`python -m rasante fauna …`; ver `fauna/CLAUDE.md`).
- No están aquí: rutas y logística (aparcadas, backlog «Después»).

Reglas:
- Antes de cambiar pesos de `notas/`, mira el informe de validación (workflow `luz_validar.yml`); no ajustes
  más allá del ruido (decisión 0004).
- Respeta los límites de las APIs: caché en `cache/`, `Retry-After` y `maxlag` en Commons, User-Agent
  descriptivo, espejos de Overpass. El descubrimiento real corre en GitHub Actions (desde el contenedor, 429).
- Bbox con negativos: `--bbox=-4.30,40.60,-3.55,41.10` (con `=`). Puntos en países vecinos se descartan con
  `recursos/vecinos.geojson`.
- Tests: pytest sin red con respuestas reales grabadas en `tests/fixtures` (no las leas enteras).

Workflows: `luz_datos.yml` (previsión, 2 veces al día; la primera vez siembra `spots.geojson`, `clima.json`,
`dron.json` y `verificacion.json` desde la release del repo anterior con `.github/scripts/sembrar.sh`),
`luz_descubrir.yml` (solo a mano hasta la spec 018: la caché de Commons de este repo está vacía; spots + dron), `luz_clima.yml` (solo a mano), `luz_validar.yml`.

Publicación: los datos no van en git. Se suben a la release `datos` (`.github/scripts/publicar_release.sh`) y
solo se hace commit de `public/datos/version.json`, que redespliega Vercel si algo cambió.
