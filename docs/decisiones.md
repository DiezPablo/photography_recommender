# Decisiones y problemas

Lo que se decide o se descubre. Las primeras entradas vienen de Rasante (photo_recommender), donde nació el
proyecto; las rutas de código citadas allí (`rasante/safaris/…`, `/safaris/…`) son hoy `safari/…` y `/…`.

## 2026-10-25 · Safaris por el mundo

- Petición del usuario (aficionado a los safaris): un sitio centralizado con parques de todo el mundo,
  especies, tarifas, rutas, organizadores, alojamientos, reseñas, precios y consejos, que cambie según lo que
  mejor se ve. Se pausa la revisión de mejoras gratuitas (anotada en `hoja-de-ruta.md`).
- **Qué se puede hacer gratis y sin IA, y qué no**:
  - Sí: catálogo curado (65 parques en `recursos/safaris.csv`: país, coordenadas de la zona de safari, radio,
    tipos de safari, mejores meses, especies estrella, tasa cuando es conocida con su año, consejo), Wikidata
    (foto, web oficial, Wikipedia), iNaturalist (especies, observaciones por mes y **lo visto en los últimos 30
    días**, con fotos Creative Commons y nombres en español), ERA5 (lluvia y temperatura por mes) y
    OpenStreetMap (lodges, campamentos y hoteles con web y teléfono).
  - No: reservas, precios de lodges y reseñas propias. No hay APIs abiertas de precios ni de reseñas
    (TripAdvisor o Google no permiten reutilizarlas) y gestionar reservas exige un backend, contratos y
    pagos, fuera de un proyecto personal sin servidor. Se enlaza a las webs oficiales y de cada lodge para
    reservar directamente (sin comisiones) y a Google Maps para las reseñas. La guía explica cómo elegir
    operador (licencia, asociaciones KATO/TATO/AUTO/SATSA, qué pedir por escrito).
- «Que cambie según lo que mejor se ve»: el orden de los parques pone primero los que están en temporada en el
  mes elegido y, dentro de ellos, los que más especies estrella han tenido en iNaturalist en los últimos 30
  días (`safaris_recientes.json`, en cada ejecución de *Datos*). La ficha pide además a iNaturalist en directo
  desde el navegador (su API admite CORS) y, si falla, enseña la última copia.
- Meses de mamíferos: observaciones brutas por mes. Dividir entre todas las observaciones (como en la fauna
  de España) daba el invierno como mejor época en Yellowstone solo porque en invierno no hay flores ni
  insectos que fotografiar.
- iNaturalist usa sinónimos (Bison bison es Bos bison): se acepta el `matched_term`. Las subespecies cuentan
  para su especie (`ancestor_ids`). Peticiones a ≤ 1 por segundo, como pide iNaturalist.
- Clima: dos años de ERA5 por parque (~52 llamadas a Open-Meteo cada uno) con pausa entre parques. Desde el
  contenedor Open-Meteo devuelve 429 por el límite horario: se prueba con `--sin-clima` y el clima se calcula
  en Actions.
- OSM: fuera los códigos de acampada de travesía de los parques de EE. UU. («4R1 - Ribbon Lake West»).
- Web: `/safaris` (mejor ahora, buscador por mes, continente, especie y tipo, mapa mundial), `/safaris/[id]`,
  `/safaris/especie` y `/safaris/especie/[slug]`, `/safaris/guia`. «Safaris» en la cabecera y en la barra
  inferior del móvil.

## 2026-10-25 · Safaris: todos los parques del mundo e información práctica real

- El usuario: 65 parques son pocos para todo el mundo, y la guía era genérica, sin información real de cada
  parque. Se hace un descubrimiento completo, caro la primera vez y luego incremental con caché.
- **Candidatos (Wikidata, ~9250)**: parques nacionales y sus subclases (3456), reservas de caza, refugios y
  reservas de fauna, áreas de gestión de fauna, áreas de conservación, reservas de la biosfera y, si miden
  ≥ 100 km², «área protegida» y «reserva natural» genéricas (ahí están las conservancies de Kenia, Ol Pejeta,
  Lewa…; sin el umbral entrarían 57 000 reservas pequeñas). La WDPA (Protected Planet) tiene más, pero su
  descarga exige cuenta y aceptar condiciones: se enlaza su ficha (P809) en lugar de usarla.
- **Cribado (GBIF, una petición por candidato)**: mamíferos observados desde 2010 en el círculo de la superficie
  del parque (4-80 km). Entra con ≥ 10 especies y ≥ 50 observaciones. La misma respuesta da las especies y los
  meses. Se usa GBIF y no iNaturalist porque iNaturalist pide no pasar de ~10 000 peticiones al día.
- **Información práctica de cada parque** (la «información real» que faltaba):
  - Cómo llegar: aeropuerto con vuelos regulares más cercano y gran aeropuerto internacional más cercano
    (OurAirports, dominio público), y pistas de aterrizaje en el parque (safari en avioneta).
  - OpenStreetMap: alojamientos con web/teléfono/correo, operadores y agencias de la zona, puertas de entrada
    con enlace para llegar, y pueblos cercanos. Overpass es lento: por tandas (`--osm-max`), de los más
    importantes a los menos, con la caché guardada entre ejecuciones del workflow `safaris.yml` (semanal).
  - Lluvia mensual de la NASA (POWER, una petición por punto) y meses secos (< 50 mm): en los trópicos, la
    estación seca es la mejor para ver fauna. La temperatura de POWER se descarta: en el Masái Mara daba 34 °C
    de máxima (la real ronda 28 °C).
  - País (Wikidata): moneda e idiomas; visado, salud y seguridad, en Exteriores.
  - Enlaces: web oficial, Protected Planet, Wikipedia, iNaturalist.
- **Web**: el buscador carga `safaris_indice.json` (una fila ligera por parque) y ordena por buena época del mes
  elegido (temporada escrita a mano en los destacados; meses secos en los trópicos), destacados y fauna. Las
  fichas de los 65 destacados y de los 150 parques con más fauna se generan al compilar; el resto, al
  visitarlas (ISR, con `safaris_mundo.json` en la función). Las páginas de especie suman los parques del mundo
  donde GBIF la registra.
- El catálogo curado y el mundial se calculan en `safaris.yml`; los avistamientos de 30 días siguen en *Datos*.
- Primera ejecución en Actions: el cribado de GBIF (consultas con facetas, ~5 s cada una) se comió las 4 h
  del paso (694 fallos por saturación). Se reparte: `--minutos` fija hasta cuándo se hacen peticiones nuevas;
  después solo se lee la caché y se publica lo que haya. `safaris_mundo.yml` corre a diario con la caché
  guardada y en pocos días está completo; luego tarda minutos y solo pide a Overpass una tanda nueva.

## 2026-10-26 · Safaris: empresas, épocas para todos, nombres y tamaño en Vercel

