# 001 — Consolidación en photography_recommender

Estado: en curso (fase 1 hecha; quedan las specs de §4)
Modo: ambos · plataforma
Situación del fotógrafo: —

## Problema
Rasante estaba partido en dos repos: el modo Luz en `photo_recommender` y la fauna de España (mucho más rica)
dentro de `safari_recommender`. El 13-11-2026 Pablo fija la base: **`DiezPablo/photography_recommender`** (el
antiguo `safari_recommender`, que ya tiene los secretos de GBIF y eBird, la release `datos` con la fauna y los
workflows en marcha). Todo vive aquí; `photo_recommender` queda congelado (decisión 0018).

Esta versión sustituye al plan anterior (que traía la fauna hacia `photo_recommender`): el sentido de la
mudanza se invierte, así que ya no hay que migrar la fauna ni los secretos, sino **traer el modo Luz**.

## Alcance
- Fase 1 (hecha): traer el modo Luz, dar a la web la forma «una web, dos modos», quitar lo que Pablo ha
  descartado y dejar redirecciones.
- Plan del resto, partido en specs pequeñas (§4).
- **Fuera de alcance**: rediseño (004), retirar safaris del mundo (005, necesita el visto bueno de Pablo),
  rutas de senderismo (aparcadas, 0019).

## 1. Decisiones aplicadas
| Tema | Decisión |
|---|---|
| Repo y despliegue | `photography_recommender`; `SITIO` sale de `NEXT_PUBLIC_SITIO` (0018) |
| URLs | `/luz/**` y `/fauna/**`, con `/` como portada de dos puertas. Dos catálogos, dos fichas (0015): `/luz/spot/[id]` y `/fauna/lugar/[id]` |
| Enlaces antiguos | `/espana/*` → `/fauna/*` (308); la portada con parámetros de la carta → `/fauna`, con los de safaris → `/safaris` |
| eBird | Se usa todo, rarezas incluidas (0017) |
| Rutas de senderismo | No se traen; tarea para después (0019) |
| «Mis especies» y «Diario» | Quitados de la aplicación; sus URLs redirigen a `/fauna` (0016) |
| Safaris del mundo | Retirados de esta versión (spec 005, decisión 0021) |

## 2. Fase 1: qué se ha hecho
**Pipeline**
- `rasante/` copiado junto a `safari/` sin `rutas`, `logistica`, `safaris` ni `fauna` (la fauna buena es
  `safari/espana`). Un solo `pyproject.toml` con los dos paquetes; `python -m rasante` y `python -m safari`.
- Tests de Luz en `tests/` con sus grabaciones (221 pruebas en verde con las de fauna y safaris).
- Workflows `luz_datos.yml` (2 veces al día), `luz_descubrir.yml` (solo a mano hasta la spec 018; spots + dron), `luz_clima.yml`
  (solo a mano) y `luz_validar.yml`. **Siembra**: la primera vez, `sembrar.sh` copia `spots.geojson`,
  `clima.json`, `dron.json` y `verificacion.json` de la release del repo anterior a la de este; el prebuild
  también mira allí mientras falten.

**Web**
- Luz en `/luz/**` (ranking, día, spot, calendario, evento, avisos `.ics`, método) con `features/{spots,
  eventos,clima,dron,alertas,verificacion}`; sin los bloques de rutas, logística, fauna antigua ni planificador.
- Fauna en `/fauna/**` (antes `/espana/**` y la carta en `/`); `features/espana` → `features/fauna`.
- Navegación por modos (Luz · Fauna · Safaris), portada provisional de dos puertas, marca Rasante.
- Fuera: `/espana/mis-especies`, `/espana/diario`, sus componentes, botones «la he visto» y filtro «Sin ver».
- E2E: `e2e/luz.spec.ts` nuevo; las de fauna y safaris, adaptadas a las URLs nuevas.

**Proceso**: kit de trabajo (`.claude/`, `docs/producto`, `docs/decisiones`, `docs/specs`); los registros
antiguos de los dos repos, en `docs/archivo/`.

### No traído del mock de Luz (a propósito)
| Qué | Por qué | Dónde queda |
|---|---|---|
| Rutas de senderismo y logística de OSM | Decisión de Pablo (0019) | Backlog «Después» |
| Planificador `/viaje` | Dependía de rutas y de la fauna antigua; aquí `/viaje` es de safaris | Spec 016 |
| Fauna de Rasante (observatorios OSM + 32 especies curadas, calendario de fauna) | La de aquí es mejor; no duplicar | Los eventos de fauna del CSV siguen en `/luz/evento/[id]` hasta la 014 |
| Web instalable, «sin conexión» de Rasante y selector de tema (modo noche rojo) | Aquí ya hay `sw.js` y «Guardar sin conexión» propios; el resto es diseño | Spec 004 |

## 3. Riesgos (medidos el 13-11-2026)
- **Tamaño en Vercel (0002)**. Datos comprimidos: `espana.json` 5,6 MB, `espana_ebird.json` 3,4, `informe.json`
  3,0, `safaris_mundo.json` 2,1, resto < 1 MB. Salida del build: ~131 MB de páginas (Luz 81, fichas de parque
  28, fauna 2). Muy por debajo de 1 GB. Lo que más pesa es Luz: 60 fichas de spot (37 MB) y los JSON del
  ranking (23 MB).
