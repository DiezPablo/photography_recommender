# 018 — Cobertura de spots

Estado: hecha
Modo: Luz
Situación del fotógrafo: una tarde · un finde (lejos de las ciudades grandes)

## Problema
La auditoría del 13-11-2026 (`docs/datos/auditoria-2026-11-13.md`) encontró un catálogo descompensado: 30
provincias se quedan en el mínimo de 12 spots y el 32 % de los spots tiene cielo urbano (Bortle ≥ 7). La selección
premia la popularidad en Commons, que se concentra en las ciudades y en un mismo tipo de sitio (miradores urbanos),
así que quien vive lejos de una capital tiene poco donde elegir y casi nada para la noche.

Además, el descubrimiento (`luz_descubrir.yml`) estaba solo a mano: en este repositorio su caché de Commons está
vacía y una ejecución desde cero publicaría un catálogo con la popularidad a medias.

## Alcance
- **Selección** (`rasante/spots/seleccion.py`, `seleccionar`):
  - 20 spots por provincia (antes 12), con variedad: ningún tipo pasa del 40 % de la cuota y al menos un 25 % con
    cielo oscuro o sin medir, si la provincia los tiene. Lo que dejan los topes se rellena por puntuación.
  - El resto hasta 1 500, por puntuación nacional, sin que el cielo urbano pase del 20 % del total.
  - La puntuación de cada candidato no cambia (popularidad, Wikipedia, tipo, foto y cielo).
- **Publicar solo lo completo**: si la popularidad de Commons está contada en menos del 98 % de los candidatos, el
  descubrimiento se para tras la selección (dice cómo quedaría), deja `INCOMPLETO` y el workflow no publica. La
  caché guarda lo contado y la siguiente ejecución sigue.
- `luz_descubrir.yml` vuelve al calendario: mensual (día 3). Para llenar la caché antes, se lanza a mano las veces
  que haga falta.
- **Fuera de alcance**: más de 1 500 spots (cada spot es una previsión más dos veces al día), nuevas fuentes de
  candidatos y la idoneidad (013), que ya ordena «lo habitual» con el cielo.

## Criterios de aceptación
- [x] Cuota por provincia, tope por tipo, cupo de cielo oscuro y tope urbano nacional (tests con candidatos
      sintéticos).
- [x] Con la popularidad a medias no se escribe ni se publica nada; el log dice el porcentaje contado.
- [x] El workflow tiene calendario mensual y no publica si falta popularidad.
- [x] Primer descubrimiento completo en Actions (15-11-2026, 99 % de popularidad contada, tres ejecuciones):
      ninguna provincia con menos de 20 spots salvo Ceuta (17) y Melilla (5); mediana de 20 por provincia (era 12).
- [x] Cielo urbano (Bortle ≥ 7) por debajo del 25 %: **20 %** (300 de 1500) tras el descubrimiento del 16-11-2026
      (`docs/datos/auditoria-2026-11-16.md`); era el 32 % el 13-11 y el 29 % el 15-11. El primer intento contaba como
      urbano el brillo < 19,5 mag/arcsec² y dejaba fuera la zona 5b del atlas (Bortle 7): corte a 20,0, con la prueba
      `test_urbano_es_bortle_7_o_mas`. Tuvo que repetirse dos veces por los límites de Open-Meteo (PR que espera al
      límite por hora en vez de rendirse).
- [x] Informe de auditoría de después en `docs/datos/auditoria-2026-11-15.md`, comparado con el del 13-11-2026:
      provincias con menos de 15 spots, de 30 a 1; pares duplicados de fauna, de 48 y 41 a 3 y 3 (spec 019); más
      cumbres (218 → 261), agua (76 → 163) y cascadas (33 → 56), menos miradores (610 → 528) y costa (451 → 386).

## Datos
Mismas fuentes que hoy (Wikidata, OpenStreetMap, Commons, atlas de contaminación lumínica). Con más spots de
provincias pequeñas y de cielo oscuro, menos de ciudad.

## Notas de implementación
Los ids de los spots no cambian para los que siguen (salen del nombre y la posición). Los que salgan del catálogo
dejan de tener ficha; los enlaces a ellos dan 404, como ya pasaba con cada descubrimiento.
