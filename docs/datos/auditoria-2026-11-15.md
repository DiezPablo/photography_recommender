# Auditoría de la base de datos de lugares (2026-11-15)

Sobre `lugares.json` generado el 2026-11-15T18:08:17+00:00: **1500 spots de luz** y **21249 lugares de fauna**. La escribe `python -m rasante auditar`; no corrige nada.

## Lo que hay que mirar
- Spots por provincia: de 5 a 108 (mediana 20). 1 provincias con menos de 15 y 0 sin ninguno.
- Provincias sin ningún espacio, humedal u observatorio de fauna: ninguna.
- Posibles duplicados: 0 pares de spots a menos de 400 m; 3 pares de lugares de fauna con el mismo nombre a menos de 2 km; 3 pares de espacios u observatorios a menos de 100 m.
- Nombres dudosos (genéricos, muy cortos o solo un código): 9.

## Tipos
- **luz**: mirador 528, costa 386, cumbre 261, agua 163, faro 93, cascada 56, canon 13
- **fauna**: punto_de_observacion 18465, espacio_protegido 2500, observatorio 266, humedal 18

## Campos sin dato
| Catálogo | Campo | Lugares |
|---|---|---|
| luz | sin foto | 376 (25 %) |
| luz | foto sin autor o sin licencia | 0 (0 %) |
| luz | sin perfil del horizonte | 0 (0 %) |
| luz | sin brillo del cielo | 0 (0 %) |
| luz | tipo «otro» | 0 (0 %) |
| luz | sin aparcamiento | 454 (30 %) |
| luz | sin lugares de fauna cerca | 1 (0 %) |
| luz | cielo urbano (Bortle ≥ 7) | 439 (29 %) |
| fauna | sin foto | 21249 (100 %) |
| fauna | sin cuadrículas | 0 (0 %) |
| fauna | puntos de eBird sin recuento de especies | 0 (0 %) |
| fauna | puntos de eBird con menos de 20 especies | 0 (0 %) |
| fauna | sin aparcamiento | 10548 (50 %) |
| fauna | sin spots de luz cerca | 6290 (30 %) |

## Fuentes y licencias de los lugares
| Fuente | Licencia | Lugares |
|---|---|---|
| eBird | Condiciones de uso de eBird (no comercial) | 18465 |
| Wikidata | CC0 | 3143 |
| Natura 2000 | Agencia Europea de Medio Ambiente (reutilización con atribución) | 1826 |
| Wikimedia Commons | la de cada foto | 1124 |
| OpenStreetMap | ODbL | 915 |

## Cobertura por provincia
Sitios de fauna = espacios protegidos, humedales y observatorios (sin los puntos de eBird).

| Provincia | Comunidad | Spots de luz | Sitios de fauna | Puntos de eBird |
|---|---|---|---|---|
| Melilla | Melilla | 5 ⚠ | 3 | 5 |
| Ceuta | Ceuta | 17 | 3 | 21 |
| Albacete | Castilla-La Mancha | 20 | 18 | 112 |
| Araba/Álava | País Vasco | 20 | 34 | 129 |
| Badajoz | Extremadura | 20 | 89 | 707 |
| Bizkaia/Vizcaya | País Vasco | 20 | 16 | 182 |
| Burgos | Castilla y León | 20 | 42 | 617 |
| Cantabria | Cantabria | 20 | 39 | 290 |
| Ciudad Real | Castilla-La Mancha | 20 | 36 | 383 |
| Cuenca | Castilla-La Mancha | 20 | 30 | 315 |
| Córdoba | Andalucía | 20 | 27 | 178 |
| Guadalajara | Castilla-La Mancha | 20 | 39 | 188 |
| Huelva | Andalucía | 20 | 55 | 196 |
| Jaén | Andalucía | 20 | 27 | 171 |
| La Rioja | La Rioja | 20 | 15 | 184 |
| León | Castilla y León | 20 | 34 | 580 |
| Lugo | Galicia | 20 | 32 | 236 |
| Murcia | Región de Murcia | 20 | 84 | 142 |
| Navarra | Comunidad Foral de Navarra | 20 | 94 | 541 |
| Ourense | Galicia | 20 | 24 | 186 |
| Palencia | Castilla y León | 20 | 17 | 256 |
| Sevilla | Andalucía | 20 | 28 | 199 |
| Soria | Castilla y León | 20 | 31 | 724 |
| Toledo | Castilla-La Mancha | 20 | 22 | 441 |
| Valladolid | Castilla y León | 20 | 22 | 360 |
| València/Valencia | Comunitat Valenciana | 20 | 93 | 335 |
| Zamora | Castilla y León | 20 | 32 | 553 |
| Zaragoza | Aragón | 20 | 85 | 310 |
| Ávila | Castilla y León | 20 | 26 | 550 |
| Cáceres | Extremadura | 21 | 94 | 1264 |
| Huesca | Aragón | 21 | 90 | 588 |
| Lleida | Cataluña | 21 | 76 | 464 |
| Teruel | Aragón | 21 | 61 | 207 |
| Gipuzkoa/Guipúzcoa | País Vasco | 23 | 27 | 116 |
| Segovia | Castilla y León | 23 | 31 | 188 |
| Castelló/Castellón | Comunitat Valenciana | 24 | 59 | 198 |
| Salamanca | Castilla y León | 24 | 28 | 541 |
| Tarragona | Cataluña | 24 | 46 | 309 |
| Alacant/Alicante | Comunitat Valenciana | 26 | 80 | 388 |
| Madrid | Comunidad de Madrid | 27 | 46 | 761 |
| Granada | Andalucía | 28 | 25 | 205 |
| Cádiz | Andalucía | 31 | 77 | 557 |
| Almería | Andalucía | 32 | 53 | 188 |
| Málaga | Andalucía | 33 | 63 | 325 |
| Asturias | Principado de Asturias | 48 | 163 | 477 |
| Pontevedra | Galicia | 48 | 39 | 468 |
| A Coruña | Galicia | 52 | 34 | 497 |
| Barcelona | Cataluña | 61 | 57 | 548 |
| Girona | Cataluña | 67 | 54 | 353 |
| Las Palmas | Canarias | 78 | 121 | 236 |
| Illes Balears | Illes Balears | 97 | 190 | 355 |
| Santa Cruz de Tenerife | Canarias | 108 | 173 | 141 |

## Posibles duplicados

### Spots a menos de 400 m: 0

### Lugares de fauna con el mismo nombre a menos de 2 km: 3
- Sierra de la Pila (`n2k-ES0000174`) ↔ Sierra de la Pila (`n2k-ES6200003`): 889 m, Murcia
- Galachos de la Alfranca de Pastriz, La Cartuja y El Burgo de Ebro (`n2k-ES0000138`) ↔ "Galachos de la Alfranca de Pastriz, La Cartuja y El Burgo de Ebro" (`wd-Q128436568`): 1239 m, Zaragoza
- Teno (`n2k-ES0000106`) ↔ Teno (`n2k-ES7020096`): 1557 m, Santa Cruz de Tenerife

### Espacios u observatorios de fauna a menos de 100 m: 3
- Observatori del Senillar (`osm-node-1762583846`) ↔ Marjal del moro (`wd-Q9029267`): 28 m, València/Valencia
- Islote de San Andrés (`n2k-ES6110020`) ↔ Isla de San Andrés (`wd-Q108095852`): 69 m, Almería
- Observatori del Senillar (`osm-node-1762583846`) ↔ Marjal dels Moros (`wd-Q128436632`): 89 m, València/Valencia

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
