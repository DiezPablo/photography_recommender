# 015 — «¿Dónde verlo?» en los eventos de cielo

Estado: hecha
Modo: Luz
Situación del fotógrafo: un evento (Perseidas, Vía Láctea sin luna)

## Problema
El calendario dice cuándo son las Perseidas o la ventana de Vía Láctea sin luna, pero no dónde ir a verlas. Desde
la spec 013 existe la lista que lo responde («lo habitual» de noche de cada mes: cielos oscuros que suelen estar
despejados), pero nada lleva de una cosa a la otra.

## Alcance
- En el calendario de cada mes (`/luz/calendario/[mes]`), las lluvias de meteoros y las ventanas de Vía Láctea
  sin luna enlazan a `/luz/habitual/[mes]/noche` («¿Dónde verlas?»).
- `/luz/habitual/[mes]/noche` enseña arriba «Qué noches»: luna nueva, Vía Láctea (ventana sin luna u horas de
  núcleo) y lluvias de meteoros del mes con su luna, y enlaza de vuelta al calendario. Así la página junta cuándo
  y dónde. La zona se elige con los filtros que ya tiene la lista (comunidad, cerca de mí).
- **Fuera de alcance**: ficha propia para cada evento de cielo, resultados para la noche exacta (la previsión
  solo llega a cinco días: ahí ya manda el ranking de noche del día) y la consulta común en la URL (012).

## Criterios de aceptación
- [x] Desde las Perseidas del calendario de agosto se llega, con un enlace, a los spots de noche de agosto.
- [x] Esa página dice la noche de las Perseidas con la luna que habrá, la luna nueva y la Vía Láctea del mes.
- [x] Sin JavaScript funciona igual (son enlaces y HTML del servidor).
- [x] El bloque no aparece en amanecer ni en atardecer.

## Datos
Ninguno nuevo: `eventos.json` (luna, meteoros, Vía Láctea) y lo de la spec 013.

## Diseño
Provisional, con la lista del cielo del calendario. El definitivo sale de 004/012.