- Empresas para organizarlo: los directorios de las asociaciones (KATO, TATO, SATSA…) están tras inicios de
  sesión o páginas dinámicas, sin datos abiertos. Se combina: operadores y agencias de OSM en la **ciudad del
  aeropuerto de acceso** (Arusha, Nairobi, Kasane…; una consulta por ciudad, compartida) y de la zona del parque,
  solo con alguna forma de contacto; enlace a la asociación oficial del país; y qué pedir por escrito antes de pagar.
- Enlaces rotos: las webs de OSM sin «https://» eran enlaces relativos (se normalizan en el pipeline y en la web);
  la búsqueda de Google Maps con «nombre lat,lon» no encontraba nada (ahora, el nombre centrado en el sitio).
- Época para todos los parques (`practico.epoca`): temporada escrita a mano; en los trópicos, estación seca o,
  en la selva, los 4 meses menos lluviosos; fuera de los trópicos, los meses con más mamíferos observados.
- «Especie 5219461»: los nombres comunes se pedían al final y se quedaban sin tiempo; ahora van justo después
  del cribado y sin límite de tiempo (son peticiones rápidas).
- Del análisis (foros y guías): «Los cinco grandes» por parque, «Combínalo con» (parques cercanos con la época
  en común y horas aproximadas por pista: las distancias engañan) y cifras orientativas de presupuesto,
  avioneta, equipaje y propinas en la guía.
- Vercel avisaba de exceso de almacenamiento: solo se generan al compilar los 65 destacados (los otros 150
  sumaban ~45 MB) y `/viaje` lleva solo los JSON que usa (con `*.json` arrastraba los de safaris).

## 2026-10-26 · Almacenamiento de despliegues en Vercel (30 GB)

- «Deployment storage» suma todos los despliegues que Vercel guarda (30 días en Hobby). Cada commit de
  `version.json` es un despliegue (Datos dos veces al día, clima, safaris, rutas…) y cada uno ocupaba ~650 MB:
  70 MB de JSON estáticos en `public/datos` (el navegador solo pide dos) y cada función ISR con su copia de los
  JSON sin comprimir (~75 MB × 6).
- Cambios:
  - Los datos se descargan comprimidos a `datos/*.gz`, fuera de `public/`; `leerDatos` los descomprime. Solo
    `fauna.json` y `safaris_indice.json` siguen en `public/datos`, más un `resumen.json` para las pruebas (que
    también corren contra producción). Cada función pasa de ~75 MB a ~21 MB.
  - Las 382 fichas de observatorios de fauna y los 150 parques de safari con más fauna se generan al visitarlos
    (ISR) en lugar de en el build. Páginas generadas: de 217 a 139 MB.
  - `publicar_release.sh` no hace commit (ni despliegue) si ningún fichero cambió.
- Despliegue estimado: de ~650 MB a ~270 MB. Además, en Vercel (*Settings → Security → Deployment Retention
  Policy*) conviene bajar la retención al mínimo; se conservan siempre los 3 últimos despliegues de producción.

## 2026-10-26 · Separación de Rasante

- El usuario: Rasante tiene demasiadas cosas; los safaris, tal como están planteados, no los ha visto en ningún
  sitio y pueden ser muy útiles. Se separan en un repositorio y una web propios (DiezPablo/safari_recommender).
- Se trae solo lo que usan los safaris: paquete `safari/` (antes `rasante/safaris` más caché, red, Commons y GBIF),
  web con rutas en la raíz (`/parque/[id]`, `/especies`, `/especie/[slug]`, `/guia`) y los mismos estilos.
- Datos: la release de este repo empieza vacía y la caché de Actions también (el cribado mundial tarda días
  otra vez). Mientras tanto, el prebuild descarga los datos de la release de Rasante.

## 26-10-2026 · «Qué ver y cuándo», comparador y migración

- **Portada por especies y mes.** `/especies.json` (ruta estática generada en el build desde
  `safaris_mundo.json`) da, por especie estrella, sus 80 parques con más observaciones; el navegador lo cruza con
  `safaris_indice.json`. Orden: cuántas de las especies elegidas tiene, luego si el mes es buena época y luego la
  facilidad media (√(obs / obs del mejor parque), para que los parques muy visitados no lo tapen todo). Primero
  van los animales más buscados (lista fija); el resto, en el orden del catálogo.
- **Comparador** (`/comparar?p=…`, dinámico, lee los `.gz` en la función): hasta 4 parques; la lista se guarda
  en el navegador («+ Comparar» en las fichas). Ojo: una constante exportada desde un módulo `"use client"` no es
  un valor en el servidor (es una referencia de cliente); las compartidas van en `modelo.ts`.
- **Nombres de las especies estrella**: `mundo.especies` no siempre las trae; `nombreEstrella` usa el del
  catálogo.
- **Aeropuertos del mismo país**: el Serengeti salía con Mara Serena (Kenia) como aeropuerto más cercano. Ahora
  `llegar` recibe el ISO del país (P297 de Wikidata) y usa los aeropuertos de ese país si hay alguno a menos de
  800 km. Se nota tras la próxima ejecución de `safaris_mundo`.
- **Migración**: calendario mes a mes escrito a mano (`src/features/safaris/migracion.ts`, ciclo de TANAPA y
  Mara Triangle) y ñus de los últimos 30 días pedidos en directo a iNaturalist desde el navegador (CORS
  abierto). Los del cráter del Ngorongoro (residentes) se pintan aparte. No hay datos abiertos de collares GPS
  en tiempo real.

## 26-10-2026 · Primeras ejecuciones en el repo nuevo

- La caché de Actions de Rasante no se comparte con este repo: `safaris_mundo` vuelve a empezar de cero y tarda
  varios días en cubrir los ~3500 parques. Mientras, la web usa los datos de la release de Rasante (fallback de
  `scripts/descargar-datos.mjs`). Para no sustituirlos por un resultado a medias,
  `.github/scripts/no_empeora.py` solo deja publicar si el nuevo `safaris_mundo.json` tiene al menos el 95 % de
  los parques del publicado (este repo o, si aún no hay, Rasante).

## 26-10-2026 · Planificador de ruta

- `/planificar` (en el navegador, estado en la URL): país, días, mes, ritmo (2-4 noches por parque) y especies.
  Elección voraz: interés del parque (log de su puntuación, ×0,6 fuera de época, ×1,15 si es destacado) + 2 ×
  facilidad de cada especie aún no cubierta, dividido por (1 + distancia al circuito / 800 km) para que salgan
  circuitos compactos. Se descartan los parques solapados (< 40 km o uno dentro del otro) y los contenedores
  (reservas de la biosfera que engloban parques), salvo los destacados: el Masái Mara o Kruger contienen
  reservas privadas pequeñas y son el destino.
