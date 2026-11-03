"""eBird API 2.0: aves vistas en los últimos días cerca de un punto y puntos de observación (hotspots).

Necesita EBIRD_CLAVE en el entorno (gratuita: https://ebird.org/api/keygen); sin ella, devuelve listas vacías.
Solo se usa en el servidor o en Actions: la clave nunca va al navegador. Unas 1000 peticiones al día como mucho.
"""

from __future__ import annotations

import os
import time

import requests

from safari.comun.red import sesion

API = "https://api.ebird.org/v2"
PAUSA_S = 1.0


def clave() -> str | None:
    return os.environ.get("EBIRD_CLAVE") or None


def _get(ruta: str, params: dict, s: requests.Session | None = None) -> list[dict]:
    k = clave()
    if not k:
        return []
    s = s or sesion()
    time.sleep(PAUSA_S)
    r = s.get(f"{API}/{ruta}", params=params, headers={"X-eBirdApiToken": k}, timeout=60)
    r.raise_for_status()
    return r.json()


def recientes(lat: float, lon: float, radio_km: int = 25, dias: int = 30, s=None) -> list[dict]:
    """Última observación de cada especie en el radio: [{cientifico, nombre, fecha, lugar, n}]."""
    datos = _get(
        "data/obs/geo/recent",
        {
            "lat": round(lat, 3),
            "lng": round(lon, 3),
            "dist": min(radio_km, 50),
            "back": min(dias, 30),
            "sppLocale": "es",
        },
        s,
    )
    return [
        {
            "cientifico": d.get("sciName"),
            "nombre": d.get("comName"),
            "fecha": (d.get("obsDt") or "")[:10],
            "lugar": d.get("locName"),
            "n": d.get("howMany"),
        }
        for d in datos
    ]


def hotspots(lat: float, lon: float, radio_km: int = 25, s=None) -> list[dict]:
    """Puntos de observación cercanos con su número de especies: [{nombre, lat, lon, especies}]."""
    datos = _get(
        "ref/hotspot/geo", {"lat": round(lat, 3), "lng": round(lon, 3), "dist": min(radio_km, 50), "fmt": "json"}, s
    )
    return [
        {"nombre": d.get("locName"), "lat": d.get("lat"), "lon": d.get("lng"), "especies": d.get("numSpeciesAllTime")}
        for d in datos
    ]
