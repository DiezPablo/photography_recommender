# Auditoría de la base de datos de lugares (2026-11-13)

Sobre `lugares.json` generado el 2026-11-13T07:02:36+00:00: **1500 spots de luz** y **21465 lugares de fauna**. La escribe `python -m rasante auditar`; no corrige nada.

## Lo que hay que mirar
- Spots por provincia: de 4 a 133 (mediana 12). 30 provincias con menos de 15 y 0 sin ninguno.
- Provincias sin ningún espacio, humedal u observatorio de fauna: ninguna.
- Posibles duplicados: 0 pares de spots a menos de 400 m; 48 pares de lugares de fauna con el mismo nombre a menos de 2 km; 41 pares de espacios u observatorios a menos de 100 m.
- Nombres dudosos (genéricos, muy cortos o solo un código): 9.

## Tipos
- **luz**: mirador 610, costa 451, cumbre 218, faro 102, agua 76, cascada 33, canon 10
- **fauna**: punto_de_observacion 18517, espacio_protegido 2531, observatorio 407, humedal 10

## Campos sin dato
| Catálogo | Campo | Lugares |
|---|---|---|
| luz | sin foto | 292 (19 %) |
| luz | foto sin autor o sin licencia | 0 (0 %) |
| luz | sin perfil del horizonte | 0 (0 %) |
| luz | sin brillo del cielo | 0 (0 %) |
| luz | tipo «otro» | 0 (0 %) |
| luz | sin aparcamiento | 1500 (100 %) |
| luz | sin lugares de fauna cerca | 0 (0 %) |
| luz | cielo urbano (Bortle ≥ 7) | 480 (32 %) |
| fauna | sin foto | 21465 (100 %) |
| fauna | sin cuadrículas | 0 (0 %) |
| fauna | puntos de eBird sin recuento de especies | 0 (0 %) |
| fauna | puntos de eBird con menos de 20 especies | 0 (0 %) |
| fauna | sin aparcamiento | 21465 (100 %) |
| fauna | sin spots de luz cerca | 7681 (36 %) |

## Fuentes y licencias de los lugares
| Fuente | Licencia | Lugares |
|---|---|---|
| eBird | Condiciones de uso de eBird (no comercial) | 18517 |
| Wikidata | CC0 | 3043 |
| Natura 2000 | Agencia Europea de Medio Ambiente (reutilización con atribución) | 1794 |
| Wikimedia Commons | la de cada foto | 1208 |
| OpenStreetMap | ODbL | 1143 |

## Cobertura por provincia
Sitios de fauna = espacios protegidos, humedales y observatorios (sin los puntos de eBird).

