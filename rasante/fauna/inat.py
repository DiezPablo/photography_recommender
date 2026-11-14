"""iNaturalist (API pública, sin clave): el cliente con el que se piden las observaciones de España.

Pide ≤ 1 petición por segundo, como recomienda iNaturalist, reintenta si el servidor está saturado y guarda cada
respuesta en la caché (la de «recientes», solo unas horas).
"""

from __future__ import annotations

import json
import time

import requests

from rasante.comun.cache import CacheJson
from rasante.comun.red import sesion

API = "https://api.inaturalist.org/v1"
CACHE = CacheJson(prefijo="inat_", max_edad_s=25 * 86400)
CACHE_RECIENTE = CacheJson(prefijo="inat_reciente_", max_edad_s=6 * 3600)
_SESION = sesion()
_ultima = [0.0]


def _get(ruta: str, params: dict, cache: CacheJson = CACHE) -> dict:
    clave = json.dumps({"ruta": ruta, **params}, sort_keys=True)
    guardado = cache.leer(clave)
    if guardado is not None:
        return guardado
    for intento in range(5):
        espera = 1.0 - (time.time() - _ultima[0])
        if espera > 0:
            time.sleep(espera)
        _ultima[0] = time.time()
        try:
            r = _SESION.get(f"{API}/{ruta}", params=params, timeout=60)
        except (requests.ConnectionError, requests.Timeout):
            time.sleep(5 * (intento + 1))
            continue
        if r.status_code in (429, 500, 502, 503):
            time.sleep(int(r.headers.get("Retry-After", 0) or 20 * (intento + 1)))
            continue
        r.raise_for_status()
        datos = r.json()
        cache.guardar(clave, datos)
        return datos
    raise requests.ConnectionError(f"iNaturalist no responde: {ruta}")
