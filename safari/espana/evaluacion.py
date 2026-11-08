"""Evaluación de la estacionalidad de España (decisión D10 de la auditoría, 08-11-2026).

El backtest anterior medía cuántas de las 20 especies más frecuentes se veían al año siguiente: daba 1,0 en todas
las zonas y no distinguía un buen modelo de uno malo. Esta evaluación, en cambio:

- para cada cuadrícula de 10 km, grupo (aves, mamíferos…) y mes, ordena las especies registradas allí con los años
  anteriores a `anio` según su ‰ en ese mes (el modelo de la web, `safari.frecuencia`);
- mira cuáles se registraron de verdad en `anio` ese mes;
- calcula el AUC: la probabilidad de que una especie registrada quede por encima de una que no (0,5 es el azar);
- y lo compara con un modelo ingenuo sin estacionalidad (el ‰ de todo el año): si el modelo por meses no gana al
  ingenuo, la estacionalidad no aporta.

Solo cuentan las combinaciones con muestra suficiente (`MIN_MUESTRA` registros del grupo en el entreno ese mes con
los vecinos y `MIN_PRUEBA` en el año de prueba). `comparar` dice si el resultado empeora más de un 5 % respecto a la
línea base guardada (docs/espana-evaluacion-base.json): entonces el workflow no publica.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from safari.frecuencia import frecuencia, muestra

MIN_MUESTRA = 100
MIN_PRUEBA = 20
UMBRAL = 0.05
BASE = Path("docs/espana-evaluacion-base.json")


def auc(puntos: dict[int, float], positivos: set[int]) -> float | None:
    """AUC por rangos (Mann-Whitney), con empates a medias; None si no hay positivos o negativos."""
    n_pos = sum(1 for k in puntos if k in positivos)
    n_neg = len(puntos) - n_pos
    if not n_pos or not n_neg:
        return None
    orden = sorted(puntos.items(), key=lambda x: x[1])
    rangos: dict[int, float] = {}
    i = 0
    while i < len(orden):
        j = i
        while j + 1 < len(orden) and orden[j + 1][1] == orden[i][1]:
            j += 1
        for k, _ in orden[i : j + 1]:
            rangos[k] = (i + j) / 2 + 1
        i = j + 1
    suma = sum(r for k, r in rangos.items() if k in positivos)
    return (suma - n_pos * (n_pos + 1) / 2) / (n_pos * n_neg)


def evaluar(filas: list[dict], anio: int) -> dict:
    """{clase: {"auc": media, "auc_ingenuo": media, "casos": n}} con el entreno hasta `anio` - 1 y la prueba en `anio`."""
    entreno: dict[tuple[str, int], dict[int, list[int]]] = defaultdict(lambda: defaultdict(lambda: [0] * 12))
    prueba: dict[tuple[str, int, int], set[int]] = defaultdict(set)
    prueba_n: dict[tuple[str, int, int], int] = defaultdict(int)
    for f in filas:
        if f["anio"] < anio:
            entreno[(f["celda"], f["clase"])][f["especie"]][f["mes"] - 1] += f["n"]
        elif f["anio"] == anio:
            prueba[(f["celda"], f["clase"], f["mes"])].add(f["especie"])
            prueba_n[(f["celda"], f["clase"], f["mes"])] += f["n"]
    resultados: dict[int, list[tuple[float, float]]] = defaultdict(list)
    for (celda, clase), especies in entreno.items():
        base = [sum(m[i] for m in especies.values()) for i in range(12)]
        total = sum(base)
        tamano = muestra(base)
        meses = [m for m in range(1, 13) if tamano[m - 1] >= MIN_MUESTRA and prueba_n[(celda, clase, m)] >= MIN_PRUEBA]
        if not meses:
            continue
        # una vez por cuadrícula: la curva de cada especie y su ‰ de todo el año
        curvas = {k: frecuencia(m, base) for k, m in especies.items()}
        ingenuo = {k: sum(m) / total for k, m in especies.items()}
        for mes in meses:
            vistas = prueba[(celda, clase, mes)]
            estacional = {k: float(c[mes - 1] or 0) for k, c in curvas.items()}
            a, b = auc(estacional, vistas), auc(ingenuo, vistas)
            if a is not None and b is not None:
                resultados[clase].append((a, b))
    return {
        str(clase): {
            "auc": round(sum(a for a, _ in xs) / len(xs), 4),
            "auc_ingenuo": round(sum(b for _, b in xs) / len(xs), 4),
            "casos": len(xs),
        }
        for clase, xs in resultados.items()
    }


def comparar(actual: dict, base: dict, umbral: float = UMBRAL) -> list[str]:
    """Los grupos cuyo AUC empeora más de `umbral` (5 %) respecto a la línea base: vacía si todo está bien."""
    problemas = []
    for clase, b in base.items():
        a = actual.get(clase)
        if a is None:
            problemas.append(f"clase {clase}: sin resultado (la línea base tenía {b['casos']} casos)")
        elif a["auc"] < b["auc"] * (1 - umbral):
            problemas.append(f"clase {clase}: AUC {a['auc']} frente a {b['auc']} de la línea base (más de un 5 % peor)")
    return problemas


def leer_base(ruta: Path = BASE) -> dict | None:
    return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else None