| Provincia | Comunidad | Spots de luz | Sitios de fauna | Puntos de eBird |
|---|---|---|---|---|
| Melilla | Melilla | 4 ⚠ | 3 | 5 |
| Albacete | Castilla-La Mancha | 12 ⚠ | 17 | 113 |
| Araba/Álava | País Vasco | 12 ⚠ | 34 | 129 |
| Badajoz | Extremadura | 12 ⚠ | 89 | 709 |
| Burgos | Castilla y León | 12 ⚠ | 42 | 617 |
| Ceuta | Ceuta | 12 ⚠ | 3 | 21 |
| Ciudad Real | Castilla-La Mancha | 12 ⚠ | 35 | 384 |
| Cuenca | Castilla-La Mancha | 12 ⚠ | 28 | 317 |
| Cáceres | Extremadura | 12 ⚠ | 97 | 1265 |
| Córdoba | Andalucía | 12 ⚠ | 29 | 179 |
| Huelva | Andalucía | 12 ⚠ | 55 | 198 |
| Jaén | Andalucía | 12 ⚠ | 28 | 172 |
| La Rioja | La Rioja | 12 ⚠ | 15 | 184 |
| León | Castilla y León | 12 ⚠ | 35 | 580 |
| Murcia | Región de Murcia | 12 ⚠ | 85 | 146 |
| Ourense | Galicia | 12 ⚠ | 24 | 188 |
| Palencia | Castilla y León | 12 ⚠ | 18 | 256 |
| Salamanca | Castilla y León | 12 ⚠ | 28 | 541 |
| Segovia | Castilla y León | 12 ⚠ | 32 | 188 |
| Sevilla | Andalucía | 12 ⚠ | 29 | 199 |
| Soria | Castilla y León | 12 ⚠ | 31 | 723 |
| Teruel | Aragón | 12 ⚠ | 61 | 208 |
| Toledo | Castilla-La Mancha | 12 ⚠ | 21 | 442 |
| Valladolid | Castilla y León | 12 ⚠ | 22 | 360 |
| València/Valencia | Comunitat Valenciana | 12 ⚠ | 92 | 336 |
| Zamora | Castilla y León | 12 ⚠ | 32 | 553 |
| Zaragoza | Aragón | 12 ⚠ | 86 | 310 |
| Ávila | Castilla y León | 12 ⚠ | 26 | 550 |
| Guadalajara | Castilla-La Mancha | 13 ⚠ | 39 | 188 |
| Navarra | Comunidad Foral de Navarra | 13 ⚠ | 95 | 541 |
| Bizkaia/Vizcaya | País Vasco | 21 | 21 | 181 |
| Granada | Andalucía | 24 | 27 | 206 |
| Lugo | Galicia | 24 | 38 | 236 |
| Cantabria | Cantabria | 26 | 50 | 290 |
| Madrid | Comunidad de Madrid | 26 | 45 | 763 |
| Castelló/Castellón | Comunitat Valenciana | 28 | 62 | 198 |
| Gipuzkoa/Guipúzcoa | País Vasco | 29 | 29 | 118 |
| Huesca | Aragón | 32 | 96 | 589 |
| Tarragona | Cataluña | 33 | 65 | 309 |
| Alacant/Alicante | Comunitat Valenciana | 37 | 78 | 391 |
| Lleida | Cataluña | 43 | 92 | 466 |
| Almería | Andalucía | 44 | 53 | 189 |
| Cádiz | Andalucía | 44 | 77 | 560 |
| Málaga | Andalucía | 46 | 67 | 324 |
| Asturias | Principado de Asturias | 60 | 170 | 478 |
| A Coruña | Galicia | 61 | 49 | 498 |
| Pontevedra | Galicia | 63 | 43 | 469 |
| Barcelona | Cataluña | 73 | 79 | 548 |
| Girona | Cataluña | 86 | 77 | 353 |
| Las Palmas | Canarias | 88 | 121 | 243 |
| Illes Balears | Illes Balears | 125 | 204 | 363 |
| Santa Cruz de Tenerife | Canarias | 133 | 174 | 143 |

## Posibles duplicados

### Spots a menos de 400 m: 0

### Lugares de fauna con el mismo nombre a menos de 2 km: 48
- Complexo Ons - O Grove (`wd-Q128441035`) ↔ Complexo Ons-O Grove (`wd-Q97217889`): 0 m, Pontevedra
- Betanzos-Mandeo (`wd-Q12392206`) ↔ Betanzos - Mandeo (`wd-Q128440800`): 0 m, A Coruña
- Ría de Foz - Masma (`wd-Q128440916`) ↔ Ria de Foz - Masma (`wd-Q97220302`): 0 m, Lugo
- Sistema fluvial Ulla - Deza (`wd-Q128441013`) ↔ Sistema fluvial Ulla-Deza (`wd-Q97218965`): 0 m, A Coruña
- La Victòria (`eb-L4527329`) ↔ La Victòria (`n2k-ES0000079`): 67 m, Illes Balears
- Estanys de Basturs (`eb-L6221971`) ↔ Estanys de Basturs (`n2k-ES5130030`): 108 m, Lleida
- Illa de l'Aire (`eb-L5979108`) ↔ Illa de l'Aire (`n2k-ES0000236`): 114 m, Illes Balears
- Albufera de Adra (`eb-L7127873`) ↔ Albufera de Adra (`n2k-ES6110001`): 116 m, Almería
- Cabo Vilán (`eb-L5142064`) ↔ Cabo Vilan (`wd-Q108066194`): 119 m, A Coruña
- Laguna de Los Tollos (`eb-L3504173`) ↔ Laguna de Los Tollos (`n2k-ES6120011`): 134 m, Cádiz
- Laguna de Salinas (`eb-L6261597`) ↔ Laguna de Salinas (`n2k-ES5212006`): 137 m, Alacant/Alicante
- Cabezo Gordo (`eb-L10435333`) ↔ Cabezo Gordo (`n2k-ES6200013`): 180 m, Murcia
- … y 36 más