- Orden por vecino más próximo probando cada inicio; traslados en línea recta ×1,3 a 50 km/h; más de 6 h →
  avioneta o vuelo interno. Avisos: paradas de una noche, demasiada carretera, fuera de época, especies sin cubrir.
- Probado con el índice real: Tanzania 10 días → Tarangire, Ngorongoro, Serengeti; Kenia 7 → Masái Mara y
  Amboseli; Botsuana 9 → Makgadikgadi, Moremi, Chobe.

## 26-10-2026 · Zonas que no son parques (Ndutu)

- Buscar «Ndutu» no daba nada: es una zona del área de conservación del Ngorongoro, no un espacio protegido en
  Wikidata. Igual Seronera, Grumeti, Kogatende, Mara Triangle, Sabi Sands, Savuti, Khwai, Mfuwe, los campamentos
  de Kruger y Etosha o Porto Jofre. `src/features/safaris/zonas.ts` las lista a mano con su parque y una nota; el
  buscador de la portada y el del comparador las encuentran y muestran a qué parque pertenecen. Ampliarla cuando
  falte alguna.

## 26-10-2026 · Presupuesto sin sorpresas

- `/presupuesto?p=parque:noches,…&personas=&mes=&vuelos=` (el planificador enlaza con su plan). Las tasas de
  ~20 destacados están en `src/features/safaris/tasas.ts` con fuente y vigencia (revisadas el 26-10-2026: TANAPA
  vía Roadtrip Africa, KWS oct. 2025, Narok 2026, SANParks nov. 2026, MEFT abr. 2026, Zambia 2025, ZimParks 2023,
  UWA 2024-26, Akagera 2025, permisos de gorilas y Galápagos). Ruaha no: las fuentes no coinciden. Rand, dólar
  namibio y pula se convierten a 18, 18 y 13,5 por dólar. Se cobran por periodo de 24 h (un día por noche).
- El resto (alojamiento, vehículo, vuelos, propinas, visado, seguro, imprevistos) son valores de partida que el
  usuario cambia; se guardan en su navegador y la tabla distingue «tarifa oficial» de «tu estimación».
- Solicitud estándar para mandar a 3-4 operadores (mismas preguntas: qué incluye, vehículo privado, alojamientos
  concretos, pagos y recargos, licencia) y comparador de ofertas que suma lo que cada una no incluye.
- Revisar `tasas.ts` cada año (SANParks cambia en noviembre; UWA publicó tarifas hasta junio de 2026).

## 26-10-2026 · «Especie sin nombre común» y campos numéricos en el móvil

- El `safaris_mundo.json` publicado el 26-10-2026 (ejecución de Rasante con el código anterior) salió con
  `especies` vacío: los nombres se pedían al final y se agotó el tiempo. El código actual los pide justo después
  de las aves y sin límite; además `no_empeora.py` ya no deja publicar si falta el nombre de más del 5 % de las
  especies usadas.
- En el móvil, al vaciar un campo numérico (días del planificador, personas o noches del presupuesto) el valor
  saltaba a otro y no dejaba escribir. Los días son ahora un desplegable y el resto usa `src/ui/CampoNumero.tsx`,
  que solo aplica el número cuando es válido.

## 27-10-2026 · Operadores, ruido del catálogo y resumen de la ficha

- **Operadores: 0 de 1105 ciudades.** La fase de OSM se comía las 4,5 h (cada parque podía gastar ~11 min en
  reintentos: 2 vueltas × 3 espejos × 100 s + pausas, y los fallos se repetían cada día) y los operadores iban
  después, ya sin tiempo. Ahora: `practico.overpass` prueba cada espejo una vez, aparta los que fallan en la
  ejecución, recuerda 5 días las consultas fallidas (`cache/fallo_*`) y registra cuántas respuestas da cada
  espejo; los operadores van antes que el resto de OSM; OSM solo para parques A y B. Ciudad de acceso escrita a
  mano para los 65 destacados (`practico.ACCESO`: Arusha para el norte de Tanzania, Maun para el Okavango…);
  en el resto, la del aeropuerto regular más cercano. Si OSM no tiene operadores, la ficha enlaza el directorio
  de la asociación del país y una búsqueda de operadores de safari en la ciudad de acceso (Google Maps).
- **Ruido**: 1363 de 3502 parques eran europeos y especies estrella aparecían fuera de su área (wapitís en
  Suiza que eran ciervos comunes, leones en un parque de animales de Francia, búfalos domésticos en Grecia).
  `safari/refinar.py` deja cada especie estrella solo en sus continentes nativos (los del catálogo +
  `NATIVOS_EXTRA`), quita zoos y parques de fauna en cautividad y pone un nivel: A destacados (65), B destinos
  de fauna (≥ 3 especies estrella con ≥ 5 observaciones o una con ≥ 50; 884) y C el resto (2553). La web
  muestra por defecto A y B (buscador, planificador, «qué ver»); los C salen buscándolos por nombre o con la
  casilla.
- `python -m safari --refinar ENTRADA` aplica todo eso (y los operadores, con `--minutos`) a un
  `safaris_mundo.json` ya calculado. Mientras la caché de este repo se llena, `safaris_mundo.yml` publica el de
  Rasante refinado; se puede lanzar a mano con `solo_refinar` (150 min para operadores).
- **Resumen arriba en cada ficha** (`ResumenParque`): cuándo ir, qué verás, entrada (de `tasas.ts`), cómo
  llegar y con quién, con enlace a cada detalle.

## 27-10-2026 · Frecuencia de avistamientos por mes

- Para cada destacado y especie estrella, el histograma mensual de iNaturalist frente al de su grupo
  (mamíferos, aves, reptiles), en ‰ y sumando los meses vecinos (`safari/frecuencia.py`; sin cifra si el grupo
  tiene < 30 observaciones en esos tres meses). Corrige que en temporada alta vaya más gente. Calibrado con
  datos reales: león en el Mara ~100 ‰ todo el año, leopardo 20-50 ‰, rinoceronte negro ~10 ‰, licaón ~1 ‰; el
  ñu del Mara se triplica de julio a septiembre, los osos de Yellowstone caen a ~0 en invierno (hibernan), las
  belugas de Churchill solo de junio a agosto.
- Niveles en la web (`nivelFrecuencia`): ≥ 50 ‰ muy probable, ≥ 20 probable, ≥ 5 posible, ≥ 1 difícil, si no
  muy raro. Se presenta como frecuencia en las fotos de los visitantes, no como probabilidad exacta (los
  animales vistosos se fotografían más).
- Dónde: tabla especie × mes en la ficha de los destacados, nivel de este mes en el resumen y nivel del mes
  elegido en «¿Qué quieres ver y cuándo?». ~450 peticiones más a iNaturalist por ejecución semanal (≤ 1/s).

## 27-10-2026 · Mi viaje

