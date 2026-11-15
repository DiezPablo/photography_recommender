"""Aparcamientos de OpenStreetMap (nodos y áreas, en su centro) leídos de un extracto PBF u OSM XML.

Viene de la logística de photo_recommender (decisión 0023): solo se queda el aparcamiento.
"""

from __future__ import annotations

import time
from pathlib import Path

# sin acceso para el público
ACCESO_FUERA = {"private", "no", "customers", "permit", "delivery"}
# los cerrados no sirven para ir al campo
CUBIERTOS = {"underground", "multi-storey", "rooftop"}


def es_aparcamiento(tg: dict) -> bool:
    return (
        tg.get("amenity") == "parking" and tg.get("access") not in ACCESO_FUERA and tg.get("parking") not in CUBIERTOS
    )


def leer_aparcamientos(fichero: Path) -> list[dict]:
    """Los aparcamientos al aire libre y abiertos al público, con su nombre si lo tienen."""
    import osmium

    t0 = time.time()
    puntos = []
    proc = (
        osmium.FileProcessor(str(fichero), osmium.osm.NODE | osmium.osm.WAY)
        .with_locations()
        .with_filter(osmium.filter.KeyFilter("amenity"))
    )
    for o in proc:
        tg = dict(o.tags)
        if not es_aparcamiento(tg):
            continue
        if o.is_node():
            lat, lon = o.location.lat, o.location.lon
        else:
            locs = [n.location for n in o.nodes if n.location.valid()]
            if not locs:
                continue
            lat = sum(x.lat for x in locs) / len(locs)
            lon = sum(x.lon for x in locs) / len(locs)
        puntos.append(
            {
                "nombre": tg.get("name"),
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "osm": f"{'node' if o.is_node() else 'way'}/{o.id}",
            }
        )
    print(f"      {len(puntos)} aparcamientos ({time.time() - t0:.0f} s)", flush=True)
    return puntos
