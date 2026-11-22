"""Especies duplicadas por sinónimo (spec 024, punto 1b): GBIF tiene a veces dos claves aceptadas para la misma
especie, la del nombre antiguo y la del nuevo (*Sylvia* y *Curruca melanocephala*), y la cuadrícula las contaba
como dos especies. Aquí se unen en las filas de la descarga, antes de calcular nada: los recuentos se suman.

El mapa, por clave de GBIF, está en recursos/sinonimos_gbif.csv (con los nombres para leerlo y el porqué)."""

from __future__ import annotations

import csv
from functools import cache
from pathlib import Path

SINONIMOS = Path(__file__).resolve().parent.parent / "recursos" / "sinonimos_gbif.csv"


@cache
def mapa() -> dict[int, int]:
    """{clave antigua: clave aceptada}."""
    with SINONIMOS.open(encoding="utf-8") as f:
        return {int(r["clave"]): int(r["aceptada"]) for r in csv.DictReader(f)}


def unir(filas: list[dict], campo: str = "especie") -> list[dict]:
    """Las mismas filas con cada clave antigua cambiada por la aceptada (las de otras especies, tal cual)."""
    m = mapa()
    return [{**f, campo: m[f[campo]]} if f.get(campo) in m else f for f in filas]