- `/viaje`: el plan en una página (itinerario con traslados, qué verás en cada parque el mes del viaje con el
  nivel de frecuencia, presupuesto con tus precios y lista «antes de ir» con casillas). Se guarda en el
  navegador (`safaris.viaje`, `safaris.lista`), se comparte por URL (`/viaje?p=parque:noches,…&mes=&personas=
  &ver=`; quien lo abre puede guardarlo como suyo) y se imprime (CSS de impresión sin menús ni botones).
- Planificador y presupuesto tienen «Guardar en Mi viaje». Claves y utilidades compartidas en
  `src/features/safaris/viaje.ts`. En el menú del móvil, «Mi viaje» sustituye a «Presupuesto» (se llega desde
  el plan).

## 27-10-2026 · Lo práctico por país y safari por tu cuenta

- `src/features/safaris/paises.ts`: para pasaporte español en Kenia, Tanzania, Uganda, Ruanda, Sudáfrica,
  Botsuana, Namibia, Zambia y Zimbabue: visado (con su web oficial), fiebre amarilla, malaria, enchufes (IEC),
  dinero, conducción, zona horaria y propinas. Solo lo que coincidía en varias fuentes; donde no (Namibia y
  Zambia para pasaporte español), se dice que hay que comprobarlo. Fuentes consultadas el 27-10-2026: eTA de
  Kenia (etakenya.go.ke y guías que coinciden en ~30 USD), cambio de visados de Namibia de abril de 2025 (avisos
  de las embajadas en Suecia y Finlandia, 1600 NAD), tasas de visado de Zambia de 2026 (zambiatourism.com:
  50 USD, KAZA UniVisa 50 USD), certificado de fiebre amarilla obligatorio en Uganda desde 2024 (citizen.digital),
  malaria estacional en el sur (SANParks, wanda.be), programa «La salud también viaja» de Sanidad. Revisar al
  menos una vez al año.
- Se ve en «Antes de ir» de cada ficha, en la lista de Mi viaje (visado y salud de cada país del plan, adaptador
  solo si hace falta) y en la guía («País a país»).
- Safari por tu cuenta (`POR_TU_CUENTA`, 20 destacados): coche normal (Kruger, Etosha, Addo, Pilanesberg,
  Hluhluwe-iMfolozi, Kgalagadi), 4×4 con experiencia (Chobe, Moremi, Makgadikgadi, Kalahari Central, Hwange, Mana
  Pools, Akagera, Murchison, Reina Isabel) o con guía (reservas privadas y África oriental). Con las horas de
  amanecer y anochecer del mes en la hora local del parque (las puertas abren y cierran con la luz). Filtro
  «Cómo quieres ir» en el buscador.

## 27-10-2026 · El planificador, como un operador

- Fallo: con 4 noches en Tanzania proponía 4 noches en el Ngorongoro (dividía las noches entre «noches por
  parque» del ritmo y cogía el parque de más puntuación). No sabía cuántas noches merece cada parque, ni que el
  cráter se ve en un día, ni el coste de cambiar de parque, ni por dónde se entra al país.
- Ahora (`planificar.ts` + `estancias.ts`):
  - Estancia de los 65 destacados escrita a mano (mínimo, ideal y máximo de noches, nota, ciudad de entrada y
    valor por noche para un primer safari: Serengeti y Mara 1, Ngorongoro 0,9, Tarangire 0,75, Pilanesberg 0,6;
    gorilas 1,6). Los no destacados valen como mucho la mitad (los de al lado de la capital tienen muchas
    observaciones por la gente que va, no por su fauna) y piden al menos 2 noches si son grandes.
  - Interés de una noche = valor × temporada × frecuencia de avistamientos de ese mes frente a la media del año
    (0,7-1,3). Hasta la estancia ideal vale entera, hasta el máximo un 25-60 % según el ritmo y por encima casi
    nada.
  - Voraz: en cada paso, alargar un parque o añadir otro (valorado con sus noches ideales, para repartir el coste
    del cambio). Coste de añadir = lo que encarece la ruta (insertándolo en su mejor hueco, saliendo y volviendo a
    la ciudad de entrada del país: Arusha, Nairobi, Johannesburgo, Maun…) + medio día de cambio según el ritmo +
    otro circuito (Ruaha entra por Dar es Salaam). Tramos: horas por encima de las libres (5 h en la llegada y la
    salida, 2 h entre parques porque el camino también es safari); más de 6,5 h, en avioneta (3 h + precio; menos
    en Botsuana, Zambia y Zimbabue, donde es lo normal). Velocidad: 90 km/h en Sudáfrica, 85 en Namibia, 70 en
    Botsuana y 50 en el resto.
  - En pantalla: noches de safari (no días), ciudad de entrada y vuelta, «lo normal» de cada parque y su nota,
    dónde está la migración ese mes y dónde alojarse (Serengeti y Mara), especies muy probables ese mes y qué
    cambia con 2 noches más.
- Comprobado con los datos de producción (agosto salvo indicación): Tanzania 4 noches → Serengeti 3 + Ngorongoro
  1; 5 → + Tarangire 1; 7 → Serengeti 4, Ngorongoro 1, Tarangire 2; Kenia 7 (septiembre) → Mara 5 + Amboseli 2;
  Sudáfrica 6 → Sabi Sand 3 + Kruger 3; Botsuana 8 (septiembre) → Makgadikgadi 2, Moremi 4, Chobe 2; Uganda 6
  (julio) → Bwindi 3, Reina Isabel 2, Kibale 1; Ruanda 4 → Volcanes 3 + Akagera 1; Zambia 7 → Bajo Zambeze 3 +
  Luangwa Sur 4.

## 27-10-2026 · Nuevo aspecto y navegación

- El aspecto venía de Rasante y tenía los tics de una web generada: tarjetas blancas con sombra en cada bloque,
  rótulos en mayúsculas espaciadas encima de cada sección, botones en píldora, emojis como iconos, menú y
  pestañas duplicados, tres temas (uno rojo para astrofotografía) y las fotos casi sin protagonismo.
- Dirección: una guía de campo editorial. Titulares en serif (Newsreader) y texto en Archivo; papel arena, tinta
  casi negra, verde acacia de acento y ocre para lo activo y los avisos; claro u oscuro según el sistema (fuera el
  selector y el tema rojo). Las secciones se separan con una línea fina y aire; solo son tarjetas las cosas que se
  «cogen» (un parque, una etapa, un resultado). Botón principal rectangular en tinta y el resto, enlaces.
  Iconos SVG propios en vez de emojis.
- Fotografía: portada con foto a sangre (la de un destacado en buena época ese mes) y el titular encima; ficha
  de parque con la foto a sangre y el título encima. Las miniaturas de Commons se piden a 1280 px y, si el
  original es más pequeño, se vuelve a la de 960 (`src/ui/FotoGrande.tsx`; a 1920 px Commons no responde).
