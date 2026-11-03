"""Estacionalidad de cada especie en una celda de 10 km o en una zona (varias celdas), a partir de las filas de la
descarga de GBIF: frecuencia relativa por mes (‰ de las observaciones de su clase, con los meses vecinos, como en
safari.frecuencia), tamaño de muestra y confianza. Sirve también para el backtest (años hasta N-1)."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable

from safari.frecuencia import MIN_BASE, frecuencia, muestra


def confianza(n: int) -> str | None:
    """Mismos umbrales que la web (modelo.ts): alta ≥ 300, media ≥ 100, baja ≥ 30; con menos, sin dato."""
    if n < MIN_BASE:
        return None
    return "alta" if n >= 300 else "media" if n >= 100 else "baja"


def recuentos(
    filas: Iterable[dict], celdas: set[str] | None = None, hasta: int | None = None
) -> tuple[dict[int, list[int]], dict[int, list[int]], dict[int, int]]:
    """(por especie, por clase, clase de cada especie): observaciones por mes en esas celdas y años (< hasta)."""
    especies: dict[int, list[int]] = defaultdict(lambda: [0] * 12)
    clases: dict[int, list[int]] = defaultdict(lambda: [0] * 12)
    clase_de: dict[int, int] = {}
    for f in filas:
        if celdas is not None and f["celda"] not in celdas:
            continue
        if hasta is not None and f["anio"] >= hasta:
            continue
        especies[f["especie"]][f["mes"] - 1] += f["n"]
        clases[f["clase"]][f["mes"] - 1] += f["n"]
        clase_de[f["especie"]] = f["clase"]
    return especies, clases, clase_de


def estacionalidad(filas: Iterable[dict], celdas: set[str] | None = None, hasta: int | None = None) -> dict:
    """{especie: {"frecuencia": [12 ‰ o None], "muestra": [12], "n": total}} en esas celdas."""
    especies, clases, clase_de = recuentos(filas, celdas, hasta)
    salida = {}
    for k, meses in especies.items():
        base = clases[clase_de[k]]
        salida[k] = {"frecuencia": frecuencia(meses, base), "muestra": muestra(base), "n": sum(meses)}
    return salida


def ranking(est: dict, mes: int, max_n: int | None = None) -> list[tuple[int, int, str | None]]:
    """Especies ordenadas por frecuencia en el mes (1-12): [(clave, ‰, confianza)], sin las que no tienen dato."""
    filas = [
        (k, d["frecuencia"][mes - 1], confianza(d["muestra"][mes - 1]))
        for k, d in est.items()
        if d["frecuencia"][mes - 1] is not None and d["frecuencia"][mes - 1] > 0
    ]
    filas.sort(key=lambda x: -x[1])
    return filas[:max_n] if max_n else filas


def backtest(filas: list[dict], celdas: set[str], mes: int, anio: int, top: int = 20) -> dict:
    """Predice con los años anteriores a `anio` y compara con lo observado ese año y mes: cuántas de las
    especies observadas estaban entre las `top` primeras (la métrica de la especificación)."""
    pred = [k for k, _, _ in ranking(estacionalidad(filas, celdas, hasta=anio), mes, top)]
    vistas = {f["especie"] for f in filas if f["celda"] in celdas and f["anio"] == anio and f["mes"] == mes}
    aciertos = len(vistas & set(pred))
    return {
        "observadas": len(vistas),
        "predichas": len(pred),
        "aciertos": aciertos,
        # de las 20 primeras, cuántas se vieron; y de lo visto, qué parte estaba entre las 20
        "precision": round(aciertos / len(pred), 2) if pred else None,
        "cobertura": round(aciertos / len(vistas), 2) if vistas else None,
    }
