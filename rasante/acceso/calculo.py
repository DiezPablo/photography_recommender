"""El aparcamiento más cercano a cada lugar y cuánto se tarda andando, con un índice de celdas para no comparar
todos con todos."""

from __future__ import annotations

import math
from collections import defaultdict

# más lejos ya no es «el aparcamiento del sitio»
RADIO_KM = 2.0
CELDA = 0.05  # grados
# el camino real da más vueltas que la línea recta, y se anda a unos 4,5 km/h por campo
TORTUOSIDAD = 1.3
KMH = 4.5


def km(a: tuple[float, float], b: tuple[float, float]) -> float:
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def minutos_andando(metros: float) -> int:
    """Estimación en línea recta corregida por las vueltas del camino; al menos un minuto."""
    return max(1, round(metros / 1000 * TORTUOSIDAD / KMH * 60))


class Indice:
    def __init__(self, puntos: list[dict]):
        self.celdas: dict[tuple[int, int], list[dict]] = defaultdict(list)
        for p in puntos:
            self.celdas[(int(p["lat"] // CELDA), int(p["lon"] // CELDA))].append(p)

    def mas_cercano(self, lat: float, lon: float, radio_km: float = RADIO_KM) -> tuple[float, dict] | None:
        alcance = math.ceil(radio_km / (111 * CELDA * math.cos(math.radians(lat)))) + 1
        ci, cj = int(lat // CELDA), int(lon // CELDA)
        mejor: tuple[float, dict] | None = None
        for i in range(ci - alcance, ci + alcance + 1):
            for j in range(cj - alcance, cj + alcance + 1):
                for p in self.celdas.get((i, j), ()):
                    d = km((lat, lon), (p["lat"], p["lon"]))
                    if d <= radio_km and (mejor is None or d < mejor[0]):
                        mejor = (d, p)
        return mejor


def acceso(ind: Indice, lat: float, lon: float) -> dict | None:
    """{m, min, lat, lon[, nombre]} del aparcamiento más cercano, o None si no hay ninguno a menos de 2 km."""
    c = ind.mas_cercano(lat, lon)
    if not c:
        return None
    d, p = c
    m = round(d * 1000 / 10) * 10  # a la decena: la posición del aparcamiento en OSM no da para más
    salida = {"m": m, "min": minutos_andando(m), "lat": p["lat"], "lon": p["lon"]}
    if p.get("nombre"):
        salida["nombre"] = p["nombre"]
    return salida


def calcular(aparcamientos: list[dict], lugares: dict[str, list[dict]]) -> dict:
    """{catalogo: {id: acceso}} para cada catálogo ({"luz": [{id, lat, lon}], "fauna": [...]})."""
    ind = Indice(aparcamientos)
    return {
        catalogo: {x["id"]: a for x in xs if (a := acceso(ind, x["lat"], x["lon"]))} for catalogo, xs in lugares.items()
    }
