# 025 — La luna llena sobre un objeto

Estado: hecha
Modo: Luz
Situación del fotógrafo: un evento

## Problema
Para fotografiar la luna llena sobre un edificio o un pico hay que saber cuándo y desde dónde, y las dos cosas
dependen la una de la otra. PhotoPills lo resuelve con herramientas que hay que aprender a manejar. Pablo lo
intentó con las Cuatro Torres y no supo por dónde empezar (decisión 0026).

## Alcance
- `/luz/alinear`: un formulario GET con las coordenadas del objeto (pegadas de cualquier mapa), su altura y, si
  se sabe, cuánto más alta está su base que el sitio desde donde se mira. Sin JavaScript funciona igual.
- Resultado: en los próximos 12 meses (o desde la fecha que se elija), cada salida o puesta de la luna con al
  menos el 85 % iluminado en la que el sol está entre 12° bajo el horizonte y 8° sobre él. Por cada una:
  - fecha, si sale o se pone e iluminación;
  - una fila por distancia (3, 5, 8, 12, 16 y 20 km, solo las que dejan el objeto al menos 0,4° sobre el
    horizonte): la hora a la que la luna queda apoyada en lo alto del objeto, el punto donde ponerse con un
    enlace al mapa, hacia dónde mirar, la luz que hay (día, hora dorada, hora azul, crepúsculo, noche) y el tamaño
    de la luna comparado con el objeto.
  - Se destacan las filas con el sol entre −6° y +3° (paisaje con luz y luna sin quemar).
- Un ejemplo de un clic: las Cuatro Torres de Madrid.
- Entrada en el menú de Luz (escritorio) y enlace desde «Método».
- **Fuera de alcance**: el relieve y los edificios entre medias (lo avisa la página), mapa interactivo, el sol y
  la Vía Láctea, buscar el objeto por nombre, guardar planes.

## Criterios de aceptación
- [x] Con las Cuatro Torres desde el 1-12-2026 sale el 24-12-2026 a ~8 km hacia el oeste-suroeste hacia las
      18:4x, como en el cálculo hecho a mano con astropy (diferencia ≤ 3 min y ≤ 1° de rumbo) (test).
- [x] La posición de la luna coincide con astropy en tres instantes de prueba: ≤ 0,02° de azimut y ≤ 0,2° de
      altura (la diferencia es el modelo de refracción) (test).
- [x] Sin JavaScript, el formulario envía y la página lista las fechas (e2e).
- [x] Coordenadas fuera de España o altura no válida: mensaje claro, sin error (e2e).
- [x] `make check` y la e2e en verde.

## Datos
Ninguna fuente nueva: todo se calcula al pedir la página (`astronomy-engine`, MIT, en el servidor). Coste: unos
milisegundos por petición; no añade nada al build ni a la release.

## Diseño
Las piezas de `/plan` y `/buscar`: titular, formulario `.consulta`, lista de resultados y nota al pie.

## Notas de implementación
- `src/features/alinear/`: `alinear.ts` (leer la URL, puro), `calculo.ts` (astronomía, puro, probado en la e2e),
  `FormularioAlinear.tsx`.
- La luna «apoyada» es su centro a un radio (0,26°) por encima de lo alto del objeto. Altura aparente del objeto
  con la curvatura y la refracción terrestre (k = 0,13), como en `rasante/terreno`.
