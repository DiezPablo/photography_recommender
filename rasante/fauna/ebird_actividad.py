"""Actividad de eBird por región (spec 021, bloque 2): listas, observadores y especies de cada día.

Una petición por región y día (`product/stats/{región}/{año}/{mes}/{día}`). Se guardan los últimos 30 días en el
propio fichero publicado, que hace de historial: cada ejecución pide el día anterior y, si queda presupuesto de
peticiones (ebird.quedan), rellena hacia atrás los que falten. La web lo usa para decir cuánto se está viendo
estos días en la provincia de un lugar.
"""

from __future__ import annotations

import json
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

import requests

from rasante.comun.red import sesion
from rasante.fauna import ebird

DIAS = 30
MAX_DIAS = 3  # días nuevos por ejecución como mucho (unas 52 peticiones cada uno)
MIN_REGIONES = 0.9  # un día solo vale si respondió casi todo el país


def _entero(v) -> int:
    return v if isinstance(v, int) and v >= 0 else 0


def pedir_dia(dia: date, regiones: list[str], s) -> dict[str, list[int]] | None:
    """{región: [listas, observadores, especies]} de un día; None si fallaron demasiadas regiones."""
    salida: dict[str, list[int]] = {}
    for region in regiones:
        try:
            d = ebird._get(f"product/stats/{region}/{dia.year}/{dia.month}/{dia.day}", {}, s)
        except requests.RequestException as e:
            print(f"  eBird actividad {region} {dia}: {e}", flush=True)
            continue
        if isinstance(d, dict):
            salida[region] = [
                _entero(d.get("numChecklists")),
                _entero(d.get("numContributors")),
                _entero(d.get("numSpecies")),
            ]
    return salida if regiones and len(salida) >= MIN_REGIONES * len(regiones) else None


def main(salida: Path, hoy: date | None = None, max_dias: int = MAX_DIAS) -> None:
    from rasante.comun.ficheros import escribir_json

    if not ebird.clave():
        print("eBird: sin EBIRD_CLAVE; no se pide la actividad por región", flush=True)
        return
    hoy = hoy or datetime.now(UTC).date()
    s = sesion()
    regiones = {p["code"]: p.get("name") or p["code"] for p in ebird.provincias(s=s)}
    dias: dict[str, dict] = {}
    if salida.exists():
        guardado = json.loads(salida.read_text(encoding="utf-8"))
        if sorted(guardado.get("regiones", {})) == sorted(regiones):
            dias = guardado.get("dias", {})
    desde = (hoy - timedelta(days=DIAS)).isoformat()
    dias = {d: v for d, v in dias.items() if d >= desde}
    faltan = [d for d in (hoy - timedelta(days=i) for i in range(1, DIAS + 1)) if d.isoformat() not in dias]
    nuevos = 0
    for dia in faltan[:max_dias]:
        if ebird.quedan() < len(regiones):
            print(f"  eBird actividad: sin presupuesto para más días hoy (quedan {ebird.quedan()})", flush=True)
            break
        r = pedir_dia(dia, list(regiones), s)
        if r is None:
            print(f"  eBird actividad {dia}: demasiadas regiones sin respuesta; se reintentará", flush=True)
            continue
        dias[dia.isoformat()] = r
        nuevos += 1
    if not dias:
        print("eBird actividad: sin datos; no se escribe nada", flush=True)
        return
    escribir_json(
        salida,
        {
            "generado": datetime.now(UTC).isoformat(timespec="minutes"),
            "fuente": "eBird (ebird.org), Cornell Lab of Ornithology: estadísticas diarias por región",
            "regiones": regiones,
            "dias": dict(sorted(dias.items())),
        },
    )
    print(f"{salida}: {len(dias)} días de actividad en {len(regiones)} regiones ({nuevos} nuevos)", flush=True)
