# 003 — Núcleo común de "lugar" (versión inicial)

Estado: hecha
Modo: plataforma (Luz y Fauna)
Situación del fotógrafo: —

## Problema
El catálogo es el activo (visión). Rasante tiene dos: spots de luz y lugares de fauna. No se fusionan (decisión
0015), pero resultados, mapa, plan y auditoría (002) necesitan tratarlos igual: mismo identificador, territorio,
fuentes, foto y acceso. Hoy cada uno tiene su forma, heredada del mock (0016).

## Alcance
- Contrato de `lugares.json` (índice de los dos catálogos) y su validador.
- **Fuera de alcance**: páginas; renombrar ficheros de fauna (007); idoneidad (013). El esquema no está
  obligado a conservar ids, nombres de campo ni ficheros del mock.

### Esquema v1 (un objeto por lugar; la referencia es `rasante/recursos/lugar.schema.json`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | texto | Los que ya usan las URLs: `slug-hash` en los spots; `eb-…`, `wd-…`, `osm-…`, `n2k-…` en fauna |
| `catalogo` | `luz` \| `fauna` | Exactamente uno. Un mismo sitio físico puede estar en los dos como dos lugares |
| `nombre`, `lat`, `lon` | | Coordenadas con 5 decimales |
| `provincia`, `ccaa` | | Nombre de la provincia y `ccaa_de` (0007); lo que cae en un país vecino o mar adentro no entra |
| `tipo` | enumerado | Luz: mirador, cumbre, costa, faro, cascada, agua, bosque, canon, urbano. Fauna: humedal, observatorio, espacio_protegido, punto_de_observacion. Común: otro |
| `fuentes` | lista | `{fuente, ref, licencia}`; mínimo una |
| `foto` | objeto o nulo | `{url, autor, licencia}` (la primera de la galería de Commons) |
| `acceso` | objeto | `{aparcamiento_m, accesible}`; nulos hoy (no hay dato) |
| `cerca` | lista de ids | Hasta 5 lugares del **otro** catálogo a ≤ 15 km, por distancia |
| `luz` | solo si `catalogo: luz` | `{cielo_mag, bortle, horizonte: altura del relieve hacia 8 rumbos, costa, popularidad}`; `idoneidad` (spec 013) |
| `fauna` | solo si `catalogo: fauna` | `{celdas: [EEA 10 km], radio_km, espacio: {nombre, figura}, natura, especies_ebird}`. Las especies salen de la cuadrícula, no van aquí |
| `eventos` | lista de ids | Eventos de `eventos_naturaleza.csv` cuyo radio incluye el lugar: los de fauna en fauna, el resto en luz (014 lo afina) |
| `revisado` | fecha o nulo | Solo en datos escritos a mano (ninguno todavía) |

Ningún campo sitúa una especie sensible (0011). Es un índice: previsión, especies y galería van en sus ficheros.
Los hides siguen en `src/features/fauna/hides.ts`; entrarán al pasar al pipeline (014).

## Criterios de aceptación
- [x] `rasante/recursos/lugar.schema.json` (JSON Schema) describe la tabla; `luz` y `fauna` son excluyentes
      según `catalogo`.
- [x] `python -m rasante lugares` genera `lugares.json` con los spots y los lugares de fauna publicados, lo valida y
      falla si a un lugar le falta fuente con licencia, provincia o `catalogo`.
      Los 81 lugares de fauna en un país vecino o mar adentro se descartan y se cuentan.
- [x] Test sin red: salida válida contra el esquema; `cerca` solo contiene ids del otro catálogo y a ≤ 15 km;
      ids únicos; sin NaN.
- [x] La orden imprime un resumen (lugares por catálogo, tipo y comunidad) que sirve a 002.
- [x] El diff no toca `src/`. Tamaño (13-11-2026, datos publicados): 22 965 lugares (1500 de luz, 21 465 de fauna),
      13,9 MB sin comprimir, 1,8 MB comprimido; 11 s de cálculo.

## Datos
Sin fuentes nuevas. Licencias: Wikidata CC0, OSM ODbL, Commons por fichero, GBIF por conjunto. Vercel: 0 MB
(ninguna función lo lee todavía); +1 fichero en la release.

## Diseño
No hay interfaz.

## Notas de implementación
Nuevo `rasante/lugares/` (lectura, validación, `cerca`, CLI) y entrada en `__main__.py`. Entradas:
`spots.geojson` (Luz) y `espana_lugares.json` + `espana_natura.json` (Fauna: puntos de eBird, espacios
protegidos y observatorios). Paso en `luz_datos.yml` o en `espana_recientes.yml`, el que publique último.
