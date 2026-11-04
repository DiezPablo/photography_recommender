"""Red Natura 2000 en España con sus límites reales (servicio de mapas de la Agencia Europea de Medio Ambiente,
sin clave): para cada espacio, las cuadrículas de 10 km que toca, un punto dentro y el contorno simplificado.

→ espana_natura.json: {sitios: {código: {n, t, a, lat, lon, celdas, g}}}; t es el tipo («A» ZEPA, «B» LIC/ZEC,
«C» las dos), a la superficie en km² y g la geometría GeoJSON simplificada (unos 300 m) para el mapa.
"""

from __future__ import annotations

import math

import requests

from safari.comun.red import sesion
from safari.espana.rejilla import laea

SERVICIO = "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer/2/query"
POR_PAGINA = 500
CELDA_M = 10_000


def descargar(s: requests.Session | None = None, simplificar: float = 0.003) -> list[dict]:
    """Los espacios de España como features GeoJSON (en grados, simplificados `simplificar` grados)."""
    s = s or sesion()
    salida, desde = [], 0
    while True:
        r = s.get(
            SERVICIO,
            params={
                "where": "MS='ES'",
                "outFields": "SITECODE,SITENAME,SITETYPE,Area_km2",
                "outSR": 4326,
                "maxAllowableOffset": simplificar,
                "geometryPrecision": 4,
                "resultOffset": desde,
                "resultRecordCount": POR_PAGINA,
                "orderByFields": "SITECODE",
                "f": "geojson",
            },
            timeout=300,
        )
        r.raise_for_status()
        fs = r.json().get("features", [])
        salida += fs
        if len(fs) < POR_PAGINA:
            return salida
        desde += POR_PAGINA


def a_laea(geometria):
    """La geometría (en grados) en metros de la cuadrícula europea (EPSG:3035)."""
    import shapely

    # shapely pasa las coordenadas como matriz (n, 2) de [lon, lat]
    return shapely.transform(geometria, lambda xy: [laea(la, lo) for lo, la in xy])


def celdas(geometria_laea) -> list[str]:
    """Cuadrículas de 10 km que tocan la geometría (ya en metros EPSG:3035)."""
    from shapely.geometry import box

    x0, y0, x1, y1 = geometria_laea.bounds
    salida = []
    for e in range(math.floor(x0 / CELDA_M), math.floor(x1 / CELDA_M) + 1):
        for n in range(math.floor(y0 / CELDA_M), math.floor(y1 / CELDA_M) + 1):
            caja = box(e * CELDA_M, n * CELDA_M, (e + 1) * CELDA_M, (n + 1) * CELDA_M)
            if geometria_laea.intersects(caja):
                salida.append(f"10kmE{e}N{n}")
    return salida


def sitio(f: dict) -> tuple[str, dict] | None:
    from shapely.geometry import mapping, shape

    p = f.get("properties") or {}
    if not f.get("geometry") or not p.get("SITECODE"):
        return None
    g = shape(f["geometry"])
    if g.is_empty:
        return None
    if not g.is_valid:
        g = g.buffer(0)
    punto = g.representative_point()
    mapa = g.simplify(0.005, preserve_topology=True)
    return p["SITECODE"], {
        "n": p.get("SITENAME") or p["SITECODE"],
        "t": p.get("SITETYPE"),
        "a": round(p.get("Area_km2") or 0, 1),
        "lat": round(punto.y, 4),
        "lon": round(punto.x, 4),
        "celdas": celdas(a_laea(g)),
        "g": mapping(mapa),
    }


def main(salida) -> None:
    from datetime import date

    from safari.comun.ficheros import escribir_json

    try:
        fs = descargar()
    except (requests.RequestException, ValueError) as e:
        print(f"Natura 2000: {e}; no se escribe nada", flush=True)
        return
    sitios = dict(x for x in map(sitio, fs) if x)
    if not sitios:
        print("Natura 2000: ningún espacio; no se escribe nada", flush=True)
        return
    escribir_json(
        salida,
        {
            "generado": date.today().isoformat(),
            "fuente": "Natura 2000, Agencia Europea de Medio Ambiente (EEA)",
            "sitios": sitios,
        },
    )
    print(f"{salida}: {len(sitios)} espacios de la Red Natura 2000", flush=True)
