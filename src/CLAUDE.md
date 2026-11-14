# src/ — web (Next.js 16, App Router)

- `app/`: rutas finas; la lógica va en `features/`.
  - `/` portada (dos puertas, provisional hasta la spec 012). `/fuentes`: fuentes y licencias de los dos modos
    (la lista está en `lib/fuentes.ts`; al añadir una fuente, añádela ahí y en `docs/datos/fuentes.md`).
  - `/luz/**`: ranking del día (`/luz`, `/luz/dia/[d]/[tipo]`), `/luz/spot/[id]`, `/luz/calendario`,
    `/luz/habitual/[mes]/[tipo]` (sin previsión: climatología × idoneidad, spec 013), `/luz/evento/[id]`,
    `/luz/alertas` (.ics), `/luz/metodo`.
  - `/fauna/**`: carta por cuadrícula (`/fauna`; `?modo=aqui|finde`), `/fauna/lugar/[id]`,
    `/fauna/especie/[clave]`, `/fauna/hides`, `/fauna/rarezas`, `/fauna/normas` y sus rutas JSON.
  - `/espana/*` redirige a `/fauna/*`, y las URLs de los safaris retirados (decisión 0021), a la portada
    (`next.config.ts`).
- `features/<área>/`: componentes, modelo y `datos.ts` (solo servidor, con `server-only`). Luz: `spots`,
  `eventos`, `clima`, `dron`, `alertas`, `verificacion`. Fauna: `fauna`, `carta`.
- `ui/`: componentes comunes; `Navegacion.tsx` (modos y menús), `ui/mapa/useMapaBase.ts` para Leaflet.
- `lib/`: `datos.ts` (`leerDatos`, lee `datos/*.gz`), `almacen.ts` (estado del navegador con
  `useSyncExternalStore`), `sol.ts`, `luna.ts`, `sitio.ts` (URL pública: `NEXT_PUBLIC_SITIO`).
- `estilos/`: CSS por áreas; tokens en `01-tokens.css`; `12-diseno.css` y `13-carta.css` mandan sobre 01-11.

Datos: `npm run build` los descarga antes (prebuild) a `datos/*.gz`, fuera de `public/`. Solo lo que pide el
navegador va a `public/datos`. `SIN_DESCARGA=1` usa la salida local del pipeline.

Generación: casi todo en el build. Fichas de spot fuera del top 60 del día y lugares y especies de fauna van
por ISR con sus `.gz` en la función (`outputFileTracingIncludes` en
`next.config.ts`). Vercel: 1 GB por build y 30 días de despliegues (decisión 0002): vigila tamaño y número.

Pruebas visibles con Playwright (móvil y escritorio, capturas en `capturas/`); en el contenedor sirve en la IP
de la máquina (ver `playwright.config.ts`).
