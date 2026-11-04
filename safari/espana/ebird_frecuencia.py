"""Frecuencia de detección de aves con eBird: en qué parte de las listas de cada cuadrícula de 10 km y mes sale cada
especie («se ve en el 34 % de las listas»). Es más honesta que el ‰ de registros de su grupo: cuenta listas, no
fotos. Sale del conjunto de eBird en GBIF (cada registro lleva su lista en eventID) con dos descargas SQL: listas
por cuadrícula y mes, y listas con cada especie. 2015-2024 para calcular y 2025 para el backtest.

→ espana_ebird.json: {celdas: {celda: {"l": [12 listas], "d": {especie: [12 % o None]}}}} y una sección en el
informe de viabilidad.
"""

from __future__ import annotations

import gzip
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

from safari.espana import gbif_descarga

EBIRD = "4fa7b334-ce0d-4e88-aaae-2e0c138d049e"
DESDE, PRUEBA = 2015, 2025
MIN_LISTAS = 10  # por debajo, el % es ruido: no se da
MAX_ESPECIES_CELDA = 80
CACHE = Path("cache/espana_ebird.json.gz")

CELDA = "GBIF_EEARGCode(10000, decimalLatitude, decimalLongitude, COALESCE(coordinateUncertaintyInMeters, 1000))"
ANIO = f'CASE WHEN "year" = {PRUEBA} THEN 1 ELSE 0 END'
FILTRO = (
    f"datasetKey = '{EBIRD}' AND countryCode = 'ES' AND \"year\" >= {DESDE} AND \"year\" <= {PRUEBA} "
    "AND hasCoordinate = TRUE"
)


def consulta_listas() -> str:
    return (
        f'SELECT {CELDA} AS celda, "month", {ANIO} AS prueba, COUNT(DISTINCT eventId) AS listas '
        f'FROM occurrence WHERE {FILTRO} GROUP BY {CELDA}, "month", {ANIO}'
    )


def consulta_especies() -> str:
    sp = "occurrence.gbif_classification.specieskey"
    return (
        f'SELECT {CELDA} AS celda, {sp} AS specieskey, "month", {ANIO} AS prueba, COUNT(DISTINCT eventId) AS listas '
        f'FROM occurrence WHERE {FILTRO} AND {sp} IS NOT NULL GROUP BY {CELDA}, {sp}, "month", {ANIO}'
    )


def cargar(descargar: bool = True) -> tuple[list[dict], list[dict], dict] | None:
    """Las dos descargas (de la caché si están)."""
    if CACHE.exists():
        d = json.loads(gzip.decompress(CACHE.read_bytes()))
        if d["listas"] and d["especies"]:
            return d["listas"], d["especies"], d["meta"]
    if not descargar:
        return None
    a = gbif_descarga.descargar_bruto(consulta_listas())
    b = gbif_descarga.descargar_bruto(consulta_especies()) if a else None
    if not a or not b or not a[0] or not b[0]:
        print("eBird en GBIF: sin datos (¿faltan credenciales o salió vacía?)", flush=True)
        return None
    meta = {"listas": a[1], "especies": b[1]}
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_bytes(gzip.compress(json.dumps({"listas": a[0], "especies": b[0], "meta": meta}).encode()))
    return a[0], b[0], meta


def frecuencias(listas: list[dict], especies: list[dict], prueba: bool = False) -> dict:
    """{celda: {"l": [12], "d": {especie: [12 % o None]}}} con las filas del periodo de cálculo (o del de prueba)."""
    total: dict[str, list[int]] = defaultdict(lambda: [0] * 12)
    for f in listas:
        if f["celda"] and (f["prueba"] == "1") == prueba:
            total[f["celda"]][int(f["month"]) - 1] += int(f["listas"])
    con: dict[str, dict[str, list[int]]] = defaultdict(lambda: defaultdict(lambda: [0] * 12))
    for f in especies:
        if f["celda"] and (f["prueba"] == "1") == prueba:
            con[f["celda"]][f["specieskey"]][int(f["month"]) - 1] += int(f["listas"])
    salida = {}
    for c, t in total.items():
        sps = sorted(con[c].items(), key=lambda x: -sum(x[1]))[:MAX_ESPECIES_CELDA]
        salida[c] = {
            "l": t,
            "d": {k: [round(100 * v[i] / t[i]) if t[i] >= MIN_LISTAS else None for i in range(12)] for k, v in sps},
        }
    return salida


