"""Huella de cada parque para contar lo que se registra en él (decisión D3 de la auditoría, 08-11-2026).

Antes GBIF contaba en una caja (rectángulo de latitud y longitud) e iNaturalist en un círculo: dos zonas distintas
para el mismo parque. Ahora las dos fuentes usan la misma: el contorno real del parque si Wikidata lo tiene (P3896,
un mapa en Commons) y, si no, el mismo círculo de `radio_km`. El tope de 40 km del radio se queda para los círculos
(protege de superficies mal escritas en Wikidata); con contorno no hay tope, porque la forma es la real.

GBIF admite `geometry` en WKT, en sentido antihorario y con un tamaño limitado: los contornos se simplifican a
`MAX_PUNTOS` vértices.
"""

from __future__ import annotations

import json
import math
from itertools import pairwise
from urllib.parse import unquote_plus

from safari import commons

MAX_PUNTOS = 80
LADOS_CIRCULO = 32
LOTE_COMMONS = 50


def _anillo_wkt(puntos: list[tuple[float, float]]) -> str:
    """[(lon, lat), …] cerrado → «lon lat, lon lat, …» con 4 decimales (unos 10 m)."""
    return ", ".join(f"{lon:.4f} {lat:.4f}" for lon, lat in puntos)


def _area_firmada(anillo: list[tuple[float, float]]) -> float:
    """Positiva si el anillo va en sentido antihorario (fórmula del área de Gauss, en grados)."""
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in pairwise(anillo)) / 2


def circulo_wkt(lat: float, lon: float, r_km: float, lados: int = LADOS_CIRCULO) -> str | None:
    """El círculo de radio `r_km` como polígono WKT antihorario; None si cruza el antimeridiano o un polo (entonces
    se usa la caja de antes)."""
    dlat = r_km / 111.0
    dlon = r_km / (111.0 * max(0.05, math.cos(math.radians(lat))))
    if abs(lat) + dlat >= 89.9 or abs(lon) + dlon >= 180:
        return None
    puntos = [
        (lon + dlon * math.cos(2 * math.pi * i / lados), lat + dlat * math.sin(2 * math.pi * i / lados))
        for i in range(lados)
    ]
    puntos.append(puntos[0])
    return f"POLYGON(({_anillo_wkt(puntos)}))"


def _simplificar(anillo: list[tuple[float, float]], max_puntos: int) -> list[tuple[float, float]]:
    """Se queda con un vértice de cada k (los extremos incluidos) hasta tener como mucho `max_puntos`."""
    abierto = anillo[:-1] if anillo[0] == anillo[-1] else anillo
    if len(abierto) <= max_puntos - 1:
        return [*abierto, abierto[0]]
    paso = math.ceil(len(abierto) / (max_puntos - 1))
    elegidos = abierto[::paso]
    return [*elegidos, elegidos[0]]


def _anillos_exteriores(geo: dict) -> list[list[tuple[float, float]]]:
    """Los anillos exteriores de los polígonos de un GeoJSON (FeatureCollection, Feature o geometría)."""
    tipo = geo.get("type")
    if tipo == "FeatureCollection":
        return [a for f in geo.get("features", []) for a in _anillos_exteriores(f)]
    if tipo == "Feature":
        return _anillos_exteriores(geo.get("geometry") or {})
    if tipo == "Polygon":
        return [[(float(x), float(y)) for x, y, *_ in geo["coordinates"][0]]] if geo.get("coordinates") else []
    if tipo == "MultiPolygon":
        return [[(float(x), float(y)) for x, y, *_ in p[0]] for p in geo.get("coordinates", []) if p]
    if tipo == "GeometryCollection":
        return [a for g in geo.get("geometries", []) for a in _anillos_exteriores(g)]
    return []


def contorno_wkt(geo: dict, max_puntos: int = MAX_PUNTOS) -> str | None:
    """El polígono más grande de un GeoJSON, simplificado y antihorario, en WKT; None si no hay ninguno útil."""
    anillos = [a for a in _anillos_exteriores(geo) if len(a) >= 4]
    if not anillos:
        return None
    mayor = max(anillos, key=lambda a: abs(_area_firmada([*a, a[0]] if a[0] != a[-1] else a)))
    anillo = _simplificar(mayor, max_puntos)
    if len(anillo) < 4:
        return None
    if any(abs(lon) > 180 or abs(lat) > 90 for lon, lat in anillo):
        return None
    if _area_firmada(anillo) < 0:
        anillo = anillo[::-1]
    return f"POLYGON(({_anillo_wkt(anillo)}))"