- Navegación (`src/ui/Navegacion.tsx`): un menú (Descubrir, Especies, Migración, Planificar, Guía) con la
  sección activa subrayada en ocre y «Mi viaje» a la derecha con el número de parques guardados; en el móvil,
  barra inferior con iconos (Descubrir, Especies, Planificar, Mi viaje). Comparar y Presupuesto se abren desde
  donde se usan y desde el pie, que es ahora un mapa del sitio.
- Implementación: los tokens nuevos están en `01-tokens.css` (mismos nombres, así que lo heredado cambia solo) y
  `12-diseno.css`, cargado el último, redefine las piezas base. Se quitaron las reglas viejas de cabecera y móvil.
- Retoques (27-10-2026): índice fijo bajo la cabecera en las fichas (Resumen, Qué se ve, Cuándo ir, Mapa,
  Organizar, Dónde dormir; anclas, sin JavaScript), «Dónde dormir» con 6 a la vista y el resto plegado, tarjetas
  de parque y especie enteras como enlace con foto 3:2 (o un rayado discreto si no hay foto), temporada como punto
  de color, guía con índice lateral fijo y texto a 72 caracteres. Modo oscuro revisado en portada, ficha,
  planificador y guía.

## 27-10-2026 · Safari con niños

- `src/features/safaris/familias.ts`: destacados sin malaria (sur de Sudáfrica —Addo, Pilanesberg, Madikwe,
  Kgalagadi— y los de fuera de los trópicos) y edades mínimas (gorilas 15 años en Uganda y Ruanda, coinciden
  todas las fuentes; chimpancés de Kibale 12-13 según la fuente, se dice así). Fuentes consultadas el
  27-10-2026: Duma Explorer, Roadtrip Africa y Trek Africa Tours.
- En la ficha (resumen «Con niños»), en el buscador («Con niños pequeños», solo sin malaria y sin edad mínima) y
  en el planificador («Viajo con niños»: fuera los parques con edad mínima, ×1,5 a los sin malaria y un aviso
  con los que sí tienen riesgo y las edades de los lodges). Sudáfrica 6 noches con niños → Madikwe 4 +
  Pilanesberg 2 (sin niños, Sabi Sand + Kruger); Uganda → Murchison + Kidepo, sin gorilas.

## 28-10-2026 · Avisos sin cuenta, animales vistos y páginas de respuesta

- Calendarios `.ics` (`src/features/safaris/calendario.ts`): `/parque/<id>/calendario.ics` con la buena época
  como evento de varios meses que se repite cada año (`RRULE:FREQ=YEARLY`) y un recordatorio de un día dos meses
  antes («Reserva ya…»); `/migracion.ics` con la zona de cada mes. Se suscriben con `webcal://` (Apple, Outlook,
  móviles) o Google Calendar (`calendar.google.com/calendar/r?cid=`); `REFRESH-INTERVAL` de 7 días. Los de los
  destacados se generan en el build y el resto al pedirlos (con los `.gz` en la función). Sin alarmas (`VALARM`):
  los calendarios suscritos suelen ignorarlas, por eso el aviso es un evento.
- RSS `/recientes.xml`: las especies estrella vistas en 30 días en cada destacado (solo el parque, nunca dónde).
  El `guid` es parque + semana: los datos cambian dos veces al día y no queremos 65 entradas nuevas cada vez.
- Animales vistos (`ListaVistos.tsx`, en Mi viaje): todas las especies estrella de los parques del viaje, para ir
  marcándolas; se guardan en el navegador (`safaris.vistos`, clave de GBIF → fecha), de todos los viajes, y se
  cuenta el total.
- Páginas de respuesta con plantillas (`/safari-en/[clave]`): 12 meses («Safari en agosto: dónde ir»: destacados
  en su mejor época por continente, lo probable ese mes según la frecuencia, la migración y los de África fuera de
  temporada) y un país por cada uno con destacados (temporadas de sus parques, especies, otros destinos de nivel
  B, lo práctico). Índice en `/safari-en`. `sitemap.xml` (destacados, especies, respuestas y parques A/B; los C
  no) y `robots.txt` (fuera `/viaje` y `/comparar`, que dependen de cada uno). `SITIO` en `src/lib/sitio.ts`
  (se puede cambiar con `NEXT_PUBLIC_SITIO`).

## 28-10-2026 · Calendario del viaje, comparativas por mes y frescura de los datos

- Mi viaje admite una fecha de llegada (opcional; fija el mes). Con ella, cada etapa muestra sus días y
  `/viaje.ics?p=…&salida=…` da el viaje en el calendario: cada parque en sus noches, el día de vuelta y
  recordatorios que aún no han pasado (alojamientos y permisos de gorilas 6 meses antes, vacunas 8 semanas,
  visados electrónicos 6 semanas, repasar la lista 1 semana). Todo va en la dirección: no se guarda nada en el
  servidor. Si se cambia el viaje, hay que volver a añadirlo (la dirección cambia).
- Comparativas `/safari-en/kenia-o-tanzania-en-agosto` (`ComparaPaises.tsx`, parejas en
  `src/features/safaris/respuestas.tsx`): 11 parejas que se buscan mucho × 12 meses. Sin veredicto inventado:
  parques en su mejor época, especies probables (≥ 20 ‰ en algún parque), lluvia media (ERA5), dónde está la
  migración, visado, malaria, parques sin malaria, por tu cuenta (con los nombres) y por dónde se conduce.
- «De cuándo es cada dato» (`src/ui/Frescura.tsx`), plegado al pie de las fichas: lo visto en 30 días (fecha de
  `safaris_recientes.json`), frecuencia/clima/alojamientos (`generado` del catálogo), lo escrito a mano, la tasa
  (vigencia y fuente) y lo práctico del país (`REVISADO`). En las fichas del mundo, el `generado` de
  `safaris_mundo.json`.
- Se corrige el escape de «;» en los `.ics` (salía sin barra).
- CI: `ubuntu-latest` pasó a Ubuntu 26.04 y Playwright aún no tiene Chromium para él («Playwright does not
  support chromium on ubuntu26.04-x64»). Todos los workflows fijan `ubuntu-24.04` hasta que lo soporte.

## 28-10-2026 · Temporada verde y precios de operadores

- Sin raspar webs: los precios publicados son «desde», con condiciones distintas, y muchas webs lo prohíben. Lo
  que hace falta para la temporada verde es la proporción entre temporadas, que cambia poco de un año a otro.
- `src/features/safaris/temporadaVerde.ts`: 23 lodges de 12 destacados, con el precio por persona y noche en
  doble de cada mes copiado a mano de sus hojas de tarifas 2026 (Governors', Porini, Lemala, Natural
  Selection Botsuana y Namibia, Time + Tide, Sabi Sabi, Chobe Mopani). Dos (Chobe Game Lodge y Camelthorn, en
  Hwange) vienen de tablas de agentes y se marcan así. Cada mes, la tarifa que cubre la mayor parte
  del mes; `null` si cierra. Índice por parque: mediana de (precio del mes / mes más caro) de sus lodges.
