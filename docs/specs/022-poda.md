# 022 — Poda de «información justa»

Estado: hecha
Modo: ambos
Situación del fotógrafo: —

## Problema
Rasante dice dónde ir y cuándo; varias piezas heredadas planifican la toma (alineaciones, panorama, brújula del
sol) o no ayudan a decidir (oleaje, marcador de aciertos, alojamientos, un calendario por comunidad, avisos por
Telegram sin uso). Ocupan pantalla, datos y mantenimiento. Lista de candidatos en la spec 001 §5; Pablo aprobó la
propuesta el 15-11-2026.

## Alcance
- **Fuera**: alineaciones de sol y luna con picos (web, `rasante/eventos/alineaciones.py`, `alineaciones.json` y su
  paso en `luz_datos.yml`); panorama de horizonte con trayectorias en la ficha de spot; la dirección del sol en las
  fichas de fauna y sus rumbos en el mapa; el bloque propio de dron; el marcador de aciertos con METAR en «Método»
  (la verificación sigue en el pipeline como informe interno); los avisos por Telegram (`rasante/avisos` y su paso
  en `luz_datos.yml`); los calendarios `.ics` por comunidad; los alojamientos del plan de finde; `experimentos.py` y
  `diagnostico.py` de la cuadrícula y sus entradas en `fauna_cuadricula.yml`.
- **Reducido a una línea**: dron (nivel + «consulta ENAIRE» en los datos del spot); mar en la ficha de spot
  (pleamar y bajamar, sin oleaje).
- **Se queda**: las mareas de la costa en fauna, con la ventana para limícolas («Mareas hoy», solo en la costa):
  dicen cuándo ir, no cómo encuadrar.
- Los `.ics` por comunidad redirigen (301) al de toda España para no romper suscripciones.
- **Fuera de alcance**: borrar `alineaciones.json`, `verificacion.json` o `dron.json` de la release (Pablo);
  los secretos `TELEGRAM_*` del repo (Pablo puede borrarlos).

## Criterios de aceptación
- [x] Ninguna referencia a alineaciones, panorama, marcador, Telegram, alojamientos ni experimentos/diagnóstico en
  `src/`, `rasante/`, workflows ni pruebas (grep).
- [x] La ficha de spot de costa enseña la marea y el dron en una línea con enlace a ENAIRE, sin bloque `#dron`
  (e2e).
- [x] `/luz/alertas` ofrece un solo calendario y `/luz/alertas/aragon.ics` lleva a `espana.ics`.
- [x] `make check`, build y e2e en verde.

## Datos
Menos: el build ya no descarga `alineaciones.json` ni `verificacion.json`; `luz_datos.yml` ya no calcula
alineaciones (un año de efemérides por spot). Ninguna fuente nueva.

## Diseño
Sin piezas nuevas: se quitan bloques y su CSS.

## Notas de implementación
`src/app/luz/spot/[id]/page.tsx`, `src/features/dron/Dron.tsx`, `src/features/fauna/MareasFauna.tsx` (antes
`LuzYMar`), `src/features/alertas/calendarios.ts`, `next.config.ts` (redirección), `rasante/__main__.py`,
`rasante/fauna/ordenes.py`, `.github/workflows/luz_datos.yml` y `fauna_cuadricula.yml`.
