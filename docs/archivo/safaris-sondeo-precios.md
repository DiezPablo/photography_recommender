# Sondeo de precios en webs de operadores y lodges

**Conclusión (revisada a mano, 28-10-2026):** no compensa un raspador automático.
- Solo 2 de 44 webs llevan el precio en datos estructurados (JSON-LD): Rhino Africa y Discover Africa, y esta
  última prohíbe expresamente la recogida automatizada. Las condiciones de Rhino Africa no están en ninguna ruta
  habitual: habría que preguntarles.
- Go2Africa, TourRadar, Discover Africa y Thomson Safaris lo prohíben en sus condiciones.
- En 19 el precio solo está en el texto («desde 2.450 USD»), con formatos y condiciones distintos en cada web:
  sacarlo sin IA exige reglas por web que se rompen con cada rediseño.
- Lo que sí funciona son las hojas de tarifas que publican los propios lodges (PDF o página «Rates»): se copian
  a mano una vez al año (`src/features/safaris/temporadaVerde.ts`).

Hecho el 28-10-2026 con `python -m safari --sondeo-precios` (User-Agent `safaris/0.4 (https://github.com/DiezPablo/safari_recommender; proyecto personal no comercial)`).
Por cada web: su robots.txt, si sus condiciones mencionan el acceso automatizado (búsqueda de palabras en la
página de condiciones, a revisar a mano) y una página de safari del sitemap: si lleva precio en JSON-LD de
schema.org o solo en el texto. No se guarda contenido de las páginas.

Resumen: dudoso: 19, sin datos: 10, sin precios publicados: 5, no responde: 5, no: 4, sí: 1.

