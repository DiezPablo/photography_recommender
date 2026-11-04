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


def provincias(pais: str = "ES", s=None) -> list[dict]:
    """Regiones de segundo nivel de eBird (provincias): [{code: "ES-AR-TE", name: "Teruel"}]."""
    return _get(f"ref/region/list/subnational2/{pais}", {"fmt": "json"}, s)


def recientes_region(region: str, dias: int = 30, s=None) -> list[dict]:
    """Última observación de cada especie en la región: [{c, f, lat, lon, l}]. Las ubicaciones privadas (casas,
    fincas) se quedan sin nombre, y las especies sensibles ya las oculta eBird en su API."""
    datos = _get(f"data/obs/{region}/recent", {"back": min(dias, 30), "sppLocale": "es"}, s)
    salida = []
    for d in datos:
        if not d.get("sciName") or d.get("lat") is None or not d.get("obsValid", True):
            continue
        salida.append(
            {
                "c": d["sciName"],
                "f": (d.get("obsDt") or "")[:10],
                "lat": round(d["lat"], 2),
                "lon": round(d["lng"], 2),
                "l": None if d.get("locationPrivate") else d.get("locName"),
            }
        )
    return salida


def recientes_espana(salida, s=None) -> int:
    """espana_recientes.json: la última observación de cada especie en cada provincia (unas 52 peticiones). Sin
    EBIRD_CLAVE no escribe nada. Devuelve cuántas observaciones guardó."""
    from datetime import UTC, datetime

    from safari.comun.ficheros import escribir_json

    if not clave():
        print("eBird: sin EBIRD_CLAVE, no se pide nada", flush=True)
        return 0
    s = s or sesion()
    obs = []
    for p in provincias(s=s):
        try:
            obs += recientes_region(p["code"], s=s)
        except requests.RequestException as e:
            print(f"  eBird {p['code']}: {e}", flush=True)
    escribir_json(
        salida,
        {
            "generado": datetime.now(UTC).isoformat(timespec="minutes"),
            "fuente": "eBird (ebird.org), Cornell Lab of Ornithology",
            "obs": obs,
        },
    )
    print(f"{salida}: {len(obs)} observaciones de eBird", flush=True)
    return len(obs)
