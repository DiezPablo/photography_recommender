# 012 — Consulta común «cuándo / dónde / qué» en la URL

Estado: hecha
Modo: ambos
Situación del fotógrafo: una tarde | un finde | un viaje

## Problema
La portada pregunta «¿cuándo tienes tiempo?», pero cada modo tiene sus propias páginas y filtros: para saber qué
hacer el sábado cerca de casa hay que mirar el ranking de luz y luego la carta de fauna. No hay una dirección que
guarde una consulta («este finde, a 50 km, luz») para volver a ella o mandarla a alguien.

## Alcance
- `/buscar?cuando=&que=&momento=&ccaa=` o `&lat=&lon=&km=`: cuándo (hoy, mañana, este finde, un día de la
  previsión o un mes), dónde (una comunidad o un radio de 25/50/100/200 km desde un punto) y qué (luz o fauna; en
  luz, el momento: amanecer, atardecer, hora azul, noche o todos).
- Luz: dentro de la previsión, el ranking del día filtrado por zona; fuera, «lo habitual» del mes (spec 013).
- Fauna: lugares cerca del punto con sus especies del mes y los fenómenos activos ese mes; con comunidad, los de
  esa comunidad.
- Pestañas Luz / Fauna que conservan el resto de la consulta.
- El formulario está en la portada y en `/buscar`; es un `GET`, así que funciona sin JavaScript. «Cerca de mí»
  pide la ubicación solo si hay JavaScript y rellena `lat`/`lon`.
- `/buscar` deja de redirigir a la portada (era una URL de los safaris retirados).
- **Fuera de alcance**: plan de varios días (016), guardar consultas, mapa de resultados.

## Criterios de aceptación
- [x] Una URL reproduce cualquier resultado (la consulta entera va en los parámetros).
- [x] Funciona sin JavaScript (formulario `GET` y resultados del servidor; prueba e2e con JS desactivado).
- [x] Pestañas Luz / Fauna que mantienen cuándo y dónde.
- [x] Fuera de la previsión dice que es lo habitual del mes; con un punto dice «a menos de N km de ti».

## Datos
Ninguno nuevo: `informe.json`, `spots.geojson`, `clima.json`, `lugares.json`, `eventos.json` y los de fauna.
`/buscar` es dinámica y lleva sus `.gz` en la función (`next.config.ts`).

## Diseño
Bloque `.consulta` en la cabecera de la portada (selects en fila que se apilan en móvil, botón principal y «Cerca
de mí»); `/buscar` con titular que repite la consulta en palabras, pestañas y lista con el porqué de cada sitio.

## Notas de implementación
`src/features/consulta/` (`consulta.ts`: leer y escribir la URL; `resultados.ts`: resolver cuándo y los
resultados de cada modo; `FormularioConsulta.tsx`, `CercaDeMi.tsx`), `src/app/buscar/page.tsx`.
