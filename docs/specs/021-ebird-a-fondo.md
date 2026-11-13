# 021 — eBird a fondo

Estado: propuesta
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
- [ ] Bloque 1: `espana_recientes.yml` publica `fauna_actividad_puntos.json` (por punto: listas 7 y 30 días,
      última fecha, especies de la última); la ficha de lugar y «Cerca de mí» lo muestran; test con respuestas
      reales grabadas en Actions.
- [ ] Bloque 2: serie de 30 días por provincia en la release; una línea en «Este finde»; sin clave, la web no
      enseña el bloque.
- [ ] Bloque 3: lista de especies con nombre en español en la ficha de los puntos cubiertos; tanda diaria
      ≤ 300 peticiones; progreso visible en el log.
- [ ] En total, ≤ 500 peticiones al día a eBird (hoy ~110) y un solo despliegue diario por estos datos.
- [ ] Especies sensibles: eBird ya las oculta en su API; test de que ninguna de la lista de 0011 sale con punto.
- [ ] Atribución a eBird en cada bloque nuevo y en `/fuentes`.

## Datos
API de eBird 2.0 (condiciones de uso de eBird, no comercial, con atribución). Ficheros nuevos pequeños
(< 0,5 MB comprimidos cada uno); la lista de especies por punto, por bloques como la cuadrícula.

## Diseño
(La rellena `/diseno`: dónde va cada dato en la ficha de lugar y en «Cerca de mí».)

## Notas de implementación
`safari/espana/ebird.py` ya tiene `_get` con pausa de 1 s y clave opcional. Las respuestas de estos tres
endpoints hay que grabarlas una vez desde Actions (aquí no hay clave) antes de escribir los tests.