def backtest(entreno: dict, prueba: dict, celdas: set[str], mes: int, top: int = 20) -> dict:
    """De las especies vistas en el año de prueba en esas celdas y mes, cuántas estaban entre las `top` con más
    detección (media ponderada por listas) en los años anteriores."""
    suma: dict[str, float] = defaultdict(float)
    peso = 0
    for c in celdas:
        x = entreno.get(c)
        if not x or x["l"][mes - 1] < MIN_LISTAS:
            continue
        peso += x["l"][mes - 1]
        for k, v in x["d"].items():
            if v[mes - 1]:
                suma[k] += v[mes - 1] * x["l"][mes - 1]
    ranking = [k for k, _ in sorted(suma.items(), key=lambda x: -x[1])[:top]]
    vistas = {k for c in celdas for k, v in (prueba.get(c) or {"d": {}})["d"].items() if v[mes - 1]}
    aciertos = len(set(ranking) & vistas)
    return {
        "observadas": len(vistas),
        "aciertos": aciertos,
        "precision": round(aciertos / len(ranking), 2) if ranking else 0,
        "listas": peso,
    }


BANDAS = [(0, 5), (5, 10), (10, 20), (20, 40), (40, 60), (60, 101)]


def calibracion(entreno: dict, prueba: dict) -> list[dict]:
    """¿Cuadra el %? Para cada celda, mes y especie con listas en los dos periodos, el % previsto (2015-2024) frente al
    visto en el año de prueba, agrupado por bandas y ponderado por las listas del año de prueba."""
    suma: dict[tuple, list[float]] = {b: [0.0, 0.0, 0.0, 0] for b in BANDAS}  # previsto·w, visto·w, w, n
    for c, x in entreno.items():
        y = prueba.get(c)
        if not y:
            continue
        for m in range(12):
            if x["l"][m] < MIN_LISTAS or y["l"][m] < MIN_LISTAS:
                continue
            w = y["l"][m]
            for k, v in x["d"].items():
                p = v[m]
                if p is None:
                    continue
                visto = (y["d"].get(k) or [0] * 12)[m] or 0
                b = next(b for b in BANDAS if b[0] <= p < b[1])
                t = suma[b]
                t[0] += p * w
                t[1] += visto * w
                t[2] += w
                t[3] += 1
    return [
        {
            "banda": f"{b[0]}-{min(b[1], 100)} %",
            "n": t[3],
            "previsto": round(t[0] / t[2], 1),
            "visto": round(t[1] / t[2], 1),
        }
        for b, t in suma.items()
        if t[2]
    ]


def _rangos(xs: list[float]) -> list[float]:
    orden = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0.0] * len(xs)
    i = 0
    while i < len(orden):
        j = i
        while j + 1 < len(orden) and xs[orden[j + 1]] == xs[orden[i]]:
            j += 1
        for k in range(i, j + 1):
            r[orden[k]] = (i + j) / 2
        i = j + 1
    return r


def spearman(xs: list[float], ys: list[float]) -> float | None:
    """Correlación de rangos (con empates): 1 = mismo orden, 0 = nada que ver."""
    if len(xs) < 5:
        return None
    a, b = _rangos(xs), _rangos(ys)
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b, strict=True))
    va = sum((x - ma) ** 2 for x in a) ** 0.5
    vb = sum((y - mb) ** 2 for y in b) ** 0.5
    return round(cov / (va * vb), 2) if va and vb else None


def _ponderado(datos: dict, celdas: set[str], mes: int) -> dict[str, float]:
    suma: dict[str, float] = defaultdict(float)
    peso = 0
    for c in celdas:
        x = datos.get(c)
        if not x or x["l"][mes - 1] < MIN_LISTAS:
            continue
        peso += x["l"][mes - 1]
        for k, v in x["d"].items():
            if v[mes - 1]:
                suma[k] += v[mes - 1] * x["l"][mes - 1]
    return {k: v / peso for k, v in suma.items()} if peso else {}


