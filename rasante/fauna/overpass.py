"""Consultas a Overpass (OpenStreetMap): varios espejos, primero los que van bien, y memoria de las que fallan
para no repetirlas cada día. La usan los lugares de fauna (observatorios y rutas de OSM)."""

from __future__ import annotations

import time

import requests

from rasante.comun.cache import CacheJson
from rasante.comun.red import sesion

OVERPASS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
)
# consultas a Overpass que fallaron hace poco: no se repiten cada día (se comían el tiempo de la ejecución)
FALLOS = CacheJson(prefijo="fallo_", max_edad_s=5 * 86400)
# fallos seguidos y respuestas de cada espejo en esta ejecución: los que fallan pasan al final de la cola
SALUD = {url: {"fallos": 0, "ok": 0, "error": 0} for url in OVERPASS}
MAX_FALLOS_SEGUIDOS = 5
_SESION = sesion()


def overpass(consulta: str, timeout: int = 70) -> dict | None:
    """Una consulta a Overpass: cada espejo una vez, primero los que van bien; None si fallan todos (y se recuerda
    unos días). Antes eran dos vueltas a tres espejos con 100 s de espera y pausas: hasta 11 min por parque."""
    if FALLOS.leer(consulta) is not None:
        return None
    sanos = [u for u in OVERPASS if SALUD[u]["fallos"] < MAX_FALLOS_SEGUIDOS] or list(OVERPASS)
    for url in sorted(sanos, key=lambda u: SALUD[u]["fallos"]):
        try:
            r = _SESION.post(url, data={"data": consulta}, timeout=timeout)
            if r.status_code == 429:
                time.sleep(min(int(r.headers.get("Retry-After", 10) or 10), 60))
                r = _SESION.post(url, data={"data": consulta}, timeout=timeout)
            r.raise_for_status()
            datos = r.json()
        except (requests.RequestException, ValueError):
            SALUD[url]["fallos"] += 1
            SALUD[url]["error"] += 1
            continue
        SALUD[url]["fallos"] = 0
        SALUD[url]["ok"] += 1
        return datos
    FALLOS.guardar(consulta, {"t": time.time()})
    return None
