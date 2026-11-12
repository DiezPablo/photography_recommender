# rasante/ — pipeline del modo Luz (Python)

Una orden por subpaquete: `python -m rasante <orden>` (`--help` para verlas).

- `comun`: caché `CacheJson` (no cambies su formato), sesión HTTP, `escribir_json` sin NaN, `id_spot`,
  `territorio` (CCAA siempre con `territorio.ccaa_de`, por código INE de provincia).
- `cielo` (astro, contaminación lumínica), `terreno` (DEM, horizonte), `notas` (modelos con desglose; ver
  `docs/modelos.md`).
- `prevision`: Open-Meteo (+ Marine en costa) → `informe.json`. `spots`: Commons + Wikidata + OSM →
  `spots.geojson`. `eventos`: luna, meteoros, Vía Láctea, eclipses, auroras, Starlight y
  `recursos/eventos_naturaleza.csv` → `eventos.json`; alineaciones.
- `clima` (ERA5 por mes), `dron` (ENAIRE + AEMA), `verificacion` (METAR), `validacion` (ERA5 + Commons +
  METAR), `avisos` (Telegram, opcional).
- No están aquí: rutas y logística (aparcadas, backlog «Después») ni fauna (vive en `safari/espana`).

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
`luz_descubrir.yml` (mensual, spots + dron), `luz_clima.yml` (solo a mano), `luz_validar.yml`.

Publicación: los datos no van en git. Se suben a la release `datos` (`.github/scripts/publicar_release.sh`) y
solo se hace commit de `public/datos/version.json`, que redespliega Vercel si algo cambió.
