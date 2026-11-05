"""Lo que rodea a cada parque: ficha de Wikidata y alojamientos de OSM (el clima, en safari.practico)."""

from __future__ import annotations

import re
import time
from urllib.parse import unquote

import requests

from safari import limpieza, practico
from safari.commons import consultar, texto_plano
from safari.comun.cache import CacheJson
from safari.comun.red import sesion
from safari.practico import url_web

CACHE = CacheJson(prefijo="safaris_", max_edad_s=25 * 86400)
_SESION = sesion()
WIKIDATA = "https://query.wikidata.org/sparql"
OVERPASS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
)
ALOJAMIENTO = {
    "hotel": "hotel",
    "guest_house": "casa de huéspedes",
    "camp_site": "campamento",
    "chalet": "cabaña",
    "hostel": "albergue",
    "motel": "motel",
    "wilderness_hut": "refugio",
    "apartment": "apartamento",
}


def _cache(clave: str, pedir):
    guardado = CACHE.leer(clave)
    if guardado is not None:
        return guardado
    datos = pedir()
    CACHE.guardar(clave, datos)
    return datos


def wikidata(qids: list[str]) -> dict[str, dict]:
    """Foto, web oficial y artículo de Wikipedia en español de cada parque."""
    valores = " ".join(f"wd:{q}" for q in qids)
    consulta = f"""SELECT ?x ?img ?web ?es WHERE {{
      VALUES ?x {{ {valores} }}
      OPTIONAL {{ ?x wdt:P18 ?img }}
      OPTIONAL {{ ?x wdt:P856 ?web }}
      OPTIONAL {{ ?es schema:about ?x; schema:isPartOf <https://es.wikipedia.org/> }}
    }}"""

    def pedir():
        r = _SESION.get(WIKIDATA, params={"query": consulta, "format": "json"}, timeout=120)
        r.raise_for_status()
        return r.json()["results"]["bindings"]

    salida: dict[str, dict] = {}
    for b in _cache("wd:" + consulta, pedir):
        q = b["x"]["value"].rsplit("/", 1)[1]
        s = salida.setdefault(q, {})
        for campo in ("img", "web", "es"):
            if campo in b and campo not in s:  # si hay varios valores, el primero
                s[campo] = b[campo]["value"]
    return salida


def fotos_commons(urls: list[str]) -> dict[str, dict]:
    """Miniatura de 960 px, autor y licencia de cada imagen de Wikidata (URL Special:FilePath)."""
    titulos = {u: "File:" + unquote(u.rsplit("/", 1)[1]) for u in urls}
    lista = sorted(set(titulos.values()))
    info: dict[str, dict] = {}
    for i in range(0, len(lista), 50):
        d = consultar(
            {
                "titles": "|".join(lista[i : i + 50]),
                "prop": "imageinfo",
                "iiprop": "url|user|extmetadata",
                "iiurlwidth": 960,
                "iiextmetadatafilter": "Artist|LicenseShortName",
            }
        )
        alias = {n["to"]: n["from"] for n in d.get("query", {}).get("normalized", [])}
        for p in d.get("query", {}).get("pages", []):
            ii = (p.get("imageinfo") or [None])[0]
            if not ii or not ii.get("thumburl"):
                continue
            meta = ii.get("extmetadata", {})
            info[alias.get(p["title"], p["title"])] = {
                "url": ii["thumburl"].split("?")[0],
                "web": ii.get("descriptionurl"),
                "autor": texto_plano(meta.get("Artist", {}).get("value")) or ii.get("user"),
                "licencia": texto_plano(meta.get("LicenseShortName", {}).get("value")),
            }
    return {u: info[t] for u, t in titulos.items() if t in info}


def _nombre_util(nombre: str) -> bool:
    """Fuera los códigos de acampada de travesía («12», «4R1 - Ribbon Lake West»): no son alojamientos a reservar."""
    codigo = re.match(r"^([A-Z0-9]{1,4})(\s+-\s+.*)?$", nombre.strip())
    return not (codigo and any(c.isdigit() for c in codigo.group(1)))


def alojamientos(lat: float, lon: float, radio_km: float, maximo: int = 30) -> list[dict]:
    """Lodges, campamentos y hoteles con nombre de OSM dentro del parque o a menos de 15 km de su zona."""
    tipos = "|".join(ALOJAMIENTO)
    radio_m = int((radio_km + 15) * 1000)
    consulta = (
        f'[out:json][timeout:120];nwr["tourism"~"^({tipos})$"]["name"](around:{radio_m},{lat},{lon});out center tags;'
    )

    def pedir():
        time.sleep(3)  # una consulta tras otra: los espejos públicos piden no saturarlos
        for intento in range(3):
            for url in OVERPASS:
                try:
                    r = _SESION.post(url, data={"data": consulta}, timeout=90)
                    r.raise_for_status()
                    return r.json()
                except (requests.RequestException, ValueError):
                    continue
            time.sleep(20 * (intento + 1))
        raise requests.ConnectionError("Overpass no responde")

    datos = _cache("osm:" + consulta, pedir)
    salida = []
    for e in datos.get("elements", []):
        t = e.get("tags", {})
        if not _nombre_util(t["name"]):
            continue
        la = e.get("lat") or e.get("center", {}).get("lat")
        lo = e.get("lon") or e.get("center", {}).get("lon")
        if la is None:
            continue
        salida.append(
            {
                "nombre": t.get("name:es") or t.get("name:en") or t["name"],
                "tipo": ALOJAMIENTO.get(t.get("tourism"), "alojamiento"),
                "lat": round(la, 5),
                "lon": round(lo, 5),
                "web": url_web(t.get("website") or t.get("contact:website") or t.get("url")),
                "telefono": t.get("phone") or t.get("contact:phone"),
                "estrellas": t.get("stars"),
                "osm": f"{e['type']}/{e['id']}",
                "km": round(practico.km((lat, lon), (la, lo))),
            }
        )
    salida = limpieza.alojamientos(salida)
    # primero los que tienen web (se puede reservar directamente), luego por nombre
    salida.sort(key=lambda a: (a["web"] is None, a["nombre"].lower()))
    return salida[:maximo]
