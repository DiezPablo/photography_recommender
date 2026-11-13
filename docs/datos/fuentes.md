# Fuentes de datos: licencia y atribución

Revisado el 13-11-2026 (spec 002). «Atribución en la web» está comprobada en el código; las licencias que dicen
«comprobado» se han leído en la web de la fuente ese día; el resto están escritas de memoria. La monetización está aparcada (decisión 0017): la columna «uso comercial» es solo para saber qué
habría que revisar ese día.

## Modo Luz
| Fuente | Para qué | Licencia | Uso comercial | Atribución en la web |
|---|---|---|---|---|
| Open-Meteo (previsión, Marine, ERA5, CAMS) | Notas, mareas, climatología | Datos CC BY 4.0; la API gratuita es para uso no comercial | Con plan de pago | Pie y Método ✔ |
| Wikidata | Candidatos a spot | CC0 | Sí | Pie y Método ✔ |
| OpenStreetMap | Miradores, cumbres; mapa base | ODbL | Sí, con atribución y compartir-igual de la base derivada | Mapa, pie y Método ✔ |
| Wikimedia Commons | Fotos y popularidad | La de cada foto (CC BY, CC BY-SA, dominio público) | Según la foto | Autor y licencia en cada foto ✔ |
| Atlas de D. Lorenz 2025 (VIIRS) | Contaminación lumínica | Su web no publica licencia ni condiciones (comprobado el 13-11-2026); solo pide no confundir sus mapas con la escala de Bortle | Pedir permiso al autor | Pie, Método y ficha, siempre como «≈ Bortle» ✔ |
| Terrain Tiles (Mapzen / AWS Open Data) | Horizonte del terreno | Abiertas; la atribución exigida está en `tilezen/joerd/docs/attribution.md` (comprobado el 13-11-2026) | Sí | `/fuentes` y Método, con enlace a esa atribución ✔ |
| NOAA SWPC | Pronóstico Kp (auroras) | Dominio público | Sí | Aviso de aurora, `/fuentes` y Método ✔ |
| IMO (fechas de meteoros), IGN/OAN (eclipses) | Calendario del cielo | Hechos, no protegibles | Sí | No hace falta |
| Fundación Starlight | Reservas y destinos (zonas aproximadas, a mano) | Nombres públicos | Sí | En la ficha ✔ |
| ENAIRE (zonas UAS) | Dron sí/no | Datos públicos **(confirmar condiciones de reutilización)** | Dudoso | Enlace en el bloque de dron ✔ |
| Agencia Europea de Medio Ambiente (CDDA, Natura 2000) | Dron; espacios protegidos | CC BY 4.0, uso comercial incluido, citando a la EEA (aviso legal, comprobado el 13-11-2026) | Sí | Bloque de dron y `/fuentes` ✔ |
| Iowa Environmental Mesonet (METAR) | Marcador de aciertos y validación | Dominio público | Sí | `/fuentes` y Método ✔ |
| IGN/CNIG (provincias), Natural Earth (países vecinos) | Territorio | CC BY 4.0; dominio público | Sí | `/fuentes` y Método ✔ |
| EUMETSAT (GeoColour) | Capa «Nubes ahora» | Libre con atribución | Sí | En el mapa ✔ |

## Modo Fauna
| Fuente | Para qué | Licencia | Uso comercial | Atribución en la web |
|---|---|---|---|---|
| GBIF (descarga SQL por cuadrícula) | Frecuencia por especie y mes | La de cada conjunto (CC0, CC BY, CC BY-NC); la descarga tiene DOI que hay que citar | Solo los conjuntos sin NC | Pie, carta y ficha de especie ✔ |
| EOD – eBird Observation Dataset (vía GBIF) | Frecuencia de detección de aves | CC BY 4.0 (comprobado el 08-11-2026) | Sí, con cita | `CitaEbird` con DOI ✔ |
| API de eBird 2.0 | Recientes, rarezas, puntos de observación | Condiciones de uso de eBird: no comercial, con atribución | **No** | Pie, rarezas y ficha de lugar ✔ |
| iNaturalist | Recientes de mamíferos, reptiles y anfibios; actividad por hora | La de cada observación (CC0, CC BY, CC BY-NC) | Solo las que no son NC | Ficha de lugar y «de dónde salen los datos» ✔ |
| Wikidata | Espacios protegidos | CC0 | Sí | Pie ✔ |
| Natura 2000 (EEA) | Contornos y cuadrículas de los espacios | CC BY 4.0 (aviso legal de la EEA) | Sí | Carta (cuadrícula), ficha de lugar (contorno) y `/fuentes` ✔ |
| OpenStreetMap | Observatorios | ODbL | Sí | Mapa y pie ✔ |
| IGN (MTN) | Mapa de la carta | CC BY 4.0 | Sí | En el mapa ✔ |
| Hides, fenómenos, normas | Escritos a mano con sus fuentes | Propio | Sí | Enlaces en cada ficha ✔ |

## Qué falta
1. Confirmar las condiciones de reutilización de las zonas UAS de ENAIRE.
2. Si algún día hay uso comercial: permiso de D. Lorenz, plan de pago de Open-Meteo y sustituir la API de eBird.

Resuelto con la spec 020 (13-11-2026): página `/fuentes` para los dos modos, crédito de la EEA en los contornos
Natura 2000 y Mesonet, NOAA SWPC, IGN y Natural Earth citados.
