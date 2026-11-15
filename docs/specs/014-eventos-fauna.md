# 014 — Eventos de fauna con varios lugares

Estado: hecha
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

**Segunda parte (hecha)**
- **Una sola lista escrita a mano**: `eventos_naturaleza.csv` gana tres columnas opcionales para la fauna
  (`especie`, `dormidero`, `fuentes`) y recibe lo que solo estaba en `src/features/fauna/fenomenos.ts`: la
  invernada del delta del Ebro, los ánsares de Villafáfila, los buitres de Monfragüe y el paso de primavera por
  el Estrecho. `fenomenos.ts` se queda en funciones puras sobre esa lista; las fichas de lugar y de especie y
  «¿Qué veo aquí?» leen de ella (el servidor se la pasa a los componentes de cliente).
- **Los eventos de fauna viven en Fauna**: su ficha es `/fauna/evento/[id]` (la misma dirección sirve el
  fenómeno, `berrea`, y cada lugar, `berrea-monfrague`) y la antigua `/luz/evento/[id]` redirige. La ficha
  enseña ya el dormidero y las fuentes.
- **Calendario de fauna** en `/fauna/calendario`: lo que pasa cada mes, empezando por el mes en curso, y los
  fenómenos con varios lugares. En el menú de escritorio; en la barra del móvil no cabe (se llega desde las
  fichas).
- Queda fuera, para cuando haga falta: más fenómenos con varios lugares (invernada de acuáticas, celo de la
  cabra montés) — basta con añadir filas.

- **Fuera de alcance**: ubicaciones de especies sensibles (lince, oso, lobo siguen solo por zona, decisión 0011);
  previsión del tiempo por lugar; reservas de salidas guiadas.

## Criterios de aceptación
- [x] La berrea lista ≥ 8 lugares de ≥ 4 comunidades, cada uno con fechas, franja y fiabilidad (test del
      pipeline y e2e).
- [x] Un fenómeno con menos de dos lugares, sin fuente `https` o con campos vacíos no se publica (test).
- [x] Sin `fenomenos` publicados (hasta el primer cálculo de eventos tras fusionar), la página no existe y nadie
      la enlaza; nada falla.
- [x] Primera publicación comprobada en producción (15-11-2026): `/fauna/evento/berrea` con sus 11 lugares.
- [x] `fenomenos.ts` fusionado con el CSV: ningún fenómeno escrito en la web; los 12 que había siguen saliendo
      en las fichas (e2e).
- [x] Los eventos de fauna fuera de `/luz/evento`: `/luz/evento/berrea-monfrague` lleva a
      `/fauna/evento/berrea-monfrague`; los de paisaje no se mueven (e2e).
- [x] Todas las fuentes enlazadas responden (comprobadas el 15-11-2026; se corrige la de Villafáfila, que estaba
      rota).

## Datos
Escritos a mano: revisar cada año con el resto de eventos. La fuente del fenómeno es la de su descripción; los
lugares añadidos son espacios protegidos conocidos por la berrea, con fechas habituales (antes en el sur, más
tarde en la montaña del norte). La fiabilidad es de GBIF por cuadrícula (CC BY 4.0, ya citado en `/fuentes`).

## Diseño
Provisional, con las piezas de la ficha de evento. El definitivo, con 004/010.

## Notas de implementación
La fiabilidad mide dónde hay más registros de la especie, no la probabilidad de verla: en lugares poco visitados
puede salir «sin registros suficientes» aunque el sitio sea bueno, y así se dice.