| Web | Tipo | robots.txt | Condiciones | Página de muestra | JSON-LD | Precios en texto | Veredicto |
|---|---|---|---|---|---|---|---|
| [SafariBookings](https://www.safaribookings.com) | agregador | sí | no lo menciona | – | – | 0 | sin datos |
| [TourRadar](https://www.tourradar.com) | agregador | sí | prohíbe | [muestra](https://www.tourradar.com/o/ancient-egypt-tours/tours) | BreadcrumbList, ListItem | 43 | no (condiciones) |
| [Expert Africa](https://www.expertafrica.com) | agregador | sí | – | [muestra](https://www.expertafrica.com/botswana/okavango-delta-safari-reserves/reviews/1) | AggregateRating, Person, Product, Rating, Review | 6 | dudoso (precio solo en texto) |
| [Go2Africa](https://www.go2africa.com) | agregador | sí | prohíbe | [muestra](https://www.go2africa.com/es/excursiones-safaris/safari-de-lujo-de-13-dias-por-uganda-kenia-y-tanzania) | ItemList, ListItem, Offer, Organization, Place, TouristTrip + precio | 4 | no (condiciones) |
| [Rhino Africa](https://www.rhinoafrica.com) | agregador | sí | – | [muestra](https://www.rhinoafrica.com/en/tours/rwanda-kenya-tanzania-tour/2165) | AggregateRating, BreadcrumbList, ContactPoint, EntryPoint, ListItem, Offer, OpeningHoursSpecification, PostalAddress + precio | 2 | sí (precio estructurado) |
| [Discover Africa](https://www.discoverafrica.com) | agregador | sí | prohíbe | [muestra](https://www.discoverafrica.com/safaris/zimbabwe/hwange-national-park/reviews/) | AggregateOffer, AggregateRating, Brand, BreadcrumbList, ImageObject, ItemList, ListItem, Organization + precio | 10 | no (condiciones) |
| [Africa Odyssey](https://www.africaodyssey.com) | agregador | sí | no lo menciona | [muestra](https://www.africaodyssey.com/best/best-places-in-africa-for-a-boating-safari) | ContactPoint, Organization | 1 | dudoso (precio solo en texto) |
| [Timbuktu](https://www.timbuktutravel.com) | agregador | sí | no lo menciona | [muestra](https://www.timbuktutravel.com/continent/asia-trip/best-places-to-visit/asia-trip-february) | – | 9 | dudoso (precio solo en texto) |
| [Yellow Zebra](https://www.yellowzebrasafaris.com) | agregador | sí | no lo menciona | [muestra](https://yellowzebrasafaris.com/au/inspiration/multi-country-safaris/pan-africa/) | BreadcrumbList, ImageObject, ListItem, WebPage, WebSite | 0 | sin precios publicados |
| [Aardvark Safaris](https://www.aardvarksafaris.com) | agregador | sin robots.txt | – | – | – | 0 | sin datos |
| [Wilderness](https://www.wildernessdestinations.com) | lodges | sí | no lo menciona | [muestra](https://www.wildernessdestinations.com/africa/botswana/best-time-for-a-botswana-safari) | Answer, BreadcrumbList, FAQPage, ImageObject, ListItem, Organization, Question, SiteNavigationElement | 3 | dudoso (precio solo en texto) |
| [andBeyond](https://www.andbeyond.com) | lodges | sí | – | [muestra](https://www.andbeyond.com/tailormade-tours/discover-botswanas-delta-linyanti/) | – | 11 | dudoso (precio solo en texto) |
| [Asilia](https://www.asiliaafrica.com) | lodges | sí | no lo menciona | – | – | 0 | sin datos |
| [Singita](https://singita.com) | lodges | sí | no lo menciona | [muestra](https://singita.com/lodge/singita-lebombo-lodge/experience-guided-safari-walks/) | BreadcrumbList, ContactPoint, ImageObject, ListItem, Organization, PostalAddress, Thing, WebPage | 0 | sin precios publicados |
| [Natural Selection](https://naturalselection.travel) | lodges | sí | – | [muestra](https://naturalselection.travel/safari/classic-okavango-delta-safari/) | BreadcrumbList, EntryPoint, ImageObject, ListItem, Organization, PropertyValueSpecification, ReadAction, SearchAction | 13 | dudoso (precio solo en texto) |
| [Great Plains](https://greatplainsconservation.com) | lodges | sí | no lo menciona | [muestra](https://greatplainsconservation.com/beyond-the-typical-tourist-route/) | BlogPosting, ImageObject, Person, WebPage, WebSite, ['LodgingBusiness', 'Organization'] | 1 | dudoso (precio solo en texto) |
| [Kicheche](https://www.kicheche.com) | lodges | sí | – | [muestra](https://kicheche.com/simply-laikipia-safari/) | Article, ImageObject, Person, WebPage, WebSite, ['Person', 'Organization'] | 2 | dudoso (precio solo en texto) |
| [Nomad Tanzania](https://www.nomad-tanzania.com) | lodges | sí | – | – | – | 0 | sin datos |
| [Elewana](https://www.elewana.com) | lodges | sin robots.txt | – | – | – | 0 | no responde |
| [Sanctuary Retreats](https://www.sanctuaryretreats.com) | lodges | sin robots.txt | no lo menciona | – | – | 0 | sin datos |
| [Angama](https://angama.com) | lodges | sí | – | – | – | 0 | sin datos |
| [Governors' Camp](https://www.governorscamp.com) | lodges | sí | – | [muestra](https://governorscamp.com/blog/loldia-house-a-trip-to-lake-elementeita/) | Article, BreadcrumbList, EntryPoint, ImageObject, ListItem, Person, PropertyValueSpecification, ReadAction | 2 | dudoso (precio solo en texto) |
| [Porini (Gamewatchers)](https://www.porini.com) | lodges | sí | no lo menciona | [muestra](https://www.porini.com/african-safari-holidays/kenya/parks-and-reserves/ol-kinyei-conservancy/) | AdministrativeArea, Answer, BreadcrumbList, CollectionPage, FAQPage, GeoCoordinates, ImageObject, ItemList | 1 | dudoso (precio solo en texto) |
| [Desert & Delta](https://www.desertdelta.com) | lodges | sí | no lo menciona | [muestra](https://desertdelta.com/itineraries/six-night-best-of-desert-delta-safaris/) | BreadcrumbList, EntryPoint, ImageObject, ListItem, Organization, PropertyValueSpecification, ReadAction, SearchAction | 0 | sin precios publicados |
| [Machaba](https://www.machabasafaris.com) | lodges | sí | – | [muestra](https://machabasafaris.com/en/camps-lodges/ngoma-safari-lodge/suites) | – | 5 | dudoso (precio solo en texto) |
| [Ultimate Safaris](https://www.ultimatesafaris.na) | lodges | sin robots.txt | – | – | – | 0 | no responde |
| [Gondwana Collection](https://gondwana-collection.com) | lodges | sí | – | [muestra](https://gondwana-collection.com/de/news/de/das-etosha-safari-camp-dient-als-kulisse-fuer-traumschiff-dreharbeiten) | – | 1 | dudoso (precio solo en texto) |
| [Sabi Sabi](https://www.sabisabi.com) | lodges | sí | no lo menciona | – | – | 0 | sin datos |
| [Londolozi](https://www.londolozi.com) | lodges | sí | no lo menciona | [muestra](https://www.londolozi.com/en/about/100-years-of-safari) | – | 0 | sin precios publicados |
| [Chem Chem](https://www.chemchemsafaris.com) | lodges | sin robots.txt | – | – | – | 0 | no responde |
| [Lemala](https://www.lemalacamps.com) | lodges | sí | – | [muestra](https://www.lemalacamps.com/rates/) | ContactPoint, LodgingBusiness, Organization, Place | 27 | dudoso (precio solo en texto) |
| [Tanzania Odyssey](https://www.tanzaniaodyssey.com) | operador | sí | no lo menciona | [muestra](https://www.tanzaniaodyssey.com/tanzania/four-seasons-safari-lodge) | ContactPoint, Organization | 1 | dudoso (precio solo en texto) |
| [Thomson Safaris](https://thomsonsafaris.com) | operador | sí | prohíbe | [muestra](https://thomsonsafaris.com/safari-experience/safari-guides/arthur-dallas/) | BreadcrumbList, ListItem | 0 | no (condiciones) |
| [G Adventures](https://www.gadventures.com) | operador | sí | no lo menciona | [muestra](https://www.gadventures.com/destinations/north-america/united-states/alaska-tours/) | – | 0 | sin precios publicados |
| [Intrepid](https://www.intrepidtravel.com) | operador | sí | no lo menciona | [muestra](https://www.intrepidtravel.com/au/newsroom/releases/intrepid-adds-80-trips-2027) | – | 7 | dudoso (precio solo en texto) |
| [Abercrombie & Kent](https://www.abercrombiekent.com) | operador | sin robots.txt | no lo menciona | [muestra](https://www.abercrombiekent.com/destinations/asia/india/tiger-safari) | BreadcrumbList, Continent, ImageObject, ListItem, TouristDestination, ['Organization'] | 5 | dudoso (precio solo en texto) |
| [Easy Travel Tanzania](https://www.easytravel.co.tz) | operador | sí | no lo menciona | [muestra](https://www.easytravel.co.tz/de/safari-driver-guide/ombeni-alfayo/) | BreadcrumbList, ListItem | 3 | dudoso (precio solo en texto) |
| [Shadows of Africa](https://www.shadowsofafrica.com) | operador | sí | – | [muestra](https://www.shadowsofafrica.com/attractions/wildlife/animals-on-safari) | ContactPoint, GeoCoordinates, LocalBusiness, OpeningHoursSpecification, Organization, PostalAddress, SearchAction, WebSite | 4 | dudoso (precio solo en texto) |
| [SANParks](https://www.sanparks.org) | oficial | sin robots.txt | – | – | – | 0 | sin datos |
| [Kenya Wildlife Service](https://www.kws.go.ke) | oficial | sin robots.txt | – | – | – | 0 | no responde |
| [Catai](https://www.catai.es) | agencia española | sí | – | [muestra](https://www.catai.es/viajes/vietnam-camboya) | BreadcrumbList, ListItem | 8 | dudoso (precio solo en texto) |
| [Tuareg Viajes](https://www.tuaregviajes.es) | agencia española | sin robots.txt | – | – | – | 0 | no responde |
| [Kananga](https://www.kananga.com) | agencia española | sí | no lo menciona | – | – | 0 | sin datos |
| [Nuba](https://www.nuba.net) | agencia española | sí | – | – | – | 0 | sin datos |

## Fragmentos de condiciones que mencionan el acceso automatizado

- **TourRadar** (https://www.tourradar.com/terms-conditions): «…, information, software, products or services available on our Platform. &nbsp; Further, it is prohibited to: Use bots, crawlers, scrapers or other automated means (besides authorized use of our API) to access or interact with the Platform or gener…»
- **Go2Africa** (https://www.go2africa.com/website-terms-conditions): «…ty provided on this Website by Users, no person may use or attempt to use any technology or applications (including web crawlers or web spiders) to search, collect or copy content from this Website for any purposes, without the prior written consen…»
- **Discover Africa** (https://www.discoverafrica.com/terms): «…jan horse, worm, keystroke logger, rootkit or other malicious computer software. You must not conduct any systematic or automated data collection activities (including without limitation scraping, data mining, data extraction and data harvesting) on or i…»
- **Thomson Safaris** (https://thomsonsafaris.com/terms-of-service/): «…ice, without Companyâs express prior written consent. Systematically download and store Sites content. Use any robot, spider, Sites search/retrieval application or other manual or automatic device to retrieve, index, âscrape,â âdata mineâ…»
