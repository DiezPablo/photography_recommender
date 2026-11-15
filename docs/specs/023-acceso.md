# 023 — Acceso a cada spot

Estado: hecha
Modo: ambos
Situación del fotógrafo: una tarde | un finde | un viaje

## Problema
Para decidir entre dos spots cuenta cuánto hay que andar desde el coche: un mirador junto a la carretera no es lo
mismo que una cumbre a una hora. Rasante no lo decía. De las rutas de senderismo aparcadas solo sirve esto
(decisión 0023).

## Alcance
- `python -m rasante acceso`: con el extracto PBF de España de OpenStreetMap (sin Overpass), el aparcamiento al
  aire libre y abierto al público más cercano (≤ 2 km) a cada spot y a cada lugar de fauna pequeño (radio ≤ 2 km:
  puntos de eBird, observatorios, monumentos naturales; en un espacio protegido grande el «más cercano al centro»
  no dice nada) → `acceso.json`. Minutos andando estimados: línea recta × 1,3 a 4,5 km/h.
- `luz_acceso.yml`, mensual (día 10) y al cambiar `rasante/acceso`.
- `lugares.json` rellena `acceso.aparcamiento_m`, que ya estaba en el esquema (spec 003).
- Web: «Acceso: aparcamiento a 350 m · unos 6 min andando · llegar en coche ↗» en los datos de la ficha de spot;
  la misma línea en la ficha de lugar de fauna (y «Cómo llegar» lleva al aparcamiento); en `/plan`, junto a cada
  spot y lugar de fauna.
- **Fuera de alcance**: rutas, GPX, desnivel, accesibilidad (`acceso.accesible` sigue en null), refugios, fuentes
  y campings.

## Criterios de aceptación
- [x] Pruebas: qué cuenta como aparcamiento (sin privados ni subterráneos), áreas en su centro, el más cercano,
  nada a más de 2 km, minutos, solo lugares de fauna pequeños y `lugares.json` con `aparcamiento_m`.
- [x] Con el extracto de la Comunidad de Madrid y los datos reales: 23 spots y 663 lugares de fauna con
  aparcamiento (mediana 310 m en spots); el Mirador de Buitrago, «aparcamiento a 440 m · unos 8 min andando».
- [x] e2e: el plan de Madrid enseña el acceso y la ficha del spot lo lleva con el enlace a OpenStreetMap (si ya
  está publicado `acceso.json`).
- [x] Primera publicación de `acceso.json` (15-11-2026; rehecha a las 17:29 con los spots nuevos): 1046 de 1500 spots
  con aparcamiento a ≤ 2 km (mediana 290 m; 806 a ≤ 10 min andando) y 10 728 lugares de fauna (mediana 470 m).
  Producción lo enseña en las fichas y en `/plan`; `lugares.json` lleva `aparcamiento_m` (spots sin él: del 100 %
  al 30 %).

## Datos
OpenStreetMap (ODbL), ya acreditado; ahora también «aparcamientos» en `/fuentes`. `acceso.json`: unos 25 000
lugares × ~60 B ≈ 1,5 MB (≈ 0,3 MB comprimido). El extracto de España (~1,3 GB) solo en Actions.

## Diseño
Una línea más en los datos de la ficha (como «Dron»), sin bloque propio.

## Notas de implementación
`rasante/acceso/` (`osm.py`, `calculo.py`, `cli.py`), `.github/workflows/luz_acceso.yml`, `rasante/lugares/cli.py`
(`--acceso`), `src/features/acceso/`, `next.config.ts` (tracing de `acceso.json.gz` en las fichas y en `/plan`).
`osmium` va como extra opcional (`pip install -e ".[osm]"`).
