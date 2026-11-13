# 020 — Página única de fuentes y créditos que faltaban

Estado: hecha
Modo: ambos
Situación del fotógrafo: —

## Problema
La auditoría 002 encontró fuentes usadas sin crédito visible (contornos Natura 2000 de la EEA, METAR de Iowa
Environmental Mesonet, NOAA SWPC, IGN, Natural Earth) y dos sitios distintos para las fuentes: una tabla en
Método (solo Luz) y un desplegable en Fauna. Usar datos abiertos obliga a citarlos bien.

## Alcance
- `/fuentes`: una página con las fuentes de los dos modos, su uso y su licencia; enlazada desde el pie.
- Una sola lista (`src/lib/fuentes.ts`) para esa página y para la tabla de Método.
- Crédito de la EEA en la ficha de un lugar de fauna cuando se dibuja su contorno Natura 2000.
- Licencias dudosas, contrastadas en la web de cada fuente y anotadas en `docs/datos/fuentes.md`.
- **Fuera de alcance**: rediseñar Método (004); las fuentes de safaris, que siguen en su pie.

## Criterios de aceptación
- [x] `/fuentes` muestra dos tablas (Luz y Fauna) con todas las fuentes de `docs/datos/fuentes.md`; no pertenece
      a ningún modo en la navegación.
- [x] Método usa la misma lista e incluye Mesonet, NOAA SWPC, IGN y Natural Earth.
- [x] La ficha de un lugar con contorno Natura 2000 dice «Agencia Europea de Medio Ambiente (CC BY 4.0)».
- [x] Pruebas e2e de las tres cosas, en móvil y escritorio.
- [x] Licencias comprobadas el 13-11-2026: EEA (CC BY 4.0, uso comercial incluido), Terrain Tiles (atribución en
      el repositorio de Tilezen), atlas de Lorenz (sin licencia publicada). Queda ENAIRE.

## Datos
Sin datos nuevos.

## Diseño
Página de texto con la plantilla `prosa`, como Método. Sin diseño propio hasta la 004.

## Notas de implementación
`src/lib/fuentes.ts`, `src/ui/TablaFuentes.tsx`, `src/app/fuentes/page.tsx`. El atlas de Lorenz pide no
confundir sus mapas con la escala de Bortle: la web dice siempre «≈ Bortle» y la tabla lo explica.