- Web: en la ficha («Cuándo ir»), barras de precio por mes, el ahorro máximo, la lluvia y qué especies estrella
  se siguen viendo igual o bajan de nivel ese mes (frecuencia de iNaturalist); plegadas, las tarifas con su
  enlace. `/temporada-verde` compara los 12 parques. Sabi Sand sale «mismo precio todo el año», que también es
  información útil.
- Se revisa a mano una vez al año (`CONSULTADO`). Con meses en que cierran algunos lodges, el índice de ese mes
  sale solo de los abiertos (en Ngorongoro, abril-mayo es Osonjoi solo).
- `python -m safari --sondeo-precios` (`safari/sondeo.py`): para unas 45 webs de agregadores, lodges,
  operadores, oficiales y agencias españolas mira robots.txt, si sus condiciones mencionan el acceso
  automatizado y si una página de safari del sitemap trae el precio en JSON-LD. Pocas peticiones, 2 s entre
  ellas, sin guardar contenido. Resultado en `docs/sondeo-precios.md`.
- Resultado del sondeo (`docs/sondeo-precios.md`): solo 2 de 44 webs tienen precio estructurado y una lo
  prohíbe; 4 prohíben el acceso automatizado; 19 solo lo tienen en texto libre. Se descarta el raspador (paso
  «c») y se sigue con las tarifas oficiales copiadas a mano una vez al año.
- Presupuesto: el alojamiento que escribe el usuario es el de temporada alta; en los parques con tarifas de
  lodges se multiplica por el índice de ese mes (p. ej. Serengeti en abril ≈ 40 %) y la línea lo explica.

## 28-10-2026 · Planificador: viajes cortos, avioneta y salida por otra ciudad

- Horas «gratis» del día de llegada y salida: de 5 a 3 (se aterriza y como mucho se llega al parque por la
  tarde). Tanzania 3 noches deja de ser «Serengeti 3 con 12 h de carretera» y pasa a Ngorongoro + Tarangire.
- Circuitos: la ruta puede acabar en la ciudad de otro circuito (después del norte de Tanzania, Ruaha y salida
  por Dar es Salaam) y cada cambio de circuito dentro de la ruta cuesta 0,5 noches (antes se sumaba al insertar
  el parque). Tanzania 14 noches: Tarangire → Ngorongoro → Serengeti → ✈ Ruaha → Dar es Salaam (antes metía
  Ruaha entre el Serengeti y el Ngorongoro, con dos vuelos). Aviso del billete por ciudades distintas.
- Opción «Avioneta en los tramos de más de 5 h» (`volar=1`): la ida y vuelta desde la entrada en avioneta si
  pasan de 3 h y media y cualquier tramo de más de 5 h. Si el plan tiene tramos de ≥ 5 h por carretera, se
  propone la alternativa en avioneta con las horas que ahorra.
- Se probó a encarecer las horas de carretera (6 o 5 h por noche en vez de 8) y desordenaba otros casos: se
  deja en 8.
- Las especies sin nombre en `/especies.json` ya no salen como un número en «En agosto: …».

## 28-10-2026 · Clima del catálogo: NASA POWER en vez de dos años de ERA5

- La lluvia de los destacados salía de ERA5 (Open-Meteo) en 2023-2024, dos años con El Niño y lluvias anómalas
  en África oriental: el Mara daba 19 mm en febrero y 43 en mayo (la climatología, 69 y 103). Ahora sale de la
  climatología de NASA POWER (décadas de datos), como en el resto de parques: una petición por parque y sin
  límite por hora.
- La máxima: en la climatología de POWER, `T2M_MAX` es la máxima absoluta del mes (el Mara salía a 35 °C). La
  media de las máximas diarias se estima como `T2M + T2M_RANGE / 2`, que cuadra con ERA5 a ±1-2 °C (Mara 27-29,
  Ngorongoro 20-25). Va en una petición aparte solo para el catálogo; los parques del mundo solo usan la lluvia y
  su caché no cambia.

## 28-10-2026 · Comparador para decidir

- `/comparar?p=…&mes=N`: el mes cambia la respuesta (nav de meses; por defecto el actual). Arriba, «quién gana en
  cada cosa»: en su mejor época ese mes, más especies emblemáticas, aeropuerto internacional más cerca, entrada
  más barata (tasa de un día de `tasas.ts`), lodges más baratos ese mes (temporada verde) y más alojamientos.
  Si empatan varios salen todos; si empatan todos, no sale (no hay nada que decidir).
- Tabla por secciones (cuándo ir, qué se ve, llegar y moverse, coste, práctico). En los destacados, cada especie
  con su nivel del mes (frecuencia de iNaturalist); en el resto, una barra relativa a las observaciones de GBIF
  en vez del número suelto. «Se entra por» (Arusha, Nairobi…) además del aeropuerto internacional más cercano,
  que en el Serengeti es Mwanza y no es por donde entra casi nadie. Visado, malaria, con niños y por tu cuenta.
- Tarifas ampliadas (28-10-2026): 30 lodges de 17 parques. Nuevos: Camp Savuti (Chobe, hoja oficial), Saruni
  Samburu, Sand Rivers (Nyerere), Jongomero (Ruaha), Chiawa (Bajo Zambeze) y Musekese (Kafue), estos cinco de
  tablas de agentes (Chalo Africa, Siyabona, Go2Africa) porque los lodges no publican la suya: se marcan así.
  `null` en un mes es cerrado o sin tarifa publicada.

## 28-10-2026 · Cierres estacionales

- `src/features/safaris/cierres.ts`, escrito a mano con fuentes (consultadas el 28-10-2026): zonas núcleo de
  los parques de tigres de la India cerradas del 1 de julio al 30 de septiembre (norma de la NTCA; Kanha,
  Bandhavgarh, Pench, Tadoba, Ranthambore; Corbett, Bijrani y Dhikala), Kaziranga (mayo-septiembre, crecidas),
  Yala (bloques 1 y 2 en septiembre, fechas variables), Katmai (Brooks Camp solo de junio a mediados de
  septiembre), Mana Pools y Gorongosa (enero-marzo) y los campamentos de Ruaha (abril-mayo). Tres tipos: parque,
  zona (quedan zonas secundarias) y campamentos.
- Efectos: el planificador no propone parques o zonas cerrados ese mes y los nombra en un aviso (con
  «campamentos» los deja, a ×0,4, con aviso); la ficha lo dice en «Cuándo ir» y, si es este mes, arriba; el
  comparador marca «Cerrado» y no lo cuenta como en su mejor época; «Safari en agosto» tiene «Cerrados en
  agosto». India en agosto: solo queda Sundarbans, fuera de su época, con los avisos.

## 28-10-2026 · Revisión de 40 fichas del mundo (nivel B) y arreglos sistemáticos

