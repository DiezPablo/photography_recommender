# 024 — Revisión de lo encontrado por el camino

Estado: propuesta
Modo: ambos
Situación del fotógrafo: —

## Problema
Al hacer las specs de 11-2026 salieron cosas que no eran de la spec en curso y se apuntaron en vez de arreglarlas a
medias. Esta spec las junta para revisarlas de una vez: cada punto dice qué se vio, dónde y qué se propone.

## Alcance
1. **Nombres comunes de especies.** GBIF da el primer nombre en español que tiene, a veces de otro país o
   equivocado: *Larus argentatus* sale como «Gallego europeo» (es «Gaviota argéntea»). Solo 80 de las 845 especies
   tienen nombre revisado a mano (`rasante/recursos/nombres_espana.csv`, `rasante/fauna/nombres.py`). Propuesta: las
   aves, con la taxonomía de eBird en español (`/ref/taxonomy/ebird?locale=es`, con `EBIRD_CLAVE`, en Actions); el
   resto, lista de los nombres que no casan para revisar a mano y añadir al CSV.
2. **Nombres de lugares de fauna con comillas.** «"Vegas, cuestas y páramos del sureste de Madrid"» (Natura 2000).
   Propuesta: quitar las comillas sobrantes al construir `fauna_lugares.json` y `fauna_natura.json`.
3. **Prueba e2e que falla en local.** `e2e/carta.spec.ts` «ficha de un lugar con contorno Natura 2000» da
   `ECONNRESET` en `/fauna/lugares?q=…` cuando el servidor va cargado (tres veces en 11-2026; pasa sola y en CI).
   Sospecha: carrera de *keep-alive* entre el cliente de Playwright y el servidor de Next. Propuesta: reproducirla,
   confirmar la causa y arreglarla donde esté (sin saltarse la prueba).
4. **Previsión pisada tras un descubrimiento.** El 16-11 una previsión lanzada por un `push` terminó después del
   descubrimiento con el catálogo anterior: 155 spots nuevos estuvieron unas dos horas sin previsión. Propuesta:
   que `luz_datos.yml` lea `spots.geojson` justo antes de publicar y, si cambió, no publique `informe.json` y
   `lugares.json` de otro catálogo (o que el descubrimiento lance la previsión al acabar).
5. **Mensaje del dron con fecha vieja.** El descubrimiento publica «Dron (2026-11-12)» un 15-11: el mensaje toma la
   fecha del fichero anterior. Propuesta: la fecha de hoy.
6. **Cupo de Open-Meteo.** Seis previsiones en un día agotaron las 10 000 llamadas (15-11). Ya se espera al límite
   por hora (PR 29) y solo hay dos programadas (decisión 0024), pero los lanzamientos a mano y por `push` suman.
   Propuesta: que la previsión no corra si ya hubo dos con éxito ese día, salvo que se pida a la fuerza.
7. **Verificación con METAR.** `verificacion.json` se sigue calculando y publicando, pero la web ya no lo usa (spec
   022). Propuesta: decidir si se queda como informe interno (y dónde se mira) o se quita del pipeline.
8. **Restos de CSS.** Quedan comentarios y reglas de los safaris y de los alojamientos (`src/estilos/11-calendario.css`,
   `12-diseno.css`). Propuesta: poda con el método de `docs/diseno/sistema.md` («Cómo podar»).
9. **Tareas de Pablo** (fuera del código): borrar de la release `datos` los `espana_*`, `safaris*`,
   `alineaciones.json`; quitar los secretos `TELEGRAM_*`.
- **Fuera de alcance**: cambios de producto nuevos; cada punto que crezca pasa a su propia spec.

## Criterios de aceptación
- [ ] 1: *Larus argentatus* es «Gaviota argéntea»; informe de cuántos nombres de aves cambian con eBird y lista de
  los no aves sin revisar.
- [ ] 2: ningún nombre de lugar empieza ni acaba en comillas.
- [ ] 3: causa del `ECONNRESET` encontrada y la e2e completa en verde en local tres veces seguidas.
- [ ] 4: tras un descubrimiento, `informe.json` y `lugares.json` publicados tienen los mismos spots que
  `spots.geojson`.
- [ ] 5: el mensaje del dron lleva la fecha del día en que se publica.
- [ ] 6: una tercera previsión el mismo día no llama a Open-Meteo salvo a la fuerza.
- [ ] 7 y 8: decisión anotada y CSS podado con capturas de antes y después.

## Datos
Taxonomía de eBird (términos de eBird, ya en `/fuentes`). Nada más nuevo.

## Diseño
Sin cambios de interfaz salvo los nombres.

## Notas de implementación
`rasante/fauna/nombres.py`, `rasante/fauna/natura.py`, `.github/workflows/luz_datos.yml`, `luz_descubrir.yml`,
`e2e/carta.spec.ts`, `src/estilos/`.
