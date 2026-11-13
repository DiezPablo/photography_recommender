# safari/ — pipeline de Fauna (España)

- `espana/` es el **modo Fauna** de Rasante: cuadrícula EEA de 10 km (`rejilla`), descarga SQL de GBIF
  (`gbif_descarga`), estacionalidad con confianza y backtest (`estacionalidad`, `evaluacion`), eBird
  (`ebird`, `ebird_frecuencia`, `ebird_listas`: recientes, rarezas, frecuencia de detección y listas por punto), iNaturalist (`inat_espana`:
  recientes y actividad por hora), lugares (`lugares`, `natura`, `nombres_lugares`).
  Órdenes: `python -m safari --espana`, `--espana-ebird`, `--espana-recientes`, `--espana-lugares`,
  `--espana-actividad`, `--espana-listas`. Workflows: `espana.yml` (trimestral, GBIF), `espana_recientes.yml` (diario, eBird),
  `espana_actividad.yml` (semanal).
- Fuera de `espana/` queda solo lo que este usa: `frecuencia.py` (frecuencia contraída y muestra), `inat.py` (el
  cliente de iNaturalist: ritmo, reintentos y caché) y `overpass.py`. `recursos/`: nombres y estado de las
  especies de España. El paquete se llama `safari` por el proyecto del que viene (los safaris del mundo se
  retiraron, decisión 0021); pasará a `rasante/fauna` con la spec 006.
- `comun` es gemelo de `rasante/comun`; al tocar uno, mira el otro (unificarlos es parte de la spec 006).

Reglas: sin `GBIF_USUARIO`/`GBIF_CLAVE` o `EBIRD_CLAVE` no se pide nada y la web sigue igual; ≤ 1 petición/s a
iNaturalist; nunca coordenadas finas de especies sensibles (decisión 0011); la API de eBird se usa aunque sea de
uso no comercial (decisión 0017).