Muestra aleatoria de 40 parques de nivel B. Errores encontrados y arreglo:
- Superficies de Wikidata ×100 o ×1000 (comas decimales mal importadas: Alvão 72 km² figura con 72 027,
  Udawalawe 308 con 30 821, Varangerhalvøya con 1,8 millones). Con radio = √(área/π) hasta 80 km, reservas
  pequeñas heredaban la fauna de toda la región. Ahora: radio máximo 40 km fuera del catálogo (los 65
  destacados llevan el suyo) y superficie descartada si es más de la mitad del país (`area_plausible`, con la
  superficie del país de Wikidata). Los radios nuevos piden otra vez GBIF: entran por tandas en las ejecuciones
  diarias.
- Australia: 353 de 883 parques B, casi todos bosques con koala y equidna (comunísimos en Nueva Gales del Sur).
  Koala, equidna y canguro gris occidental ya no cuentan para el nivel B (`COMUNES`): quedan 13.
- Monumentos con lobos alrededor (sinagoga de Cafarnaúm, iglesia de San Pedro, paisaje de la viña del Pico):
  `NO_NATURALEZA` los deja en nivel C.
- «Mejor época» por «más avistamientos» en parques templados sin estación («enero», «mar-may, sep-dic»): en la
  web solo vale si son 2-6 meses en 1-2 tramos (`estacionClara`); si no, «Sin una estación marcada».
- Nombres de GBIF: «Damán de el cabo», «Facόquero» (ó griega), «Bífalo africano», «Equidna de hocico corto
  equidna australiano»: `limpiarNombre`. Las especies estrella ya salían bien (nombres del catálogo) y las de
  menos de 3 observaciones (orcas en Israel) ya no se mostraban.
- Bases militares como ciudad de acceso («Oakey Army Aviation Centre»): fuera de los aeropuertos regulares.

## 28-10-2026 · Lo práctico fuera de África

- 14 países más en `paises.ts` (India, Nepal, Sri Lanka, Indonesia, Malasia, Brasil, Ecuador, Perú, Costa Rica,
  Estados Unidos, Canadá, Chile, Argentina y Australia), con su fecha de revisión propia (`revisado`). Fuentes
  oficiales enlazadas en cada visado; Sri Lanka: ETA gratuita para españoles desde el 25-5-2026 (lista oficial
  del Departamento de Inmigración); Galápagos: tarjeta de tránsito 20 USD y entrada 200 USD.
- Sri Lanka (libre de malaria desde 2016) y Kakadu (Australia) entran en `SIN_MALARIA`. El comparador muestra el
  texto de malaria del país en vez de «hay riesgo».

## 28-10-2026 · Revisión anual de lo escrito a mano

- `.github/scripts/revision_datos.py` lee las fechas de revisión de `src/features/safaris` (`REVISADO_*`,
  `CONSULTADO` y el `revisado` de cada país) y el workflow `revision.yml` (el día 1 de cada mes) abre o
  actualiza una incidencia «Revisión anual de los datos escritos a mano» si algo tiene más de un año, con la
  lista y qué mirar en cada caso. Al revisar, se cambia la fecha en el fichero.

## 03-11-2026 · Especificación de fauna y confianza de la frecuencia

- La especificación del usuario (planificador de fauna en España y safaris) está en `docs/especificacion-fauna.md`,
  revisada contra lo que ya hace la app: web pública, alojamientos y presupuesto se quedan; mensual suavizado
  antes que semanal; dos notas (verla / fotografiarla); JSON troceados por provincia. Credenciales opcionales en
  `.env.example` (GBIF y eBird), que aún no existen.
- Tamaño de muestra: el catálogo guarda `muestra` (fotos del grupo con los meses vecinos, por taxón y mes). La
  ficha marca con rayado los niveles de confianza baja (30-99 fotos), añade la fila «Fotos del grupo» y la
  confianza del mes; el comparador pone «(pocos datos)». Umbrales: alta ≥ 300, media ≥ 100, baja ≥ 30.

## 03-11-2026 · Calendario de fenómenos

- `src/features/safaris/eventos.ts` (el `event` de la especificación): nueve fenómenos escritos a mano con fuente
  (reunión de elefantes de Minneriya, desove de tortuga verde en Tortuguero, ballenas francas de Valdés, osos
  polares de Churchill, crecida del Okavango, ñus de Liuwa, osos y salmón de Katmai, jaguares del Pantanal,
  elefantes del Chobe) y los partos y cruces de la migración, sacados de `migracion.ts`. Meses, pico si se conoce,
  especie (nombre científico) y fuente.
- Se ve en la ficha («Qué pasa a lo largo del año», resaltado si es este mes), en «Safari en septiembre» («Qué
  pasa en…»), en la página de cada especie («Momentos especiales») y dentro del calendario `.ics` del parque. La
  revisión anual lo incluye (`REVISADO_EVENTOS`).

## 03-11-2026 · Motor de España (sin credenciales todavía)

- `safari/espana/`: `rejilla` (celda de la cuadrícula EEA de 10 km, EPSG:3035, fórmulas de Snyder; comprobada
  contra pyproj a < 1 m; también en `src/lib/rejilla.ts` para el navegador), `zonas` (Doñana, Gredos, Picos,
  Gallocanta, con su mes de prueba), `gbif_descarga` (descarga SQL: recuentos por celda, clase, especie, año y mes
  de aves, mamíferos, reptiles y anfibios desde 2005, con `GBIF_EEARGCode(10000, …)`), `ebird` (recientes y
  hotspots), `nombres` (nombre en español de GBIF, con caché), `estacionalidad` (‰ de su clase con los meses
  vecinos, muestra, confianza, ranking y backtest top-20) y `cli` (`python -m safari --espana`).
- Sin `GBIF_USUARIO`/`GBIF_CLAVE` o `EBIRD_CLAVE` no se pide nada y la web sigue igual. Workflow `espana.yml`, a
  mano: descarga (guardada en la caché para no repetirla), `espana.json` a la release y el informe
  `docs/espana-viabilidad.md` (observaciones por mes, top 20 del mes de prueba con confianza y backtest del último
  año completo en las cuatro zonas).

## 03-11-2026 · Página «Fauna en España» (luz, tiempo, puntuación)

- `/espana`: un lugar (cuatro zonas de prueba o «mi ubicación»), un radio y un día →
  - luz (`src/lib/luz.ts`): horas azul (sol entre -6° y -4°) y dorada (entre -4° y 6°), salida y puesta;
  - tiempo (`src/lib/tiempo.ts`, en el navegador, sin clave): previsión de Open-Meteo por horas con nubes bajas,
    medias y altas, lluvia y rachas si faltan menos de 16 días; si no, climatología del archivo (±7 días de esa
    fecha en los diez últimos años). La etiqueta dice siempre cuál es;
  - mejores franjas: luz × nubes bajas × lluvia y viento;
  - especies del mes: celdas de 10 km del radio (cuadrícula EEA calculada en el navegador), pedidas por bloques de
    100 km a `/espana/datos/[bloque]`, que lee `espana.json` (404 mientras no haya descarga de GBIF: la página lo
    dice y la luz y el tiempo funcionan igual). La frecuencia de varias celdas se une ponderando por la muestra.
