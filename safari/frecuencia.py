"""Frecuencia de avistamientos de cada especie estrella por mes: de cada mil observaciones de su grupo (mamíferos,
aves, reptiles…) que suben los visitantes a iNaturalist ese mes, cuántas son de esa especie.

Dividir entre las observaciones del grupo corrige que en agosto vaya más gente al Mara. Queda el sesgo de que
se fotografía más un león que un impala, pero es el mismo en todos los meses y parques: sirve para comparar y
para niveles («muy probable», «probable», «posible», «difícil»), no como probabilidad exacta. Cada mes se suma
con sus vecinos para que los meses con pocas observaciones no den saltos; sin bastantes datos, None.
"""

from __future__ import annotations

# observaciones del grupo (con los meses vecinos) por debajo de las cuales no se da cifra
MIN_BASE = 30


def muestra(base: list[int]) -> list[int]:
    """Tamaño de muestra de cada mes: observaciones del grupo con los meses vecinos (la base de frecuencia)."""
    return [sum(base[i] for i in ((m - 1) % 12, m, (m + 1) % 12)) for m in range(12)]


def frecuencia(especie: list[int], base: list[int]) -> list[int | None]:
    """‰ de las observaciones del grupo que son de la especie, mes a mes (enero a diciembre)."""
    salida: list[int | None] = []
    for m in range(12):
        vecinos = ((m - 1) % 12, m, (m + 1) % 12)
        b = sum(base[i] for i in vecinos)
        e = sum(especie[i] for i in vecinos)
        salida.append(round(1000 * e / b) if b >= MIN_BASE else None)
    return salida
