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


def puntuacion(n_especies: int, obs: int, n_estrella: int = 0) -> float:
    """Más peso a las especies emblemáticas (lo que se va a ver en un safari) que a la riqueza total."""
    return round(25 * n_estrella + min(n_especies, 80) * math.log10(obs + 10) / 2, 1)


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
        p["puntuacion"] = puntuacion(p["n_mamiferos"], p["obs"], n_estrella)
        p["nivel"] = nivel(p, cientifico)
        # la limpieza de OSM también sobre lo ya publicado (el refinado diario no vuelve a pedir nada a OSM)
        if p.get("osm"):
            p["osm"]["alojamientos"] = limpieza.alojamientos(p["osm"]["alojamientos"])
            p["osm"]["operadores"] = limpieza.operadores(p["osm"]["operadores"])
        if p.get("operadores_ciudad"):
            p["operadores_ciudad"]["lista"] = limpieza.operadores(p["operadores_ciudad"]["lista"])
    limpieza.repartir_alojamientos(datos["parques"])
    return datos
