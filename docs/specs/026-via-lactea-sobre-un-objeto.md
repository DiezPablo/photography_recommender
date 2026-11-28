# 026 — El núcleo de la Vía Láctea sobre un objeto

Estado: en curso
Modo: Luz
Situación del fotógrafo: un evento

## Problema
La foto del núcleo de la Vía Láctea sobre un castillo, un faro o una roca exige saber hacia dónde mirar, desde dónde
y qué noches hay núcleo, oscuridad y nada de luna a la vez. Es la otra foto nocturna que a Pablo le cuesta planificar
(decisión 0027).

## Alcance
- En `/luz/alinear`, un selector «Sobre el objeto»: la luna llena (spec 025) o el núcleo de la Vía Láctea
  (`astro=via` en la URL). Sin JavaScript funciona igual.
- Con el núcleo:
  - **Dónde ponerte**: cada 10° de rumbo por el que el núcleo pasa a 8° de altura o más, la altura a la que pasa,
    la distancia propuesta (lo alto del objeto a un tercio de la altura del núcleo) con el punto en el mapa y la
    distancia mínima (lo alto del objeto 5° por debajo del núcleo). Se destacan los rumbos con el núcleo más alto.
  - **Noches**: ventanas de noches seguidas de los próximos doce meses con, en cada rumbo, la primera y la última
    noche y su hora. Noche buena: sol a 18° o más bajo el horizonte y la luna bajo el horizonte o con menos del 15 %
    iluminado.
  - **Cielo de la zona**: Bortle del spot del catálogo más cercano (a menos de 15 km); con Bortle 5 o más, aviso de
    que el núcleo apenas se verá; sin spot cerca, que se mire un mapa de contaminación lumínica.
- Ejemplo de un clic: el faro de Fuencaliente (La Palma, Bortle 2).
- **Fuera de alcance**: nubes (las da la nota de noche a cinco días), el sol sobre un objeto, el arco completo de la
  Vía Láctea, focales y encuadres.

## Criterios de aceptación
- [ ] La posición del núcleo coincide con astropy en ≤ 0,02° en dos instantes de prueba (test).
- [ ] En el instante que da cada ventana, el núcleo está en su rumbo (≤ 0,2°), el sol a −18° o menos y la luna bajo
      el horizonte o con menos del 15 % (test).
- [ ] En Madrid el núcleo llega a ~20° hacia el sur y las ventanas van de marzo a octubre (test).
- [ ] Sin JavaScript, el selector y el ejemplo del faro muestran «Dónde ponerte» y las noches (e2e).
- [ ] `make check` y la e2e en verde.

## Datos
Ninguna fuente nueva. El cielo de la zona lee `spots.geojson` (contaminación del atlas de D. Lorenz, ya publicado):
se añade a la función de `/luz/alinear` en `outputFileTracingIncludes` (630 KB comprimido).

## Diseño
Las piezas de la spec 025: bloques `.dia-plan`, filas `.item-plan` y `.destacada`.

## Notas de implementación
`src/features/alinear/via.ts` (puro: el núcleo es una estrella fija en `astronomy-engine`, `DefineStar`; el ángulo
horario de cada rumbo se calcula una vez y cada día se busca el instante con ese tiempo sidéreo),
`ResultadoVia.tsx`, `datos.ts` (cielo cerca, solo servidor).
