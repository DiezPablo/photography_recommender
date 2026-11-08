"""Calidad del catálogo mundial, sin red: especies estrella solo en su área natural, fuera zoos y parques de
fauna en cautividad, y nivel de cada parque para que el buscador no mezcle el Serengeti con un parque periurbano.

Se aplica al final de `mundo_cli.calcular` y también sobre un `safaris_mundo.json` ya publicado
(`python -m safari --refinar ENTRADA`), así que tiene que ser idempotente.

Niveles:
  A: los destacados del catálogo escrito a mano.
  B: destinos de fauna de verdad: al menos 3 especies estrella vistas (≥ 5 observaciones) o una muy vista (≥ 50).
  C: el resto de espacios protegidos con fauna; la web los oculta por defecto.
"""

from __future__ import annotations

import math
import re
import unicodedata

from safari import limpieza
from safari.catalogo import cargar

MIN_OBS_ESTRELLA = 5
# Especies estrella que viven en más continentes que los de los parques del catálogo donde son estrella (el resto
# se deduce del catálogo: el wapití solo en América, el león en África…). Los «wapitís» de Europa eran ciervos
# comunes mal asignados y los búfalos de Grecia, domésticos.
NATIVOS_EXTRA: dict[str, set[str]] = {
    "Canis lupus": {"Europa", "Asia", "América"},
    "Ursus arctos": {"Europa", "Asia", "América"},
    "Alces alces": {"Europa", "Asia", "América"},
    "Rangifer tarandus": {"Europa", "Asia", "América"},
    "Ursus maritimus": {"Europa", "Asia", "América"},
    "Delphinapterus leucas": {"Europa", "Asia", "América"},
    "Orcinus orca": {"Europa", "Asia", "América", "África", "Oceanía", "Antártida"},
    "Chelonia mydas": {"Asia", "América", "África", "Oceanía"},
    "Eubalaena australis": {"América", "África", "Oceanía"},
    "Mirounga leonina": {"América", "África", "Oceanía", "Antártida"},
    "Panthera leo": {"África", "Asia"},
    "Panthera pardus": {"África", "Asia"},
    "Acinonyx jubatus": {"África", "Asia"},
    "Caracal caracal": {"África", "Asia"},
    "Crocodylus porosus": {"Asia", "Oceanía"},
    "Manta alfredi": {"África", "Asia", "Oceanía"},
    "Cervus canadensis": {"América", "Asia"},
    "Puma concolor": {"América"},
}
# zoos y parques de animales en cautividad que Wikidata clasifica como espacio protegido
CAUTIVIDAD = re.compile(
    r"\bzoo\b|zoológico|wildlife park|safari park|animal park|tierpark|wildpark|walkabout|sanctuary farm|"
    r"parque de fauna|parc animalier|reptile park|naankuse|harnas|rehabilitation|rescue cent|orphanage",
    re.IGNORECASE,
)


# monumentos y paisajes culturales que Wikidata clasifica como espacio protegido: no son destinos de fauna
NO_NATURALEZA = re.compile(
    r"iglesia|sinagoga|church|synagogue|catedral|cathedral|castillo|castle|monasterio|monastery|abad[ií]a|abbey|"
    r"templo|\btemple\b|ruinas|\bruins\b|arqueol|archaeolog|mezquita|mosque|tumba|\btomb|cultura da vinha|"
    r"paisaje cultural|cultural landscape",
    re.IGNORECASE,
)
# especies estrella comunísimas en su región (el koala o el equidna en cualquier bosque de Nueva Gales del Sur): no
# bastan para que un espacio sea un destino de fauna
COMUNES = {"Tachyglossus aculeatus", "Macropus fuliginosus", "Phascolarctos cinereus"}


def puntuacion(n_especies: int, n_estrella: int = 0) -> float:
    """Potencial de fauna: más peso a las especies emblemáticas (lo que se va a ver en un safari) que a la riqueza
    total. No entra el número de observaciones (decisión D2 de la auditoría, 08-11-2026): es la muestra, la confianza
    del dato, y va aparte (`obs`, «o» en el índice); antes sumaba log10(obs) y premiaba los parques más visitados."""
    return round(25 * n_estrella + min(n_especies, 80), 1)


def nativos(curados: list[dict] | None = None) -> dict[str, set[str]]:
    """Continentes donde cada especie estrella es nativa: los de los parques del catálogo + NATIVOS_EXTRA."""
    salida: dict[str, set[str]] = {}
    for c in curados if curados is not None else cargar():
        for especie in c["estrella"]:
            salida.setdefault(especie, set()).add(c["continente"])
    for especie, continentes in NATIVOS_EXTRA.items():
        salida[especie] = salida.get(especie, set()) | continentes
    return salida


def continente(p: dict, paises: dict) -> str | None:
    return (paises.get(p.get("pais") or "") or {}).get("continente") or p.get("continente")


def nivel(p: dict, cientifico: dict[str, str] | None = None) -> str:
    if p.get("destacado"):
        return "A"
    if CAUTIVIDAD.search(p["nombre"]) or NO_NATURALEZA.search(p["nombre"]):
        return "C"
    vistas = [n for k, n in p["estrella"].items() if n >= MIN_OBS_ESTRELLA and (cientifico or {}).get(k) not in COMUNES]
    if len(vistas) >= 3 or (vistas and max(vistas) >= 50):
        return "B"
    return "C"


