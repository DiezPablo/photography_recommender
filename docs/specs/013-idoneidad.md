# 013 — Idoneidad del lugar por momento y resultados fuera de previsión

Estado: hecha
Modo: Luz
Situación del fotógrafo: un finde | un viaje (a más de cinco días)

## Problema
El ranking de Luz solo existe para los cinco días de previsión. Quien prepara «un finde en Asturias en octubre» o
unas Perseidas en agosto no tiene dónde mirar: la web sabe qué suele pasar cada mes en cada zona (climatología) y
conoce cada lugar (relieve, cielo), pero no lo junta en una lista.

## Alcance
- **Pipeline**: `python -m rasante lugares` añade a cada spot `luz.idoneidad` (`rasante/notas/idoneidad.py`): lo
  que da de sí el lugar, sin el tiempo, de 0 a 10.
  - Amanecer y atardecer, **por mes**: el relieve hacia donde sale o se pone el sol el día 15 (el azimut cambia
    unos 60° en el año), con el mismo factor que la previsión (`notas.luz.factor_relieve`, extraído de `nota_luz`
    sin cambiar un número). 10 = horizonte libre.
  - Noche: contaminación lumínica (`notas.noche.factor_sqm`, el de la previsión) × relieve al sur (de 5° a 20°
    baja hasta 0,6: tapa el centro de la Vía Láctea, no las estrellas).
  - Se guardan también los grados de relieve de los que sale (`idoneidad.relieve`), para explicarla.
- **Web**: `/luz/habitual/[mes]/[tipo]` (12 meses × amanecer, atardecer, noche; estáticas) con el mismo listado y
  mapa que el ranking del día y los mismos filtros (comunidad, cerca de mí). Orden: % de días buenos del mes en
  la zona (ERA5 2021-2025) × idoneidad / 10; a igualdad, el spot más fotografiado. Cada fila dice las dos cosas:
  «El 45 % de los atardeceres de octubre salen buenos en la zona» y «Lugar: 8 de 10, el sol se esconde tras un
  relieve de 4°». `/luz/habitual` es el índice. Se llega desde el ranking del día («¿Otra fecha?»), desde el
  calendario de cada mes y desde Método, que lo explica.
- Corrección de paso: `luz.horizonte` de `lugares.json` salía en décimas de grado aunque el esquema decía grados.
  Ya son grados (nadie lo leía aún).
- **Fuera de alcance**: ranking por fecha exacta y por zona desde la consulta común (012); enlazarlo desde los
  eventos de cielo (015); la idoneidad en la ficha del spot y el diseño de la página (004); niebla y luna.

## Criterios de aceptación
- [x] `lugares.json` valida contra el esquema con `luz.idoneidad` en los 1 500 spots; el cálculo añade ~10 s.
- [x] La idoneidad usa los factores de la previsión (test): un relieve dado pesa igual en las dos.
- [x] Una URL por mes y momento, sin JavaScript: lista de 60 con cifra en %, las dos razones y enlaces de mes y
      momento; con JavaScript, filtros y lista completa.
- [x] Marcado como «lo habitual», en porcentaje y no como nota; Método dice que no está validado como nota.
- [x] Sin `idoneidad` publicada (hasta el primer `luz_datos` tras fusionar), la página lo dice y nada falla.
- [x] Primera publicación en producción comprobada (14-11-2026): `lugares.json` trae `luz.idoneidad` en los
      1 500 spots y `/luz/habitual/octubre/atardecer` enseña su lista en la web pública.

## Datos
`lugares.json` crece ~0,2 MB comprimido; la web lo descarga ahora en el build (antes no lo usaba). 36 páginas y
36 JSON estáticos nuevos (~0,8 MB cada JSON sin comprimir, como los del ranking del día): ~30 MB más por
despliegue (decisión 0002: vigilar).

## Diseño
Provisional, con las piezas del ranking del día. La página definitiva sale de 004/012.

## Notas de implementación
Con el catálogo de hoy: la mitad de los spots tienen 10 en amanecer y atardecer (horizonte libre) y el 5 % menos
de 4; en noche la mediana es 7,4 y el 5 % más urbano queda por debajo de 2,4. Como muchos lugares comparten zona
de clima (rejilla de ERA5) y horizonte libre, el desempate por popularidad decide a menudo el orden dentro de una
zona: es lo esperable de un criterio de orden, y por eso no se presenta como nota. Los campos `pct_amanecer`,
`pct_atardecer` y `pct_noche` de `spots.geojson` están a cero en todo el catálogo (no hay hora en las fotos), así
que no se usan.
