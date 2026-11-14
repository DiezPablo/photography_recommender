"""Actividad de eBird por punto (spec 021, bloque 1): cuántas listas se han subido en cada punto de observación
en los últimos 7 y 30 días, cuándo fue la última y cuántas especies llevaba.

Cada día se piden las listas del día anterior en cada provincia (`product/lists/{provincia}/{año}/{mes}/{día}`,
unas 52 peticiones) y se guardan solo recuentos por punto: ni observadores ni listas sueltas. Los días que falten
de los últimos 30 (la primera vez, todos) se van rellenando, unos pocos por ejecución. eBird devuelve como mucho
200 listas por provincia y día: en las provincias con más actividad el recuento es un mínimo.

→ espana_listas.json (resumen por punto) y espana_listas_dias.json (el recuento por día, para continuar).
"""

from __future__ import annotations

import json
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

import requests

from safari.comun.red import sesion
from safari.espana import ebird

DIAS = 30
MAX_LISTAS = 200  # el máximo que admite eBird por petición
# Días nuevos por ejecución: 52 provincias × 5 = 260 peticiones (el histórico de 30 días se completa en una semana)
MAX_DIAS = 5
# Un día solo vale si respondió casi todo el país; si no, se reintenta en la siguiente ejecución
MIN_PROVINCIAS = 0.9


def punto_de(lista: dict) -> str | None:
    """El punto de una lista de eBird (viene en `loc.locId`; en respuestas antiguas, en `locId`)."""
    loc = lista.get("loc") or {}
    return loc.get("locId") or loc.get("locID") or lista.get("locId") or None


def resumen_dia(listas: list[dict], puntos: set[str] | None) -> dict[str, list[int]]:
    """{punto: [listas, especies de la lista más larga]} de las listas de un día. Solo los puntos de `puntos` (los
    de observación públicos que ya son lugares); sin esa lista, los que eBird marca como «hotspot». Las listas
    en casas y fincas no se cuentan."""
    salida: dict[str, list[int]] = {}
    for x in listas:
        p = punto_de(x)
        if not p:
            continue
        if puntos is not None:
            if p not in puntos:
                continue
        elif not (x.get("loc") or {}).get("isHotspot"):
            continue
        n = x.get("numSpecies")
        n = n if isinstance(n, int) and n >= 0 else 0
        ya = salida.setdefault(p, [0, 0])
        ya[0] += 1
        ya[1] = max(ya[1], n)
    return salida


def unir(a: dict[str, list[int]], b: dict[str, list[int]]) -> dict[str, list[int]]:
    """Suma los recuentos de dos provincias (un punto está en una sola, pero por si acaso)."""
    for p, (n, e) in b.items():
        ya = a.setdefault(p, [0, 0])
        ya[0] += n
        ya[1] = max(ya[1], e)
    return a


def dias_que_faltan(dias: dict[str, dict], hoy: date, maximo: int = MAX_DIAS) -> list[date]:
    """Los días completos de los últimos 30 que aún no están, del más reciente al más antiguo, hasta `maximo`."""
    todos = [hoy - timedelta(days=i) for i in range(1, DIAS + 1)]
    return [d for d in todos if d.isoformat() not in dias][:maximo]


def pedir_dia(dia: date, regiones: list[str], puntos: set[str] | None, s) -> dict[str, list[int]] | None:
    """Las listas de un día en todas las regiones; None si fallaron demasiadas (el día se reintenta otra vez)."""
    salida: dict[str, list[int]] = {}
    bien = 0
    for region in regiones:
        try:
            listas = ebird._get(
                f"product/lists/{region}/{dia.year}/{dia.month}/{dia.day}", {"maxResults": MAX_LISTAS}, s
            )
        except requests.RequestException as e:
            print(f"  eBird listas {region} {dia}: {e}", flush=True)
            continue
        bien += 1
        if len(listas) >= MAX_LISTAS:
            print(f"  eBird listas {region} {dia}: {MAX_LISTAS} o más (el recuento es un mínimo)", flush=True)
        unir(salida, resumen_dia(listas, puntos))
    return salida if regiones and bien >= MIN_PROVINCIAS * len(regiones) else None


