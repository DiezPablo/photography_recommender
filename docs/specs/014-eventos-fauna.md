# 014 — Eventos de fauna con varios lugares

Estado: en curso (hecha la primera parte: modelo y página del fenómeno; queda la fusión de `fenomenos.ts`)
Modo: Fauna
Situación del fotógrafo: un evento («quiero la berrea»)

## Problema
Quien quiere «la berrea» no busca un sitio, busca elegir entre varios: cuál le pilla cerca, dónde empieza antes,
dónde es más fácil verla. Hoy cada lugar es un evento suelto (cuatro de berrea, en fichas que no se conocen entre
sí) y, además, la fauna tiene los mismos fenómenos escritos dos veces (`eventos_naturaleza.csv` en el pipeline y
`fenomenos.ts` en la web).

## Alcance
**Primera parte (hecha)**
- Un **fenómeno de fauna** reúne varios eventos-lugar: `rasante/recursos/fenomenos_fauna.csv` (nombre, especie,
  franja del día, descripción, consejo, fuente). Sus lugares son los eventos de fauna cuyo id empieza por el suyo
  (`berrea-monfrague` es de `berrea`): añadir un lugar es añadir una fila al CSV de eventos. Van en
  `eventos.json` (`fenomenos`). Hoy: `berrea` y `grullas`.
- La berrea pasa de 4 a 11 lugares en 9 comunidades: se añaden Sierra de la Culebra, Saja, Cazorla, Boumort,
  Montes Universales, Redes e Irati, escritos a mano con fechas habituales y consejo.
- `/fauna/evento/[id]`: cuándo (el tramo de fechas entre todos los lugares) y a qué hora, normas, mapa y la lista
  de lugares con provincia y comunidad, sus fechas y su mejor momento, y la **fiabilidad**: lo que se registra de
  la especie en las cuadrículas de 10 km del lugar en esos meses (‰ de su grupo y confianza por tamaño de
  muestra, las mismas palabras que el resto de Fauna). Ordena la lista. Se enlaza desde la ficha de cada lugar
  del fenómeno y desde la ficha de la especie.

**Segunda parte (pendiente)**
- Fusionar `src/features/fauna/fenomenos.ts` con `eventos_naturaleza.csv` (una sola lista escrita a mano, con
  `dormidero` y fuentes por lugar) y que las fichas de lugar y de especie lean de ahí.
- Sacar las fichas de los eventos de fauna de `/luz/evento/[id]` (a `/fauna/evento/…`, con redirección) y dar a
  Fauna su calendario de fenómenos.
- Más fenómenos con varios lugares (invernada de acuáticas, paso del Estrecho, celo de la cabra montés).

- **Fuera de alcance**: ubicaciones de especies sensibles (lince, oso, lobo siguen solo por zona, decisión 0011);
  previsión del tiempo por lugar; reservas de salidas guiadas.

## Criterios de aceptación
- [x] La berrea lista ≥ 8 lugares de ≥ 4 comunidades, cada uno con fechas, franja y fiabilidad (test del
      pipeline y e2e).
- [x] Un fenómeno con menos de dos lugares, sin fuente `https` o con campos vacíos no se publica (test).
- [x] Sin `fenomenos` publicados (hasta el primer cálculo de eventos tras fusionar), la página no existe y nadie
      la enlaza; nada falla.
- [ ] Primera publicación comprobada en producción (`/fauna/evento/berrea`).
- [ ] `fenomenos.ts` fusionado con el CSV; los eventos de fauna fuera de `/luz/evento` (segunda parte).

## Datos
Escritos a mano: revisar cada año con el resto de eventos. La fuente del fenómeno es la de su descripción; los
lugares añadidos son espacios protegidos conocidos por la berrea, con fechas habituales (antes en el sur, más
tarde en la montaña del norte). La fiabilidad es de GBIF por cuadrícula (CC BY 4.0, ya citado en `/fuentes`).

## Diseño
Provisional, con las piezas de la ficha de evento. El definitivo, con 004/010.

## Notas de implementación
La fiabilidad mide dónde hay más registros de la especie, no la probabilidad de verla: en lugares poco visitados
puede salir «sin registros suficientes» aunque el sitio sea bueno, y así se dice.
