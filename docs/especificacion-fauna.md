# Especificación: planificador de fauna (España y safaris)

Redactada por el usuario el 03-11-2026 y revisada contra lo que ya hace esta app (la de fauna, separada de
Rasante el 26-10-2026). Lo marcado como **decisión** sustituye al texto original.

## 1. Objetivo

Dado un lugar y unas fechas, responder:

1. Qué especies son probables y con qué confianza.
2. Cuándo conviene ir (mes, semana si los datos lo aguantan, franja horaria).
3. Con qué luz y tiempo (amanecer, atardecer, horas dorada y azul, nubes por capas, viento, lluvia).

**Decisión:** la web es pública (con mapa del sitio y páginas para buscadores) y gratuita, sin comisiones ni IA.
«Fuera de alcance: reservas y precios» se entiende como «no reservamos ni cobramos»: los alojamientos de OSM, los
operadores, el presupuesto y la temporada verde se quedan.

## 2. Modos

### 2.1 Fauna en España (nuevo)
- «Cerca de mí / este fin de semana»: punto, radio y fechas → especies probables, avistamientos recientes, luz y
  previsión.
- «Dónde y cuándo ver X»: especie → ranking de zonas y meses.
- Resolución: cuadrícula europea de referencia de 10 km (EEA, ETRS89-LAEA). **Decisión:** granularidad mensual
  suavizada con los meses vecinos (como en los safaris); semanal solo donde la muestra lo aguante (se mide en la
  prueba de viabilidad).

### 2.2 Safaris (hecho en su mayor parte)
- Por destino, por especie, ranking de destinos por mes, 65 destacados curados y ~3400 parques del mundo,
  climatología (NASA POWER), migración y cierres estacionales con fuente.
- Pendiente: calendario de fenómenos unificado (partos, cruces, floraciones, aves migratorias…) y tamaño de muestra
  y confianza visibles.

## 3. Fuentes de datos

| Fuente | Uso | Credencial |
|---|---|---|
| GBIF | Estacionalidad por cuadrícula y mes (descargas SQL agregadas, en Actions) | Cuenta de GBIF: `GBIF_USUARIO`, `GBIF_CLAVE` |
| iNaturalist | Curva estacional, recientes, hora del día (descargando y agrupando en local, solo especies objetivo) | No (≤ 1 petición/s, User-Agent propio) |
| eBird API 2.0 | Aves recientes (30 días) y puntos de observación | `EBIRD_CLAVE`, solo en Actions (y en Vercel si hay consultas en vivo) |
| Open-Meteo | Previsión (16 días, nubes por capas) | No |
| NASA POWER | Climatología mensual (lluvia, temperatura) | No |
| Wikidata | Espacios protegidos (punto y radio) | No. WDPA (polígonos) pediría token: se deja para más adelante |
| Cálculo local | Posición del sol | No |

Las credenciales solo en variables de entorno (`.env.example`); si faltan, el pipeline se salta esa fuente y la
web funciona igual.

**Identificador maestro:** la clave de especie de GBIF. El catálogo de destacados usa hoy taxones de iNaturalist y
se cruzan por nombre científico; unificar es una tarea aparte.

## 4. Principios

- Observaciones ≠ probabilidad: «frecuencia relativa» = observaciones de la especie / observaciones de su grupo en
  ese lugar y mes.
- Siempre el tamaño de muestra y la confianza (alta, media, baja); avisar donde hay pocos datos.
- La hora del día está sesgada por cuándo sale la gente: se suaviza con la actividad de la especie.
- Cada resultado, con su desglose de factores.
- Especies sensibles (lince, oso, águila imperial, urogallo, rinocerontes): solo zonas, nunca posiciones; no se
  desofusca nada.

## 5. Puntuación

**Decisión:** dos notas además de la combinada, para que un día nublado no esconda una especie que sí está:

- **Verla** = frecuencia estacional × presencia reciente × ventana de actividad.
- **Fotografiarla** = calidad de luz × penalización por tiempo.

Cada factor en [0, 1] con suelo (p. ej. presencia reciente `0,5 + 0,5·x`: no haber avistamientos en 30 días es
normal con pocos datos) y pesos configurables; se guardan por separado para el desglose.

## 6. Arquitectura

- Cálculo por lotes en GitHub Actions con caché (`cache/`, `CacheJson`) y ritmo controlado.
- Publicación como ahora: JSON comprimidos en la release `datos`. **Decisión:** troceados por provincia (o por
  cuadrícula) para que el navegador pida solo lo que necesita y la función de Vercel no pase de su límite.
- Atribuciones visibles: GBIF (con el DOI de cada descarga), iNaturalist, eBird, Open-Meteo, NASA POWER.

## 7. Modelo de datos

- `taxon(gbif_key, cientifico, nombre_es, grupo, actividad)`
- `zona(id, tipo, nombre, lat, lon, radio_km | celda_eea, pais)`
- `estacionalidad(zona, gbif_key, mes, frecuencia_relativa, n_muestra)`
- `reciente(zona, gbif_key, fecha, fuente)`
- `evento(zona | null, gbif_key | null, mes_inicio, mes_fin, descripcion, fuente_url)`: calendario curado.

## 8. Fases

1. **Viabilidad en España** (con credenciales): una descarga de GBIF para Doñana, Gredos, Picos de Europa y
   Gallocanta; medir observaciones por cuadrícula y mes.
2. **Especies y estacionalidad en España**: punto + radio + mes → especies ordenadas, curva de 12 meses, muestra
   y confianza. Revisión manual de los cuatro casos.
3. **Luz y tiempo**: sol y franjas por día; previsión de Open-Meteo hasta 16 días y climatología más allá, marcando
   cuál es.
4. **Avistamientos recientes**: eBird (aves) e iNaturalist (resto), con la fecha del último por especie.
5. **Puntuación e interfaz**: ranking con desglose, mejor ventana, «dónde y cuándo ver X». Backtest: años hasta
   N-1 frente al año N; métrica, cuántas especies observadas estaban entre las 20 primeras.
6. **Safaris**: completar calendario de fenómenos y confianza (lo demás está hecho).

## 9. Riesgos

- Sesgo de observador y de espacio (carreteras, lodges, zonas de paso).
- Aves sobrerrepresentadas frente a mamíferos pequeños e invertebrados.
- Cobertura desconocida en sitios poco visitados: medirla antes de prometer.
- Los límites y funciones de las APIs cambian (las descargas SQL de GBIF son experimentales): comprobarlos en la
  documentación oficial.
