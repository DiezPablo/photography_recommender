# Safaris — contexto para Claude Code

Web de safaris en todo el mundo: **dónde y cuándo ver cada animal y cómo organizarlo**. Parques nacionales y
reservas con fauna (unos 3500), qué se ve y cuándo, lo visto en los últimos 30 días, cómo llegar (aeropuertos y
pistas), alojamientos y operadores locales. Datos abiertos, gratis, **sin comisiones** y **sin IA/LLM** (decisión
del usuario). Nació dentro de Rasante (DiezPablo/photo_recommender) y se separó el 26-10-2026. Decisiones y
problemas en `docs/decisiones.md` (añade ahí lo nuevo); análisis de mercado y hoja de ruta en `docs/hoja-de-ruta.md`.

## Piezas
- Pipeline Python, paquete `safari/` (`python -m safari …`):
  - `catalogo` (65 destacados escritos a mano en `recursos/safaris.csv`), `inat` (iNaturalist), `entorno`
    (Wikidata, clima de NASA POWER, alojamientos de OSM) → `safaris.json`; `--recientes` → `safaris_recientes.json`.
  - `--mundo`: `mundo` (candidatos de Wikidata cribados con GBIF), `practico` (aeropuertos de OurAirports, lluvia
    de NASA POWER, época, OSM por tandas, operadores de la ciudad de acceso), `mundo_cli` → `safaris_mundo.json` y
    `safaris_indice.json`. Incremental: `--minutos` fija el tiempo de peticiones nuevas; después solo caché.
  - `comun` (caché `CacheJson`, sesión HTTP, `escribir_json` sin NaN), `commons` (Wikimedia Commons), `gbif`.
  - `espana` (`--espana`): cuadrícula EEA, descarga SQL de GBIF y eBird (credenciales opcionales en `.env.example`),
    estacionalidad con confianza y backtest; workflow `espana.yml` a mano. `--espana-recientes`: la última ave vista
    de cada especie por provincia en 30 días (eBird) → `espana_recientes.json`; `--espana-lugares`: puntos de eBird,
    espacios protegidos de Wikidata y observatorios de OSM (Overpass) → `espana_lugares.json`; los dos en el
    workflow `espana_recientes.yml`, diario, que también escribe `espana_natura.json` (límites Natura 2000 de la
    EEA y sus cuadrículas, `natura`) y `espana_rutas.json` (rutas de senderismo de OSM); `espana_recientes.json`
    lleva además mamíferos, reptiles y anfibios de iNaturalist (`inat_espana`). `--espana-actividad espana.json`:
    hora de actividad por especie (altura del sol en cada observación de iNaturalist) → `espana_actividad.json`,
    workflow `espana_actividad.yml`, semanal.
