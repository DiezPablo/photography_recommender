"""Fauna en España: python -m safari --espana [--sin-descarga].

1. Descarga de GBIF (si hay GBIF_USUARIO y GBIF_CLAVE): recuentos por celda de 10 km, especie, año y mes; las filas
   se guardan en cache/espana_filas.json.gz para no repetirla (tarda de minutos a horas en los servidores de GBIF).
2. espana.json: por celda, la frecuencia por mes de sus especies más vistas y la muestra de cada clase; nombres en
   español de GBIF.
3. docs/espana-viabilidad.md: para las zonas de prueba (Doñana, Gredos, Picos, Gallocanta), observaciones por mes,
   especies del mes de prueba con su confianza y el backtest del último año completo.
"""

from __future__ import annotations

import gzip
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

from safari.comun.ficheros import escribir_json
from safari.espana import gbif_descarga, nombres
from safari.espana.estacionalidad import backtest, estacionalidad, ranking
from safari.espana.zonas import ZONAS, celdas
from safari.frecuencia import muestra

FILAS = Path("cache/espana_filas.json.gz")
# especies por celda y grupo: con un tope común las aves (muchos más registros) se llevaban todos los puestos
MAX_ESPECIES_CELDA = {212: 80}
MAX_OTRAS_CLASES = 25
GRUPO_ES = {"Aves": "Aves", "Mammalia": "Mamíferos", "Reptilia": "Reptiles", "Amphibia": "Anfibios"}
CLASE_NOMBRE = {v: k for k, v in gbif_descarga.CLASES.items()}
MESES_ES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
]


def cargar_filas(descargar: bool) -> tuple[list[dict], dict] | None:
    if FILAS.exists():
        d = json.loads(gzip.decompress(FILAS.read_bytes()))
        if d["filas"]:
            return d["filas"], d["meta"]
        FILAS.unlink()  # una descarga vacía no se reutiliza
    if not descargar:
        return None
    r = gbif_descarga.descargar()
    if r is None:
        return None
    filas, meta = r
    if not filas:
        print(f"GBIF: la descarga {meta.get('clave')} salió vacía (0 filas); no se guarda", flush=True)
        return None
    FILAS.parent.mkdir(parents=True, exist_ok=True)
    FILAS.write_bytes(gzip.compress(json.dumps({"filas": filas, "meta": meta}).encode()))
    return filas, meta


def por_celda(filas: list[dict]) -> dict:
    """{celda: {"m": {clase: [12 muestra]}, "e": {especie: [12 ‰]}}} con las especies más vistas de cada celda."""
    grupos: dict[str, list[dict]] = defaultdict(list)
    for f in filas:
        # GBIF deja sin código las observaciones cuya incertidumbre no cabe en una celda: no son de ningún sitio
        if f["celda"]:
            grupos[f["celda"]].append(f)
    salida = {}
    for c, fs in grupos.items():
        est = estacionalidad(fs)
        clase_de = {f["especie"]: f["clase"] for f in fs}
        por_clase: dict[int, list] = defaultdict(list)
        for k, d in sorted(est.items(), key=lambda x: -x[1]["n"]):
            if len(por_clase[clase_de[k]]) < MAX_ESPECIES_CELDA.get(clase_de[k], MAX_OTRAS_CLASES):
                por_clase[clase_de[k]].append((k, d))
        mejores = [x for xs in por_clase.values() for x in xs]
        bases: dict[int, list[int]] = defaultdict(lambda: [0] * 12)
        for f in fs:
            bases[f["clase"]][f["mes"] - 1] += f["n"]
        salida[c] = {
            "m": {CLASE_NOMBRE.get(k, str(k)): muestra(v) for k, v in bases.items()},
            "e": {str(k): d["frecuencia"] for k, d in mejores},
        }
    return salida


