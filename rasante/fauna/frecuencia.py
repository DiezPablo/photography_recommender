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


# peso, en registros del grupo, del ‰ de todo el año al estimar el de un mes (análisis del 09-11-2026)
K_CONTRACCION = 100


def frecuencia_contraida(especie: list[int], base: list[int], k: int = K_CONTRACCION) -> list[int | None]:
    """El ‰ de cada mes acercado al de todo el año según la muestra del mes: (n·mes + k·año) / (n + k). Con mucha
    muestra manda el mes; con poca, el año. En el año de prueba (2025) ordena mejor que el ‰ del mes solo en los
    cuatro grupos (AUC de las aves: 0,890 frente a 0,882; docs/espana-experimentos.json). Sin muestra suficiente,
    None, como `frecuencia`."""
    mensual = frecuencia(especie, base)
    total = sum(base)
    anual = 1000 * sum(especie) / total if total else 0.0
    tam = muestra(base)
    return [None if f is None else round((tam[i] * f + k * anual) / (tam[i] + k)) for i, f in enumerate(mensual)]