def resumen(dias: dict[str, dict], hoy: date) -> dict[str, dict]:
    """Por punto: listas en 7 y 30 días (`l7`, `l30`), fecha de la última (`u`), especies de la lista más larga de
    ese día (`e`) y de los 30 días (`m`)."""
    limite7 = (hoy - timedelta(days=7)).isoformat()
    puntos: dict[str, dict] = {}
    for dia in sorted(dias):
        for p, (n, e) in dias[dia].items():
            x = puntos.setdefault(p, {"l7": 0, "l30": 0, "u": dia, "e": e, "m": 0})
            x["l30"] += n
            if dia >= limite7:
                x["l7"] += n
            x["u"], x["e"] = dia, e  # los días van en orden: el último que pasa es el más reciente
            x["m"] = max(x["m"], e)
    return puntos


def puntos_de_lugares(ruta: Path | None) -> set[str] | None:
    """Los puntos de eBird que ya son lugares (ids `eb-L…` de espana_lugares.json); None si no hay fichero."""
    if not ruta or not ruta.exists():
        return None
    lugares = json.loads(ruta.read_text(encoding="utf-8")).get("lugares", [])
    return {x["id"][3:] for x in lugares if x.get("id", "").startswith("eb-")}


def main(salida: Path, lugares: Path | None = None, hoy: date | None = None, max_dias: int = MAX_DIAS) -> None:
    from safari.comun.ficheros import escribir_json

    if not ebird.clave():
        print("eBird: sin EBIRD_CLAVE; no se piden listas", flush=True)
        return
    hoy = hoy or datetime.now(UTC).date()
    historial = salida.parent / "espana_listas_dias.json"
    s = sesion()
    regiones = [p["code"] for p in ebird.provincias(s=s)]
    dias: dict[str, dict] = {}
    if historial.exists():
        guardado = json.loads(historial.read_text(encoding="utf-8"))
        # los días guardados solo valen si se pidieron con las mismas regiones: si la lista cambia (como al
        # añadir las comunidades de una sola provincia), se vuelven a pedir en vez de quedar a medias 30 días
        if guardado.get("regiones") == sorted(regiones):
            dias = guardado.get("dias", {})
        else:
            print("eBird listas: cambian las regiones; se vuelve a pedir el histórico", flush=True)
    desde = (hoy - timedelta(days=DIAS)).isoformat()
    dias = {d: v for d, v in dias.items() if d >= desde}
    puntos = puntos_de_lugares(lugares)
    nuevos = 0
    for dia in dias_que_faltan(dias, hoy, max_dias):
        r = pedir_dia(dia, regiones, puntos, s)
        if r is None:
            print(f"  eBird listas {dia}: demasiadas provincias sin respuesta; se reintentará", flush=True)
            continue
        dias[dia.isoformat()] = r
        nuevos += 1
    if not dias:
        print("eBird listas: sin datos; no se escribe nada", flush=True)
        return
    escribir_json(historial, {"regiones": sorted(regiones), "dias": dias})
    por_punto = resumen(dias, hoy)
    escribir_json(
        salida,
        {
            "generado": datetime.now(UTC).isoformat(timespec="minutes"),
            "fuente": "eBird (ebird.org), Cornell Lab of Ornithology: listas por punto de observación",
            "dias": sorted(dias),
            "puntos": por_punto,
        },
    )
    print(
        f"{salida}: {len(por_punto)} puntos con listas en {len(dias)} de los últimos {DIAS} días "
        f"({nuevos} días nuevos, {sum(x['l30'] for x in por_punto.values())} listas)",
        flush=True,
    )