CONTENEDOR = re.compile(r"biosphere|biosfera|\bgreater\b|transboundary|transfronter|\bmab\b", re.IGNORECASE)
GENERICAS = {
    "parque",
    "nacional",
    "national",
    "park",
    "parc",
    "reserva",
    "reserve",
    "game",
    "nature",
    "natural",
    "de",
    "del",
    "la",
    "el",
    "of",
    "the",
    "du",
    "des",
    "region",
    "area",
    "conservation",
    "wildlife",
    "sanctuary",
    "y",
    "and",
}
DUPLICADO_KM = 150


def _sin_acentos(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn").lower()


def nucleo(nombre: str, paises: set[str]) -> str:
    """Lo que queda del nombre sin palabras genéricas ni países: «W National Park of Benin» y «Parque nacional W de
    Níger» → «w»."""
    t = _sin_acentos(nombre)
    for pais in sorted(paises, key=len, reverse=True):
        t = re.sub(rf"\b{re.escape(pais)}\b", " ", t)
    return " ".join(w for w in re.findall(r"[a-z0-9]+", t) if w not in GENERICAS)


def _km(a: dict, b: dict) -> float:
    dy = (a["lat"] - b["lat"]) * 111.32
    dx = (a["lon"] - b["lon"]) * 111.32 * math.cos(math.radians((a["lat"] + b["lat"]) / 2))
    return math.hypot(dx, dy)


def solapes(parques: list[dict]) -> None:
    """Parques duplicados o que contienen a otro (T12), en el sitio: las reservas de la biosfera y los «Greater…» que
    contienen otro parque del catálogo, y los del mismo nombre sin genéricos ni país a menos de 150 km (las tres
    partes del Parque W), se marcan `solapa` (el id del que se queda) y pasan a nivel C: ya no salen en listas ni en
    el buscador por defecto, pero se encuentran buscando su nombre."""
    parques = [p for p in parques if p.get("id") and p.get("lat") is not None and p.get("lon") is not None]
    paises = {_sin_acentos(p["pais_nombre"]) for p in parques if p.get("pais_nombre")}
    paises |= {"benin", "niger", "burkina faso", "tanzania", "kenya", "south africa", "botswana", "zambia", "zimbabwe"}
    peso = lambda p: (bool(p.get("destacado")), p.get("puntuacion") or 0)
    normales = [p for p in parques if not CONTENEDOR.search(p["nombre"])]
    for p in parques:
        p.pop("solapa", None)
        if CONTENEDOR.search(p["nombre"]) and not p.get("destacado"):
            dentro = [q for q in normales if _km(p, q) <= (p.get("radio_km") or 0) + 10 and q.get("nivel") != "C"]
            if dentro:
                p["solapa"] = max(dentro, key=peso)["id"]
    grupos: dict[str, list[dict]] = {}
    for p in normales:
        if (n := nucleo(p["nombre"], paises)) and not p.get("solapa"):
            grupos.setdefault(n, []).append(p)
    for xs in grupos.values():
        xs.sort(key=peso, reverse=True)
        for p in xs[1:]:
            if not p.get("destacado") and _km(p, xs[0]) <= DUPLICADO_KM:
                p["solapa"] = xs[0]["id"]


CON_QID = re.compile(r"^(.+)-q\d+$")


def ids_limpios(parques: list[dict]) -> None:
    """URLs legibles (T05): «serengeti-ngorongoro-biosphere-reserve-q22671002» → «serengeti-ngorongoro-biosphere-reserve».
    El Q de Wikidata se queda solo si otro parque daría la misma dirección. El id anterior se guarda en
    `id_antiguo` para redirigir las URLs viejas. En el sitio; idempotente."""
    from safari.mundo import slug

    parques = [p for p in parques if p.get("id") and p.get("nombre")]
    usados = {p["id"] for p in parques if not CON_QID.match(p["id"])}
    bases: dict[str, int] = {}
    for p in parques:
        if CON_QID.match(p["id"]):
            b = slug(p["nombre"])
            bases[b] = bases.get(b, 0) + 1
    for p in parques:
        if not CON_QID.match(p["id"]):
            continue
        b = slug(p["nombre"])
        if b and bases[b] == 1 and b not in usados:
            p["id_antiguo"] = p["id"]
            p["id"] = b
            usados.add(b)


def refinar(datos: dict, curados: list[dict] | None = None) -> dict:
    """Devuelve los datos con las especies estrella filtradas, la puntuación recalculada y el nivel de cada parque."""
    areas = nativos(curados)
    cientifico = datos["estrella"]
    for p in datos["parques"]:
        cont = continente(p, datos["paises"])
        if CAUTIVIDAD.search(p["nombre"]) and not p.get("destacado"):
            p["estrella"] = {}
        elif cont:
            p["estrella"] = {k: n for k, n in p["estrella"].items() if cont in areas.get(cientifico.get(k, ""), {cont})}
        n_estrella = sum(1 for n in p["estrella"].values() if n >= MIN_OBS_ESTRELLA)
        p["puntuacion"] = puntuacion(p["n_mamiferos"], n_estrella)
        p["nivel"] = nivel(p, cientifico)
        # la limpieza de OSM también sobre lo ya publicado (el refinado diario no vuelve a pedir nada a OSM)
        if p.get("osm"):
            p["osm"]["alojamientos"] = limpieza.alojamientos(p["osm"]["alojamientos"])
            p["osm"]["operadores"] = limpieza.operadores(p["osm"]["operadores"])
        if p.get("operadores_ciudad"):
            p["operadores_ciudad"]["lista"] = limpieza.operadores(p["operadores_ciudad"]["lista"])
    limpieza.repartir_alojamientos(datos["parques"])
    ids_limpios(datos["parques"])
    solapes(datos["parques"])
    for p in datos["parques"]:
        if p.get("solapa"):
            p["nivel"] = "C"
    return datos
