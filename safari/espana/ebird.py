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
    """Las regiones de eBird con las que se cubre el país entero: [{code: "ES-AR-TE", name: "Teruel"}].

    Son las de segundo nivel (provincias; en Canarias, islas) y, donde eBird no tiene segundo nivel, la de primero:
    las comunidades de una sola provincia (Madrid «ES-MD», Asturias, Cantabria, Murcia, Navarra, La Rioja,
    Baleares…) no aparecen en la lista de segundo nivel. Hasta el 14-11-2026 solo se pedía esa lista y esas
    comunidades se quedaban sin recientes, sin rarezas y sin listas."""
    segundo = _get(f"ref/region/list/subnational2/{pais}", {"fmt": "json"}, s)
    primero = _get(f"ref/region/list/subnational1/{pais}", {"fmt": "json"}, s)
    vistas = {p["code"] for p in segundo}
    con_hijas = {c.rsplit("-", 1)[0] for c in vistas}
    return [*segundo, *(p for p in primero if p["code"] not in con_hijas and p["code"] not in vistas)]


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
                "l": None if d.get("locationPrivate") else (d.get("locName") or "").replace("--", " · ") or None,
            }
        )
    return salida


def recientes_espana(salida, s=None) -> int:
    """espana_recientes.json: lo visto en 30 días. Aves de eBird (la última de cada especie en cada provincia, unas
    52 peticiones; solo con EBIRD_CLAVE) y mamíferos, reptiles y anfibios de iNaturalist (sin clave). `s` dice la
    fuente de cada una («e» o «i»). Devuelve cuántas observaciones guardó."""
    from datetime import UTC, datetime

    from safari.comun.ficheros import escribir_json
    from safari.espana import inat_espana

    obs = []
    if clave():
        s = s or sesion()
        for p in provincias(s=s):
            try:
                obs += [{**o, "s": "e"} for o in recientes_region(p["code"], s=s)]
            except requests.RequestException as e:
                print(f"  eBird {p['code']}: {e}", flush=True)
    else:
        print("eBird: sin EBIRD_CLAVE, solo iNaturalist", flush=True)
    n_ebird = len(obs)
    try:
        obs += inat_espana.recientes()
    except requests.RequestException as e:
        print(f"  iNaturalist: {e}", flush=True)
    if not obs:
        return 0
    escribir_json(
        salida,
        {
            "generado": datetime.now(UTC).isoformat(timespec="minutes"),
            "fuentes": {
                "e": "eBird (ebird.org), Cornell Lab of Ornithology",
                "i": "iNaturalist (inaturalist.org), grado de investigación",
            },
            "obs": obs,
        },
    )
    print(f"{salida}: {n_ebird} observaciones de eBird y {len(obs) - n_ebird} de iNaturalist", flush=True)
    return len(obs)


def notables_region(region: str, dias: int = 7, s=None) -> list[dict]:
    """Observaciones «notables» de eBird en la región (rarezas para la zona o la fecha), una por especie y lugar
    (la más reciente): [{c, n, f, lat, lon, l, k, r, sub}]. eBird ya oculta las especies sensibles; las de
    ubicación privada van sin nombre de lugar."""
    datos = _get(f"data/obs/{region}/recent/notable", {"back": min(dias, 30), "sppLocale": "es", "detail": "full"}, s)
    salida: dict[tuple, dict] = {}
    for d in datos:
        if not d.get("sciName") or d.get("lat") is None:
            continue
        clave = (d["sciName"], d.get("locId"))
        f = d.get("obsDt") or ""
        if clave in salida and salida[clave]["f"] >= f:
            continue
        salida[clave] = {
            "c": d["sciName"],
            "n": d.get("comName"),
            "f": f,
            "lat": round(d["lat"], 2),
            "lon": round(d["lng"], 2),
            "l": None if d.get("locationPrivate") else (d.get("locName") or "").replace("--", " · ") or None,
            "k": d.get("howMany"),
            "r": bool(d.get("obsReviewed")) and bool(d.get("obsValid")),
            "sub": d.get("subId"),
        }
    return list(salida.values())


def rarezas_espana(salida, s=None) -> int:
    """espana_rarezas.json: lo notable de los últimos 7 días en cada provincia (unas 52 peticiones; con clave)."""
    from datetime import UTC, datetime

    from safari.comun.ficheros import escribir_json

    if not clave():
        return 0
    s = s or sesion()
    obs = []
    for p in provincias(s=s):
        try:
            obs += [{**o, "p": p.get("name")} for o in notables_region(p["code"], s=s)]
        except requests.RequestException as e:
            print(f"  eBird notables {p['code']}: {e}", flush=True)
    escribir_json(
        salida,
        {
            "generado": datetime.now(UTC).isoformat(timespec="minutes"),
            "fuente": "eBird (ebird.org), Cornell Lab of Ornithology: observaciones notables",
            "obs": sorted(obs, key=lambda o: o["f"], reverse=True),
        },
    )
    print(f"{salida}: {len(obs)} observaciones notables de eBird", flush=True)
    return len(obs)
