# 016 — Plan de varios días

Estado: hecha
Modo: ambos
Situación del fotógrafo: un finde | un viaje

## Problema
Quien tiene tres días en Asturias en octubre tiene que juntar a mano el ranking de luz o «lo habitual», la carta
de fauna, el calendario de eventos y el del cielo, y luego repartirlo por días y por zonas. La consulta común
(012) responde a un momento; un viaje necesita varios.

## Alcance
- `/plan?ccaa=…&cuando=octubre|AAAA-MM-DD&dias=3` (o `&lat=…&lon=…&km=…`), con 2, 3, 4, 5 o 7 días.
- Cada día es una zona: su ancla es el mejor atardecer que quede libre y a 25 km o más de las anclas de los otros
  días; a menos de 60 km de ella, un amanecer, el lugar de fauna con más especies esperadas ese mes (rarefacción,
  como en la carta), el fenómeno de fauna en marcha más cercano y, si hay fecha y la noche es oscura (luna ≤ 30 %)
  o hay lluvia de meteoros, un cielo de noche. Nada se repite entre días.
- Con fechas dentro de la previsión manda el ranking de ese día (amaneceres y noches solo si su nota es al menos
  regular); fuera de ella, o con un mes, «lo habitual» (013).
- Para todo el plan: los fenómenos de fauna en temporada en la zona y el cielo (luna nueva, ventanas de Vía Láctea
  sin luna, lluvias de meteoros con su luna), con enlaces a lo habitual de noche y al calendario.
- Formulario `GET` (funciona sin JavaScript) y entradas desde la portada («Más adelante») y desde `/buscar`.
- **Fuera de alcance**: rutas en coche entre zonas, alojamiento, horas de la toma, guardar o exportar el plan.

## Criterios de aceptación
- [x] Asturias-octubre da por día luz + fauna + eventos en temporada (prueba e2e: tres días, cada uno con spot y
  lugar de fauna, sin spots repetidos, «En temporada» y «El cielo en octubre»).
- [x] Vive en `/plan` y la URL reproduce el plan.
- [x] Funciona sin JavaScript.
- [x] Con fechas en la previsión usa el ranking del día; con una noche de meteoros propone un cielo para esa noche.

## Datos
Ninguno nuevo: los de la consulta común (`informe`, `spots`, `clima`, `lugares`, `eventos`, `fauna_*`). `/plan` es
dinámica y lleva sus `.gz` en la función (`next.config.ts`). Se calcula en ~0,1 s con comunidad y ~2 s en frío
para toda España.

## Diseño
Mismo esqueleto que `/buscar`: titular con la consulta en palabras, formulario, y un bloque por día con su
provincia; cada elemento lleva su rótulo (Amanecer, Fauna, En temporada, Atardecer, Noche), la cifra de luz o el
punto de fauna, y el porqué.

## Notas de implementación
`src/features/plan/` (`plan.ts`: URL y fechas; `datos.ts`: `armarPlan`; `FormularioPlan.tsx`),
`src/app/plan/page.tsx`. Reutiliza `dondeFiltra` de la consulta. `resolverCuando` devuelve también la fecha, para
que `/buscar` enlace al plan desde ese día.