def titulo_commons(url: str) -> str | None:
    """«http://commons.wikimedia.org/data/main/Data:Parque.map» → «Data:Parque.map»."""
    # Wikidata escribe los espacios como «+» («Data:Anamalai+Tiger+Reserve.map»)
    texto = unquote_plus(url)
    i = texto.find("Data:")
    return texto[i:].replace("_", " ") if i >= 0 else None


def contornos(urls: list[str]) -> dict[str, str]:
    """Contorno en WKT de cada mapa de Commons (P3896), por URL; los que no se pueden leer, fuera."""
    titulos = {t: u for u in urls if (t := titulo_commons(u))}
    salida: dict[str, str] = {}
    lista = sorted(titulos)
    for i in range(0, len(lista), LOTE_COMMONS):
        d = commons.consultar(
            {
                "prop": "revisions",
                "rvprop": "content",
                "rvslots": "main",
                "titles": "|".join(lista[i : i + LOTE_COMMONS]),
            }
        )
        for pagina in d.get("query", {}).get("pages", []):
            try:
                texto = pagina["revisions"][0]["slots"]["main"]["content"]
                wkt = contorno_wkt(json.loads(texto).get("data") or {})
            except (KeyError, IndexError, ValueError, TypeError):
                continue
            if wkt and pagina.get("title") in titulos:
                salida[titulos[pagina["title"]]] = wkt
    return salida


def anillos_de_relacion(rel: dict) -> list[list[tuple[float, float]]]:
    """Los anillos cerrados de una relación de OSM con su geometría (`out geom`): une los tramos exteriores por sus
    extremos, dándoles la vuelta si hace falta."""
    tramos = [
        [(round(p["lon"], 6), round(p["lat"], 6)) for p in m["geometry"]]
        for m in rel.get("members", [])
        if m.get("type") == "way" and m.get("role", "outer") in ("outer", "") and len(m.get("geometry") or []) >= 2
    ]
    anillos = []
    while tramos:
        anillo = tramos.pop(0)
        while anillo[0] != anillo[-1]:
            for i, t in enumerate(tramos):
                if t[0] == anillo[-1]:
                    anillo += t[1:]
                elif t[-1] == anillo[-1]:
                    anillo += t[-2::-1]
                else:
                    continue
                tramos.pop(i)
                break
            else:
                break  # no cierra: se descarta
        if anillo[0] == anillo[-1] and len(anillo) >= 4:
            anillos.append(anillo)
    return anillos


def contornos_osm(qids: list[str], lote: int = 20) -> dict[str, str]:
    """Contorno en WKT de los espacios protegidos de OSM con la etiqueta wikidata de cada parque (relaciones de tipo
    boundary o multipolygon), por tandas, con caché por parque («» si no tiene). Sin tiempo, solo lo guardado."""
    from safari import mundo, practico

    salida: dict[str, str] = {}
    pendientes = []
    for q in qids:
        guardado = practico.CACHE.leer(f"osm-contorno:{q}")
        if guardado is None:
            pendientes.append(q)
        elif guardado:
            salida[q] = guardado
    for i in range(0, len(pendientes), lote):
        if mundo.sin_tiempo():
            break
        tanda = pendientes[i : i + lote]
        consulta = (
            "[out:json][timeout:180];"
            f'rel["wikidata"~"^({"|".join(tanda)})$"]["type"~"^(boundary|multipolygon)$"];out geom;'
        )
        datos = practico.overpass(consulta, timeout=200)
        if datos is None:
            continue
        hallados: dict[str, str] = {}
        for rel in datos.get("elements", []):
            q = rel.get("tags", {}).get("wikidata")
            anillos = anillos_de_relacion(rel)
            if q in tanda and anillos and q not in hallados:
                wkt = contorno_wkt(
                    {"type": "Polygon", "coordinates": [max(anillos, key=lambda a: abs(_area_firmada(a)))]}
                )
                if wkt:
                    hallados[q] = wkt
        for q in tanda:
            practico.CACHE.guardar(f"osm-contorno:{q}", hallados.get(q, ""))
            if q in hallados:
                salida[q] = hallados[q]
    return salida