def comparar(entreno: dict, prueba: dict, por_mil: dict[str, float], celdas: set[str], mes: int) -> dict:
    """Orden de las aves en la zona y mes según la detección de eBird (2015-2024) y según el ‰ de GBIF, frente a la
    detección vista en el año de prueba: correlación de rangos de cada método sobre las mismas especies."""
    previsto = _ponderado(entreno, celdas, mes)
    visto = _ponderado(prueba, celdas, mes)
    especies = sorted(set(previsto) | set(visto))
    obs = [visto.get(k, 0.0) for k in especies]
    return {
        "especies": len(especies),
        "ebird": spearman([previsto.get(k, 0.0) for k in especies], obs),
        "gbif": spearman([por_mil.get(k, 0.0) for k in especies], obs),
    }


def main(salida: Path = Path("public/datos/espana_ebird.json"), descargar: bool = True) -> None:
    from safari.comun.ficheros import escribir_json
    from safari.espana.zonas import ZONAS, celdas

    r = cargar(descargar)
    if r is None:
        return
    listas, especies, meta = r
    entreno = frecuencias(listas, especies)
    prueba = frecuencias(listas, especies, prueba=True)
    escribir_json(
        salida,
        {
            "generado": date.today().isoformat(),
            "fuente": {
                "meta": meta,
                "cita": f"eBird en GBIF.org, descargas {meta['listas'].get('doi')} y {meta['especies'].get('doi')}",
                "periodo": f"{DESDE}-{PRUEBA - 1}",
            },
            "celdas": entreno,
        },
    )
    print(f"{salida}: {len(entreno)} celdas con listas de eBird", flush=True)
    # el ‰ de GBIF (método anterior) para comparar, si la descarga de GBIF está en la caché
    from safari.espana import cli as espana_cli
    from safari.espana.estacionalidad import estacionalidad

    gbif = espana_cli.cargar_filas(False)
    aves_gbif = [f for f in gbif[0] if f["clase"] == 212] if gbif else []
    informe = Path("docs/espana-viabilidad.md")
    lineas = [
        "",
        "## Frecuencia de detección de eBird (aves)",
        "",
        f"En qué parte de las listas de eBird de cada cuadrícula y mes sale cada especie ({DESDE}-{PRUEBA - 1}). "
        f"Backtest {PRUEBA}: de las aves vistas en {PRUEBA}, cuántas estaban entre las 20 con más detección.",
        "",
    ]
    for z in ZONAS:
        bt = backtest(entreno, prueba, set(celdas(z)), z["mes_prueba"])
        lineas.append(
            f"- {z['nombre']} (mes {z['mes_prueba']}): {bt['aciertos']} de 20 entre {bt['observadas']} vistas "
            f"(precisión {bt['precision']}; {bt['listas']} listas de entreno)."
        )
    lineas += [
        "",
        f"Calibración en toda España: cuando dice «X % de las listas» ({DESDE}-{PRUEBA - 1}), qué % se vio en "
        f"{PRUEBA} (celdas y meses con al menos {MIN_LISTAS} listas en los dos periodos):",
        "",
        "| Previsto | Casos | % previsto (media) | % visto en " + str(PRUEBA) + " |",
        "|---|---|---|---|",
        *[f"| {x['banda']} | {x['n']} | {x['previsto']} | {x['visto']} |" for x in calibracion(entreno, prueba)],
        "",
        f"Orden de las aves en cada zona frente a la detección vista en {PRUEBA} (correlación de rangos de Spearman; "
        "1 = mismo orden): detección de eBird frente al ‰ de su grupo en GBIF.",
        "",
    ]
    for z in ZONAS:
        cs = set(celdas(z))
        mes = z["mes_prueba"]
        est = estacionalidad(aves_gbif, cs, hasta=PRUEBA) if aves_gbif else {}
        por_mil = {str(k): (d["frecuencia"][mes - 1] or 0) for k, d in est.items()}
        c = comparar(entreno, prueba, por_mil, cs, mes)
        lineas.append(
            f"- {z['nombre']} (mes {mes}, {c['especies']} especies): eBird {c['ebird']}, GBIF ‰ "
            f"{c['gbif'] if aves_gbif else 'sin datos'}."
        )
    if informe.exists():
        texto = informe.read_text(encoding="utf-8").split("\n## Frecuencia de detección de eBird")[0].rstrip()
        informe.write_text(texto + "\n" + "\n".join(lineas) + "\n", encoding="utf-8")
