"""Experimentos con los algoritmos de recomendación de España (análisis del 09-11-2026), medidos como la evaluación
(`evaluacion.py`): con 2015 a N-1 se ordena lo que hay en cada cuadrícula y mes, y con el año N se mira qué se registró.
AUC: probabilidad de que una especie registrada quede por encima de una que no.

Dos preguntas:

1. Dentro de cada grupo, ¿qué estimación del ‰ ordena mejor? La evaluación vio que el ‰ por meses gana al de todo el
   año en las aves pero pierde en mamíferos, reptiles y anfibios (con pocos casos). Modelos:
   - «mensual»: el de la web (‰ del mes con sus vecinos);
   - «anual»: ‰ de todo el año;
   - «mezcla»: la media de los dos;
   - «contraido»: el mensual contraído hacia el anual según la muestra del mes, (n·m + K·a) / (n + K), con K = 100:
     con mucha muestra manda el mes; con poca, el año.

2. Para la lista con todos los grupos juntos («Cerca de mí»), ¿cómo se comparan especies de grupos distintos? El ‰ es
   relativo a su grupo: un conejo con 487 ‰ de 39 registros de mamíferos quedaba por encima de una gaviota con 127 ‰
   de 42 008 registros de aves (en el 84 % de las cuadrículas con dos grupos, la primera no era un ave). Modelos:
   - «grupo»: el de la web (‰ de su grupo, rebajado con n / (n + 100));
   - «absoluto»: parte de todos los registros de la cuadrícula (todos los grupos) que son de la especie;
   - «percentil»: el puesto de la especie dentro de su grupo en la cuadrícula (0 a 1), comparable entre grupos.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from rasante.fauna.evaluacion import MIN_MUESTRA, MIN_PRUEBA, auc
from rasante.fauna.frecuencia import frecuencia, muestra

K = 100
SALIDA = Path("docs/espana-experimentos.json")


def _curvas(especies: dict[int, list[int]], base: list[int]) -> dict[str, dict[int, list[float]]]:
    """Los cuatro modelos dentro del grupo: {modelo: {especie: [12 ‰]}}."""
    total = sum(base) or 1
    tam = muestra(base)
    salida: dict[str, dict[int, list[float]]] = {"mensual": {}, "anual": {}, "mezcla": {}, "contraido": {}}
    for k, m in especies.items():
        mensual = [float(v or 0) for v in frecuencia(m, base)]
        a = 1000 * sum(m) / total
        salida["mensual"][k] = mensual
        salida["anual"][k] = [a] * 12
        salida["mezcla"][k] = [(v + a) / 2 for v in mensual]
        salida["contraido"][k] = [(tam[i] * mensual[i] + K * a) / (tam[i] + K) for i in range(12)]
    return salida


def experimentar(filas: list[dict], anio: int) -> dict:
    entreno: dict[str, dict[int, dict[int, list[int]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(lambda: [0] * 12))
    )
    prueba: dict[tuple[str, int], set[int]] = defaultdict(set)
    prueba_n: dict[tuple[str, int], int] = defaultdict(int)
    prueba_grupo: dict[tuple[str, int, int], int] = defaultdict(int)
    for f in filas:
        if f["anio"] < anio:
            entreno[f["celda"]][f["clase"]][f["especie"]][f["mes"] - 1] += f["n"]
        elif f["anio"] == anio:
            prueba[(f["celda"], f["mes"])].add(f["especie"])
            prueba_n[(f["celda"], f["mes"])] += f["n"]
            prueba_grupo[(f["celda"], f["clase"], f["mes"])] += f["n"]

    por_grupo: dict[int, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    juntos: dict[str, list[float]] = defaultdict(list)
    for celda, clases in entreno.items():
        bases = {c: [sum(m[i] for m in esp.values()) for i in range(12)] for c, esp in clases.items()}
        curvas = {c: _curvas(esp, bases[c]) for c, esp in clases.items()}
        tam = {c: muestra(b) for c, b in bases.items()}
        total_meses = [sum(b[i] for b in bases.values()) for i in range(12)]
        total_vecinos = muestra(total_meses)
        for mes in range(1, 13):
            i = mes - 1
            vistas = prueba[(celda, mes)]
            # 1. dentro de cada grupo
            for c in clases:
                if tam[c][i] < MIN_MUESTRA or prueba_grupo[(celda, c, mes)] < MIN_PRUEBA:
                    continue
                for modelo, cs in curvas[c].items():
                    a = auc({k: v[i] for k, v in cs.items()}, vistas)
                    if a is not None:
                        por_grupo[c][modelo].append(a)
            # 2. todos los grupos juntos, en las cuadrículas con más de un grupo
            if len(clases) < 2 or prueba_n[(celda, mes)] < MIN_PRUEBA or total_vecinos[i] < MIN_MUESTRA:
                continue
            grupo, absoluto, percentil = {}, {}, {}
            for c, esp in clases.items():
                n = tam[c][i]
                mensual = curvas[c]["mensual"]
                orden = sorted(esp, key=lambda k: mensual[k][i])
                for puesto, k in enumerate(orden):
                    v = mensual[k][i]
                    grupo[k] = v * n / (n + 100)
                    vecinos = sum(esp[k][j % 12] for j in (i - 1, i, i + 1))
                    absoluto[k] = vecinos / total_vecinos[i]
                    percentil[k] = (puesto + 1) / len(orden) if v > 0 else 0.0
            for modelo, puntos in (("grupo", grupo), ("absoluto", absoluto), ("percentil", percentil)):
                a = auc(puntos, vistas)
                if a is not None:
                    juntos[modelo].append(a)

    def media(xs: list[float]) -> float:
        return round(sum(xs) / len(xs), 4)

    return {
        "anio": anio,
        "por_grupo": {
            str(c): {**{m: media(xs) for m, xs in ms.items()}, "casos": len(next(iter(ms.values())))}
            for c, ms in por_grupo.items()
        },
        "juntos": {**{m: media(xs) for m, xs in juntos.items()}, "casos": len(juntos.get("grupo", []))},
    }


def main() -> None:
    from rasante.fauna.cuadricula import cargar_filas

    r = cargar_filas(descargar=False)
    if r is None:
        print("Experimentos: no hay filas de GBIF en la caché", flush=True)
        return
    filas, _ = r
    ultimo = max(f["anio"] for f in filas) - 1
    res = experimentar(filas, ultimo)
    print(json.dumps(res, indent=1), flush=True)
    SALIDA.write_text(json.dumps(res, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
