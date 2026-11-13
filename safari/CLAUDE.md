# safari/ — pipeline de Fauna (España) y de safaris (congelado)

- `espana/` es el **modo Fauna** de Rasante: cuadrícula EEA de 10 km (`rejilla`), descarga SQL de GBIF
  (`gbif_descarga`), estacionalidad con confianza y backtest (`estacionalidad`, `evaluacion`), eBird
  (`ebird`, `ebird_frecuencia`: recientes, rarezas y frecuencia de detección), iNaturalist (`inat_espana`:
  recientes y actividad por hora), lugares (`lugares`, `natura`, `nombres_lugares`).
  Órdenes: `python -m safari --espana`, `--espana-ebird`, `--espana-recientes`, `--espana-lugares`,
  `--espana-actividad`. Workflows: `espana.yml` (trimestral, GBIF), `espana_recientes.yml` (diario, eBird),
  `espana_actividad.yml` (semanal).
- El resto (`catalogo`, `mundo`, `practico`, `inat`, `entorno`…) son los safaris del mundo: **congelados**, no
  les añadas nada (spec 005).
- `comun` es gemelo de `rasante/comun`; al tocar uno, mira el otro (unificarlos es parte de la spec 006).

Reglas: sin `GBIF_USUARIO`/`GBIF_CLAVE` o `EBIRD_CLAVE` no se pide nada y la web sigue igual; ≤ 1 petición/s a
iNaturalist; nunca coordenadas finas de especies sensibles (decisión 0011); la API de eBird se usa aunque sea de
uso no comercial (decisión 0017).
