# 005 — Safaris del mundo, fuera de esta versión

Estado: hecha
Modo: plataforma
Situación del fotógrafo: —

## Problema
El repo base traía una web entera de safaris por el mundo: tercer modo en la navegación, buscador y selector de
mes en la cabecera, tres workflows diarios y la única prueba en rojo de la suite. La visión los deja fuera y
Pablo decide retirarlos de esta versión (decisión 0021).

## Alcance
- Web: fuera sus páginas, componentes, la carta del mundo, el buscador global y el selector de mes. La
  navegación queda en dos modos (Luz y Fauna).
- Lo que Fauna compartía con ellos pasa a `features/fauna`: niveles de frecuencia y confianza
  (`frecuencia.ts`), la tabla de frecuencia por mes y los grupos de fauna. Sin cambios de comportamiento.
- Pipeline: `safari/` se queda en lo que usa Fauna (`espana`, `comun`, `frecuencia`, el cliente de iNaturalist y
  Overpass, ahora en `safari/overpass.py`). `python -m safari` solo tiene las órdenes `--espana…`.
- Workflows `safaris.yml`, `safaris_mundo.yml` y `recientes.yml`, sus pruebas y sus grabaciones, fuera.
- Redirecciones temporales (307) de sus URLs a la portada.
- **Fuera de alcance**: renombrar el paquete `safari` (006); podar el CSS que solo usaban los safaris (004);
  borrar sus ficheros de la release.

## Criterios de aceptación
- [x] Ningún import de `features/safaris` ni rutas de safaris en `src/`; `tsc`, ESLint y Prettier en verde.
- [x] `/safaris`, `/parque/x`, `/especie/x`, `/planificar` y `/mapa` llevan a la portada; `/fauna/mapa` y
      `/fauna/especie/x` siguen siendo de Fauna (prueba e2e).
- [x] Las ocho órdenes `--espana…` que usan los workflows responden igual; 188 pruebas de Python en verde (las
      50 que se van eran de safaris).
- [x] E2E en móvil y escritorio: 104 pasan y 0 fallan (2 se saltan hasta que haya listas de eBird). La prueba del
      planificador de safaris que fallaba en `main` desaparece con la función que probaba.
- [x] Build: 225 páginas generadas (antes 495) y 85 MB (antes 131 MB).
- [x] La revisión anual de datos escritos a mano vuelve a ver los de fauna: apuntaba a `features/espana`, que se
      renombró a `features/fauna` en la consolidación, y no encontraba nada.
- [ ] Borrar de la release `datos` los `safaris*.json` (sin uso; hay que hacerlo a mano, no estorban).

## Datos
Dejan de descargarse y de publicarse `safaris.json`, `safaris_mundo.json`, `safaris_indice.json` y
`safaris_recientes.json`. Nada queda ya en `public/datos` salvo el resumen para las pruebas. Despliegues al día:
de ~6 a 3 (dos de la previsión y uno de fauna).

## Notas de implementación
Se retiran 17 600 líneas en 166 ficheros. Cuidado al recuperar algo: `safari/espana/inat_espana.py` usa el
cliente de `safari/inat.py` (por eso ese módulo se queda, recortado) y `lugares.py` usa Overpass. Las claves de
caché (`inat_`, `inat_reciente_`, `fallo_`) no cambian.