- Web Next.js 16 (App Router) en `src/`: `app/` (`/` (la carta de España; los enlaces antiguos con parámetros de safaris van a `/safaris`), `/safaris` (portada de safaris), `/buscar` (y `/buscar.json` para el buscador de la cabecera), `/parque/[id]`, `/especies`, `/especie/[slug]`, `/guia`, `/comparar`, `/migracion`,
  `/planificar`, `/presupuesto`, `/viaje`, `/safari-en/[mes|país]`, `/mapa` (la carta de safaris: parques
  del mundo, temporada por mes y ‰ de cada mamífero; `features/carta/CartaMundo.tsx` y `mundo.ts`), `/espana` (sin modo redirige a `/`, la carta: mapa del IGN con la
  fauna por cuadrícula de 10 km, fiabilidad, luz y ficha de cuadrícula, en `features/carta/`, estado en la URL; con
  `modo=aqui|finde|donde`, «Cerca de mí», «Este finde» y «Buscar especie»), `/espana/lugar/[id]` (ficha de cada lugar,
  ISR; fenómenos escritos a mano en `features/espana/fenomenos.ts`), `/espana/mis-especies` (lista de vistas, solo
  en el navegador), `/espana/hides` (hides y salidas guiadas escritos a mano en `features/espana/hides.ts`;
  propuestas con la plantilla de incidencia `propon-hide.yml`), `/espana/rarezas` (notables de eBird),
  `/espana/especie/[clave]` (ficha de especie, ISR; consejos y dificultad de fotografía en
  `features/espana/fotografia.ts`), `/espana/mapa` (redirige a la carta), `/espana/diario` (salidas, en el
  navegador), `/espana/normas` (ley citada, drones y parques nacionales; `features/espana/normas.ts`). Sin conexión:
  `public/sw.js` (páginas de red y, sin cobertura, la copia; «Guardar sin conexión»); `.ics` por parque y `/migracion.ics`,
  `/recientes.xml`, `sitemap.xml`),
  `features/safaris` (componentes, modelo, `datos.ts` solo servidor; `veredicto.ts`, `zonasParque.ts`, `gruposFauna.ts`),
  el mes del viaje en `lib/mes.ts` (URL `?mes=marzo` y navegador, selector en la cabecera), `ui/` (mapa Leaflet, iconos, `Navegacion.tsx`: dos mundos, «Safaris» y «España», con conmutador en la cabecera y
  menú y barra del móvil propios de cada uno; `FotoGrande.tsx`), `lib/`
  (`datos.ts`: lee `datos/*.gz`; `almacen.ts`; `fechas.ts`), `estilos/` (01-11 heredados de Rasante; el aspecto
  propio, rediseño B de 11-2026, en `01-tokens.css`, `12-diseno.css` y `13-carta.css`, que va la última).
  Los 65 destacados se generan en el build; el resto, al visitarlos (ISR) con los `.gz` en la función.
- Workflows: `pruebas.yml` (ruff + pytest; tsc + ESLint + Prettier + build + Playwright), `safaris.yml`
  (semanal), `safaris_mundo.yml` (diario, incremental con caché), `recientes.yml` (dos veces al día),
  `revision.yml` (mensual: incidencia si algún dato escrito a mano tiene más de un año).
  Los datos no van en git: se suben a la release `datos` (`.github/scripts/publicar_release.sh`, que no publica
  si nada cambió) y solo se hace commit de `public/datos/version.json`, que redespliega Vercel. El prebuild los
  descarga comprimidos a `datos/*.gz` (fuera de `public/`), solo de la release de este repo. En `public/datos` solo va `safaris_indice.json`. Vercel guarda 30 días de despliegues: cuidado con
  su tamaño y número.

## Probar
- `make check` (ruff, pytest sin red con respuestas reales en `tests/fixtures`, tsc, ESLint, Prettier).
- `npm run build && npx playwright test` (móvil y escritorio, capturas en `capturas/`).
- En el contenedor de Claude Code la salida va por proxy: Playwright sirve en la IP de la máquina (ver
  `playwright.config.ts`); Python necesita `REQUESTS_CA_BUNDLE=/root/.ccr/ca-bundle.crt`. Desde el contenedor
  GBIF, Overpass y Commons limitan mucho: el cálculo real corre en Actions.

## Convenciones
- Python 3.12; código, comentarios y textos de la web en español. ruff y Prettier deciden el formato.
- Secretos solo por variables de entorno (opcionales: `GBIF_USUARIO`, `GBIF_CLAVE`, `EBIRD_CLAVE`); nunca en código ni
  commits.
- JSON publicados sin NaN (`safari.comun.ficheros.escribir_json`).
- Respetar límites: caché en `cache/` (no cambiar el formato de `CacheJson`), ≤ 1 petición/s a iNaturalist,
  `Retry-After`, espejos de Overpass, User-Agent descriptivo.
- Ética: nunca ubicaciones exactas ni recientes de especies amenazadas (rinocerontes): las observaciones de
  lince, oso o rinoceronte ya llegan generalizadas y la web solo muestra zonas.
- `git pull` antes de push: Actions hace commits de `public/datos/version.json`.
- Independiente de Rasante (decisión del usuario, 04-11-2026): no se leen datos, código ni enlaces de su repo ni
  de su web; lo que haga falta se calcula aquí.
