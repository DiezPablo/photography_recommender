# 019 — Lugares de fauna sin repetir

Estado: hecha
Modo: Fauna
Situación del fotógrafo: una tarde | un finde

## Problema
La auditoría 002 encontró el mismo sitio varias veces en la lista de lugares: 48 pares con el mismo nombre a
menos de 2 km y 41 pares de espacios a menos de 100 m. Quien busca «Sierra Nevada» encontraba el parque
nacional, la ZEC y la reserva de la biosfera como tres lugares; y el punto de eBird de una laguna, además de
la laguna.

## Alcance
- En el pipeline (`safari/espana/lugares.py`), al unir eBird, Wikidata y OSM:
  - Los nombres se comparan sin tildes ni signos («Ons - O Grove» = «Ons-O Grove»).
  - Con el mismo nombre a menos de 3 km queda el espacio antes que su punto de eBird, y hereda sus especies.
  - Varios espacios de Wikidata en el mismo punto (< 100 m) son uno: el de la figura más conocida (parque
    nacional > parque natural > … > Red Natura 2000), con el mayor radio y el código Natura 2000.
  - Un lugar que se llama como un espacio Natura 2000 sin lugar propio, a menos de 3 km, se queda con su código
    (y con él, su contorno y sus cuadrículas) en vez de que el espacio salga aparte.
- **Fuera de alcance**: cambiar ids o tipos; fusionar un observatorio con el espacio que lo contiene (son cosas
  distintas); dos espacios Natura 2000 homónimos (ZEPA y ZEC con códigos distintos), que añade la web.

## Criterios de aceptación
- [x] Tests sin red de cada regla (`tests/test_espana_lugares.py`).
- [x] Con los lugares publicados el 13-11-2026: de 21 225 a 21 180 lugares; la auditoría baja de 48 a 3 pares
      con el mismo nombre y de 41 a 3 espacios pegados. 41 puntos de eBird pasan a tener contorno Natura 2000.
- [x] Lo que se quita no pierde información: especies de eBird y código Natura 2000 pasan al que queda.
- [ ] Se ve en producción tras la siguiente ejecución de `espana_recientes.yml` (diaria).

## Datos
Sin fuentes nuevas. `espana_lugares.json` pierde 45 lugares (40 de Wikidata, 5 de eBird); sus fichas dejan de
existir (404). `--espana-lugares` descarga ahora Natura 2000 antes que los lugares.

## Notas de implementación
`clave_nombre`, `sin_repetir`, `una_figura`, `con_codigo_natura` y `unificar`. Los 6 pares que quedan son
correctos: espacios Natura 2000 distintos con el mismo nombre y un observatorio dentro de su marjal.