### Espacios u observatorios de fauna a menos de 100 m: 41
- Río Eo (`wd-Q128440853`) ↔ Zona especial de conservación do Río Eo (`wd-Q97220495`): 0 m, Lugo
- Zona de Importancia Comunitaria de Sierra de Castril (`wd-Q108063737`) ↔ Parque natural de la Sierra de Castril (`wd-Q2284501`): 0 m, Granada
- Zona de Importancia Comunitaria Sierra Nevada (`wd-Q108063786`) ↔ Reserva de la Biosfera de Sierra Nevada (`wd-Q108516215`): 0 m, Granada
- Zona de Importancia Comunitaria Sierra Nevada (`wd-Q108063786`) ↔ Parque nacional y natural de Sierra Nevada (`wd-Q1969050`): 0 m, Granada
- Reserva de la Biosfera de Sierra Nevada (`wd-Q108516215`) ↔ Parque nacional y natural de Sierra Nevada (`wd-Q1969050`): 0 m, Granada
- "Sierras de Tejeda, Almijara y Alhama" (`wd-Q108063887`) ↔ Parque natural de las Sierras de Tejeda, Almijara y Alhama (`wd-Q3364597`): 0 m, Málaga
- Zona de Importancia Comunitaria Sierra de las Nieves (`wd-Q108063970`) ↔ Parque nacional de la Sierra de las Nieves (`wd-Q1420336`): 0 m, Málaga
- Zona de Importancia Comunitaria Despeñaperros (`wd-Q108065876`) ↔ Parque natural de Despeñaperros (`wd-Q1200615`): 0 m, Jaén
- Zona de Importancia Comunitaria Sierras de Andújar (`wd-Q108065380`) ↔ Parque natural de la Sierra de Andújar (`wd-Q380080`): 0 m, Jaén
- Sierra de Cardeña y Montoro (`wd-Q108065998`) ↔ Parque natural de la Sierra de Cardeña y Montoro (`wd-Q2284498`): 0 m, Córdoba
- Los Reales de Sierra Bermeja (`wd-Q108066039`) ↔ Paraje natural de Los Reales de Sierra Bermeja (`wd-Q5980284`): 0 m, Málaga
- Complexo Ons - O Grove (`wd-Q128441035`) ↔ Complexo Ons-O Grove (`wd-Q97217889`): 0 m, Pontevedra
- … y 29 más

## Nombres dudosos: 9
- «Bel» (`eb-L11859221`, fauna, Castelló/Castellón)
- «Jou» (`eb-L12003302`, fauna, Lleida)
- «Oiz» (`eb-L3150475`, fauna, Bizkaia/Vizcaya)
- «Oto» (`eb-L34522643`, fauna, Huesca)
- «Adi» (`eb-L6124778`, fauna, Navarra)
- «Bea» (`eb-L7286250`, fauna, Teruel)
- «Observatorio» (`osm-node-13087025101`, fauna, Zaragoza)
- «Observatorio» (`osm-node-526311466`, fauna, Cádiz)
- «Mirador» (`osm-node-7110758644`, fauna, Teruel)