- **Nº de despliegues**. Con los safaris retirados (005) publican `luz_datos` (2/día) y `espana_recientes`
  (1/día), más los trimestrales y semanales de fauna: 3 al día × 30 días de retención.
- **Doble cómputo**: mientras `photo_recommender` siga con sus workflows, la previsión se calcula dos veces
  (dos cuotas de Open-Meteo, dos despliegues). Hay que apagarlos allí (spec 017).
- **Secretos**: `GBIF_USUARIO`, `GBIF_CLAVE` y `EBIRD_CLAVE` ya están aquí (environment `EBIRD_CLAVE`). Luz no
  necesita ninguno; Telegram es opcional (`TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`, variable `WEB_URL`).
- **URL pública**: `src/lib/sitio.ts` aún apunta por defecto al dominio de safaris. Los `.ics` y el sitemap
  usan esa URL: definir `NEXT_PUBLIC_SITIO` en Vercel con el dominio definitivo.
- **Dos pipelines con `comun` gemelo** (`rasante/comun`, `safari/comun`): riesgo de divergencia hasta la 006.
- **Aspecto**: las páginas de Luz heredan los estilos de este repo (mismas clases, otros tokens). Funcionan y
  pasan las pruebas, pero no están diseñadas: es trabajo de la 004.

## 4. Partición (en el backlog)
- **003 — Núcleo común de lugar**: `lugares.json` con spots y lugares de fauna. Ver su spec.
- **005 — Safaris del mundo, fuera de esta versión**: hecha (`docs/specs/005-safaris-fuera.md`, decisión 0021).
- **006 — Un solo pipeline**: `safari/espana` → `rasante/fauna`, un único `comun`, órdenes
  `python -m rasante fauna …`, workflows `fauna_*.yml`. CA: tests en verde; los nombres de los ficheros
  publicados no cambian en esta spec; ningún import de `safari.` fuera de safaris.
- **007 — Limpieza de datos de fauna**: fuera `espana_rutas.json` y `espana_rasante.json`; ficheros `espana_*`
  → `fauna_*` con el prebuild aceptando ambos nombres durante un despliegue. CA: build y e2e en verde.
- **012 — Consulta común y portada**, **004 — Diseño**, **010 — Ficha de lugar de fauna y de especie con
  «luz cerca»**, **013 — Idoneidad**, **014 — Eventos con varios lugares** (fusiona `fenomenos.ts` y los
  eventos de fauna del CSV; salen de `/luz/evento`), **015 — «¿Dónde verlo?»**, **016 — Plan de varios días**.
- **017 — Cierre del repo anterior**: apagar workflows de `photo_recommender` y redirigir su web al dominio
  nuevo (`/spot/x` → `/luz/spot/x`, `/safaris/*` → `/safaris/*`, `/fauna*` → `/fauna`). CA: ningún workflow
  programado activo allí; las URLs antiguas responden 308.

## 5. Candidatos a eliminar (propuesta; no se elimina nada sin el visto bueno de Pablo)
- **Alineaciones de sol y luna con picos** (`rasante/eventos/alineaciones`): terreno de PhotoPills/TPE.
- **Panorama con trayectorias de sol, luna y Vía Láctea en la ficha de spot**: planificación de encuadre.
- **Mareas y oleaje** (Open-Meteo Marine, ~300 llamadas por ejecución): no entra en la nota; información de más.
- **`LuzYMar`: dirección de la luz por la mañana y la tarde en fauna**: brújula de PhotoPills.
- **Dron sí/no como bloque propio**: una línea en Normas basta.
- **Marcador de aciertos con METAR en «Método»**: útil para validar, no para el fotógrafo.
- **Avisos por Telegram** (`rasante/avisos`): sin uso; los `.ics` ya avisan.
- **Calendarios `.ics` por comunidad** (18 + España): con el nacional basta.
- **`Alojamientos` en la ficha de lugar de fauna**: no es «dónde ir».
- **`experimentos.py` y `diagnostico.py` de la cuadrícula**: investigación ya hecha.
- **`espana_rutas.json`** (rutas de OSM en lugares de fauna): las rutas están aparcadas (0019).

## Criterios de aceptación (fase 1)
- [x] `make check` en verde con los dos pipelines y la web.
- [x] `npm run build` genera `/luz/**`, `/fauna/**` y safaris; e2e en verde en móvil y escritorio.
- [x] `/espana/hides` → `/fauna/hides`; `/?especie=…` → `/fauna?especie=…`; `/fauna/mis-especies` → `/fauna`.
- [x] Ninguna referencia a rutas, logística, «Mis especies» ni «Diario» en `src/`.
- [x] Tamaños de datos y de build anotados (§3).
- [ ] Primer `luz_datos.yml` en Actions siembra y publica (se comprueba al fusionar).

## Datos
Sin fuentes nuevas. La release `datos` de este repo pasa a tener también los ficheros de Luz.

## Notas de implementación
Pasos manuales de Pablo tras fusionar: (1) `NEXT_PUBLIC_SITIO` en Vercel; (2) lanzar `Luz · previsión` a mano
una vez; (3) desactivar los workflows programados de `photo_recommender` (o esperar a la 017).