- Puntuación (`src/features/espana/puntuacion.ts`): verla = frecuencia · presencia reciente · actividad;
  fotografiarla = luz · tiempo; total, media geométrica con pesos (frecuencia ×3). Suelos: sin avistamientos
  recientes 0,5; actividad 0,3. Solo la frecuencia 0 anula. Actividad por clase mientras no haya tabla por especie
  (aves de día, mamíferos crepusculares). Desglose plegado en cada especie.
- Probado con un `espana.json` sintético en local (no se publica).

## 03-11-2026 · «¿Dónde veo…?» en España, menú y environment

- `/espana?modo=donde`: buscas una especie (lista de `/espana/especies.json`, sin tildes) y un mes (o «en su mejor
  mes») → `/espana/especie/[clave]` devuelve sus cuadrículas de más a menos frecuentes, agrupadas por el espacio
  protegido de España más cercano (a < 15 km, del catálogo mundial; si no hay, sus coordenadas), con la curva del
  año, la muestra y cuántas cuadrículas tiene cada lugar. Mapa, mejor época (≥ 20 ‰), confianza y enlace a «¿Qué
  veo aquí?» en ese punto. Centro de cada celda con la inversa de LAEA (`laeaInversa`, ida y vuelta < 1e-6°).
- `espana.json` guarda la clase de cada especie (para la muestra de su grupo).
- Menú: «Cuándo ir» (`/safari-en`, con la migración y la temporada verde) y «España» entran arriba y en la barra
  del móvil (cinco botones); antes solo estaban en el pie y no se encontraban.
- Los secretos de GBIF y eBird están en el environment de GitHub `EBIRD_CLAVE`: `espana.yml` lo declara
  (`environment: EBIRD_CLAVE`); sin eso el trabajo no los ve.
- La primera descarga SQL de España salió válida pero vacía. El diagnóstico (`--espana-diagnostico`, consultas
  pequeñas sobre Gallocanta) lo localizó en el filtro de clase: 123 338 registros con caja y país, 0 al añadir
  `classKey = 212`. La tabla SQL de GBIF clasifica ahora por defecto con Catalogue of Life (claves de texto, Aves
  = «V2»); el backbone de GBIF, cuyas claves usa la app, está en `occurrence.gbif_classification.*` (como texto).
  La consulta filtra y agrupa por `gbif_classification.classkey/specieskey`.
- Primera descarga real (04-11-2026): 11,5 M filas agregadas, 9016 celdas, 692 especies; backtest en las cuatro
  zonas entre 13 y 18 aciertos de 20. Arreglos tras revisarla:
  - GBIF deja sin código EEA las observaciones cuya incertidumbre no cabe en la celda (2,7 M de aves): salían en
    una celda «» que rompía `/espana/datos/[bloque]`. Se descartan al leer y en las rutas.
  - Cada celda guardaba sus 80 especies con más registros: eran todas aves y la web no enseñaba mamíferos ni
    anfibios. Ahora 80 aves y 25 de cada otro grupo.
  - Reptiles: en el backbone de GBIF «Reptilia» (358) es sinónimo y no tiene registros; se piden Squamata,
    Testudines y Crocodylia y se juntan en 358.
  - La frecuencia es dentro de su grupo, así que un grupo con pocos registros da ‰ altos (zorro 433 ‰ en Doñana):
    la lista de «¿Qué veo aquí?» se filtra por grupo (Todas, Aves, Mamíferos, Reptiles, Anfibios).
  - Nombres: GBIF da a veces el de otro país o uno equivocado (Sus scrofa «Cerdo doméstico», Herpestes
    «Huron»). `safari/recursos/nombres_espana.csv` los corrige a mano y el resto se limpia (primer nombre, sin
    comillas, minúsculas salvo la inicial y nombres propios).
  - Lugares: los ~158 espacios protegidos españoles del catálogo mundial quedan lejos de muchas celdas (las de
    grullas en Extremadura). Se nombra el más cercano hasta 40 km («A 29 km de Tablas de Daimiel») y solo se
    agrupan las celdas a menos de 15 km. Pendiente: espacios protegidos de España completos (Natura 2000/ENP).
- Informe de viabilidad por grupo (20 aves y 10 de cada otro grupo) y backtest solo de aves: mezclados, los ‰ de
  grupos distintos no se comparan.
- «Todas» en «¿Qué veo aquí?» alterna los grupos por su puesto dentro de cada uno (mejor ave, mejor mamífero…);
  el filtro por grupo sigue su propio orden. Para la nota el ‰ se rebaja con poca muestra, ‰ · n / (n + 100):
  un corzo entre 93 registros de mamíferos daba 581 ‰.
- eBird: `data/obs/{provincia}/recent` (la última observación de cada especie en cada provincia, 30 días; unas 52
  peticiones al día) en `espana_recientes.yml` con el environment `EBIRD_CLAVE`. Sin ubicaciones privadas con
  nombre (y eBird ya oculta las especies sensibles); coordenadas a 2 decimales. `/espana/datos/[bloque]` añade
  las del bloque y la web pone «vista el 2 nov en …» y la usa en «vista hace poco» si el plan es en las
  próximas dos semanas (a meses vista no dice nada). Crédito a eBird visible, como se dijo al pedir la clave.
- Lugares de fauna en toda España, no solo las cuatro zonas de prueba (`espana_lugares.json`, diario):
  - puntos de observación de eBird con 30 especies o más (`ref/hotspot/ES`, una petición): lagunas, sotos,
    parques urbanos, bosques pequeños;
  - unos 2300 espacios protegidos de Wikidata (Natura 2000, ZEPA, parques y reservas naturales, monumentos
    naturales, parques periurbanos…; sin conjuntos históricos ni yacimientos), con radio por su superficie;
  - unos 360 observatorios de aves de OSM, ya agrupados en Rasante (sin exhibiciones de cetrería).
  Se quitan los repetidos (mismo nombre a menos de 3 km). Si una fuente falla, no se publica (queda el de ayer);
  Wikidata corta a veces la respuesta: tres intentos.
- `/espana`: «Dónde» es un buscador de esos lugares, con «Mi ubicación», y «Cerca de aquí» (`/espana/cerca`)
  lista los 12 más cercanos a 30 km con las especies de sus cuadrículas en el mes y cuatro destacadas (una de
  cada grupo por turno). En «¿Dónde veo…?» cada cuadrícula toma el nombre del lugar más cercano (al borde, para
  los espacios grandes).
