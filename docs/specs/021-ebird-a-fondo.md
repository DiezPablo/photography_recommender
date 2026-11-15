# 021 — eBird a fondo

Estado: hecha en código (bloques 2 y 3 a la espera de su primera ejecución en Actions)
Modo: Fauna
Situación del fotógrafo: una tarde | un finde | un viaje

## Problema
De eBird solo usamos tres cosas: la última observación de cada especie **por provincia** (30 días), las
rarezas de 7 días y la lista de puntos con su recuento de especies. Con eso no se puede responder «¿qué se
está viendo en *este* lugar estos días?» ni «¿a qué punto está yendo la gente?», que es justo lo que decide una
salida de tarde o de finde. Sin monetización (decisión 0017) no hay motivo para no usar todo lo que da la API.

## Alcance
Tres bloques, cada uno implementable por separado y en este orden:

1. **Listas recientes por punto** (`product/lists/{provincia}`, 52 peticiones al día). Para cada punto de
   eBird: cuántas listas en los últimos 7 y 30 días, fecha de la última y cuántas especies llevaba.
   Responde «dónde se está saliendo» y ordena mejor «Cerca de mí» que el recuento histórico.
2. **Actividad por provincia** (`product/stats/{provincia}/{año}/{mes}/{día}`, 52 al día). Listas, observadores
   y especies del día anterior; con el histórico de 30 días, una línea en «Este finde»: «en Cáceres se ven estos
   días N especies».
3. **Especies de cada punto** (`product/spplist/{punto}` + taxonomía en español, una vez). Qué se ha registrado
   alguna vez en el punto. Solo para los puntos con más especies, por tandas diarias con caché (como
   `safaris_mundo`), hasta cubrirlos.

- **Fuera de alcance**: observaciones recientes punto a punto (18 500 puntos: demasiadas peticiones), datos que
  la API no da (barras de frecuencia semanal), fotos de Macaulay Library (otra licencia), nada en el navegador
  (la clave no sale de Actions).

## Criterios de aceptación
- [x] Bloque 1: `espana_recientes.yml` publica `espana_listas.json` (por punto: listas de 7 y 30 días, última
      fecha, especies de la lista más larga) y la ficha de un punto de eBird lo muestra. El recuento por día se
      guarda en `espana_listas_dias.json` y el histórico de 30 días se completa en unos 6 días (5 por ejecución).
- [x] Bloque 1, primera ejecución en Actions (14-11-2026): 1 805 listas en 1 002 puntos en los 5 primeros
      días, con el formato esperado. «Cerca de aquí» se queda, de los puntos de eBird de cada cuadrícula, con el
      de más listas en 30 días y dice cuántas hubo esa semana.
- [x] Cobertura: eBird no da «provincias» en las comunidades de una sola (Madrid, Asturias, Cantabria, Murcia,
      Navarra, La Rioja, Baleares, Ceuta, Melilla) y se quedaban sin recientes, rarezas ni listas. Ahora se piden
      por su región de primer nivel (`ebird.provincias`); el histórico de listas se vuelve a pedir si cambian
      las regiones.
- [x] Comprobado en la ejecución del 14-11-2026 tras el arreglo: Madrid pasa de 0 a 190 observaciones de eBird
      (Asturias 221, Cantabria 225, Murcia 195, Navarra 195, La Rioja 147, Baleares 194, Ceuta 59, Melilla 17);
      53 provincias con datos (antes 45), rarezas de 361 a 510 y listas de 1 805 a 2 330 (Madrid, 171).
- [x] Bloque 2: `python -m rasante fauna regiones` → `espana_ebird_regiones.json` (listas, observadores y
      especies por región y día, 30 días; el fichero publicado hace de historial). Línea en «Este finde» y en la
      ficha de cada punto de eBird («En Madrid, estos días: N listas en 7 días, hasta M especies en un día»); sin
      el fichero, la web no enseña nada.
- [x] Bloque 3: `python -m rasante fauna especies` → `espana_especies_punto.json`: lista plegable de especies
      con nombre en español (taxonomía de eBird) en la ficha de los 4 455 puntos con 100 especies o más, por
      tandas de ≤ 250 al día dentro del presupuesto, de más a menos especies; el log dice cuántos quedan.
- [x] En total, ≤ 500 peticiones al día a eBird: las órdenes de una ejecución comparten un contador
      (`EBIRD_CONTADOR`) y las que rellenan (regiones, especies) se ajustan a lo que queda (test). Un solo
      despliegue diario: todo se publica en el mismo paso.
- [x] Especies sensibles: eBird ya las oculta en su API y además se quitan las de `AVES_SENSIBLES`
      (urogallo, águila imperial y perdicera, quebrantahuesos, cigüeña negra, hubara) de las listas por punto
      (test del pipeline y e2e).
- [x] Atribución a eBird en cada bloque nuevo (ya estaba en `/fuentes`).
- [ ] Primera ejecución en Actions de los bloques 2 y 3 y su publicación comprobadas.

## Datos
API de eBird 2.0 (condiciones de uso de eBird, no comercial, con atribución). Ficheros nuevos pequeños
(< 0,5 MB comprimidos cada uno); la lista de especies por punto, por bloques como la cuadrícula.

## Diseño
(La rellena `/diseno`: dónde va cada dato en la ficha de lugar y en «Cerca de mí».)

## Notas de implementación
Bloque 1: `rasante/fauna/ebird_listas.py` (`python -m rasante fauna listas`). Solo se guardan recuentos por punto: ni
observadores ni listas sueltas, y solo de los puntos públicos que ya son lugares. eBird da como mucho 200 listas
por provincia y día: en las provincias con más actividad el recuento es un mínimo (se avisa en el log).

`rasante/fauna/ebird.py` ya tiene `_get` con pausa de 1 s y clave opcional. Las respuestas de estos tres
endpoints hay que grabarlas una vez desde Actions (aquí no hay clave) antes de escribir los tests.