def informe(filas: list[dict], meta: dict, nombre_de) -> str:
    ultimo = max(f["anio"] for f in filas) - 1  # el último año completo
    lineas = [
        "# Viabilidad de la fauna en España (GBIF por cuadrícula de 10 km)",
        "",
        f"Generado el {date.today():%d-%m-%Y} con `python -m safari --espana`. Descarga GBIF {meta.get('clave')}"
        f" (DOI {meta.get('doi')}, {meta.get('registros')} registros agregados).",
        "",
    ]
    for z in ZONAS:
        cs = set(celdas(z))
        fs = [f for f in filas if f["celda"] in cs]
        por_mes = [sum(f["n"] for f in fs if f["mes"] == m) for m in range(1, 13)]
        est = estacionalidad(fs)
        mes = z["mes_prueba"]
        clase_de = {f["especie"]: f["clase"] for f in fs}
        lineas += [
            f"## {z['nombre']} ({len(cs)} celdas, {z['radio_km']} km)",
            "",
            "Observaciones por mes: " + ", ".join(f"{MESES_ES[i][:3]} {n}" for i, n in enumerate(por_mes)) + ".",
            "",
            f"Las más frecuentes en {MESES_ES[mes - 1]} por grupo (‰ de su grupo, confianza); la frecuencia es dentro"
            " del grupo, así que no se mezclan:",
            "",
        ]
        for nombre_clase, k_clase in gbif_descarga.CLASES.items():
            tope = 20 if k_clase == 212 else 10
            top = ranking({k: d for k, d in est.items() if clase_de.get(k) == k_clase}, mes, tope)
            if not top:
                continue
            lineas += [
                f"### {GRUPO_ES.get(nombre_clase, nombre_clase)}",
                "",
                *[f"{i + 1}. {nombre_de(k)}: {v} ‰ ({c or 'sin dato'})" for i, (k, v, c) in enumerate(top)],
                "",
            ]
        aves = [f for f in filas if f["clase"] == 212]
        bt = backtest(aves, cs, mes, ultimo)
        lineas += [
            f"Backtest de aves {ultimo} ({MESES_ES[mes - 1]}): {bt['aciertos']} de {bt['observadas']} especies "
            f"observadas estaban entre las 20 primeras (precisión {bt['precision']}, cobertura {bt['cobertura']}).",
            "",
        ]
    return "\n".join(lineas)


def main(salida: Path = Path("public/datos/espana.json"), descargar: bool = True) -> None:
    r = cargar_filas(descargar)
    if r is None:
        print("España: sin filas de GBIF (faltan GBIF_USUARIO/GBIF_CLAVE): nada que hacer", flush=True)
        return
    filas, meta = r
    print(f"España: {len(filas)} filas", flush=True)
    celdas_ = por_celda(filas)
    claves = sorted({int(k) for c in celdas_.values() for k in c["e"]})
    clase_de = {f["especie"]: CLASE_NOMBRE.get(f["clase"], str(f["clase"])) for f in filas}
    especies = {}
    for k in claves:
        try:
            e = nombres.especie(k)
            especies[str(k)] = {**e, "n": nombres.nombre_es(e.get("c"), e.get("n")), "clase": clase_de.get(k)}
        except Exception as e:
            print(f"  sin nombre para {k}: {e}", flush=True)
            especies[str(k)] = {"c": None, "n": None, "clase": clase_de.get(k)}

    def nombre_de(k: int) -> str:
        e = especies.get(str(k)) or nombres.especie(k)
        return f"{e['n'] or e['c']} ({e['c']})" if e.get("n") else str(e.get("c") or k)

    escribir_json(
        salida,
        {
            "generado": date.today().isoformat(),
            "fuente": {
                "gbif": meta,
                "cita": f"GBIF.org ({date.today():%d %B %Y}) GBIF Occurrence Download {meta.get('doi')}",
            },
            "especies": especies,
            "celdas": celdas_,
        },
    )
    Path("docs/espana-viabilidad.md").write_text(informe(filas, meta, nombre_de), encoding="utf-8")
    print(f"{salida}: {len(celdas_)} celdas, {len(especies)} especies")
