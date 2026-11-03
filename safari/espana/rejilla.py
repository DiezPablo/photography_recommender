"""Cuadrícula europea de referencia (EEA, ETRS89-LAEA, EPSG:3035): el código de la celda donde cae un punto.

Es la misma que usa GBIF en sus descargas SQL (GBIF_EEARGCode), así que se puede cruzar lo que nos devuelva con
un punto o un radio. Proyección acimutal equivalente de Lambert sobre el elipsoide GRS80 (fórmulas de Snyder,
«Map Projections: A Working Manual», 1987, p. 187), centrada en 52° N 10° E con falso este 4 321 000 m y falso
norte 3 210 000 m. Sin dependencias: comprobada contra pyproj a menos de un metro.
"""

from __future__ import annotations

import math

A = 6378137.0
F = 1 / 298.257222101
E2 = 2 * F - F * F
E = math.sqrt(E2)
LAT0, LON0 = math.radians(52.0), math.radians(10.0)
FE, FN = 4321000.0, 3210000.0


def _q(phi: float) -> float:
    s = math.sin(phi)
    return (1 - E2) * (s / (1 - E2 * s * s) - (1 / (2 * E)) * math.log((1 - E * s) / (1 + E * s)))


_QP = _q(math.pi / 2)
_RQ = A * math.sqrt(_QP / 2)
_B0 = math.asin(_q(LAT0) / _QP)
_D = A * (math.cos(LAT0) / math.sqrt(1 - E2 * math.sin(LAT0) ** 2)) / (_RQ * math.cos(_B0))


def laea(lat: float, lon: float) -> tuple[float, float]:
    """(este, norte) en metros de EPSG:3035."""
    phi, lam = math.radians(lat), math.radians(lon)
    beta = math.asin(_q(phi) / _QP)
    dl = lam - LON0
    b = _RQ * math.sqrt(2 / (1 + math.sin(_B0) * math.sin(beta) + math.cos(_B0) * math.cos(beta) * math.cos(dl)))
    este = FE + b * _D * math.cos(beta) * math.sin(dl)
    norte = FN + (b / _D) * (math.cos(_B0) * math.sin(beta) - math.sin(_B0) * math.cos(beta) * math.cos(dl))
    return este, norte


def celda(lat: float, lon: float, metros: int = 10000) -> str:
    """«10kmE315N202» para Madrid: el formato de GBIF_EEARGCode."""
    este, norte = laea(lat, lon)
    etiqueta = f"{metros // 1000}km" if metros >= 1000 else f"{metros}m"
    return f"{etiqueta}E{int(este // metros)}N{int(norte // metros)}"


def celdas_en_radio(lat: float, lon: float, radio_km: float, metros: int = 10000) -> list[str]:
    """Celdas que tocan el círculo de radio_km alrededor del punto (en el plano LAEA, que conserva las superficies
    y casi las distancias a esta escala); con radio 0, solo la del punto."""
    este, norte = laea(lat, lon)
    r = radio_km * 1000
    ie, in_ = int(este // metros), int(norte // metros)
    paso = math.ceil(r / metros) + 1
    etiqueta = f"{metros // 1000}km" if metros >= 1000 else f"{metros}m"
    salida = []
    for i in range(ie - paso, ie + paso + 1):
        for j in range(in_ - paso, in_ + paso + 1):
            # distancia del punto al rectángulo de la celda
            dx = max(i * metros - este, 0, este - (i + 1) * metros)
            dy = max(j * metros - norte, 0, norte - (j + 1) * metros)
            if math.hypot(dx, dy) <= r:
                salida.append(f"{etiqueta}E{i}N{j}")
    return salida


def bloque(codigo: str) -> str:
    """Celda de 10 km → su bloque de 100 km («10kmE315N202» → «100kmE31N20»): cómo se trocea lo publicado."""
    e, n = codigo.split("E")[1].split("N")
    return f"100kmE{int(e) // 10}N{int(n) // 10}"
