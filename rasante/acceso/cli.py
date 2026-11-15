"""python -m rasante acceso: el aparcamiento más cercano a cada spot y a cada lugar de fauna → acceso.json.

Con el extracto PBF de España de OpenStreetMap (sin Overpass). Mensual: los aparcamientos cambian poco.

  python -m rasante acceso --pbf spain.osm.pbf --spots spots.geojson --fauna fauna_lugares.json --salida acceso.json
"""

from __future__ import annotations

import argparse
from datetime import UTC, datetime
from pathlib import Path

from rasante.acceso.calculo import KMH, RADIO_KM, TORTUOSIDAD, calcular
from rasante.acceso.osm import leer_aparcamientos
from rasante.comun.ficheros import escribir_json
from rasante.lugares.cli import leer

# en un espacio protegido grande, el aparcamiento «más cercano al centro» no dice nada: solo puntos y sitios pequeños
RADIO_MAX_FAUNA_KM = 2


def lugares_de(spots: dict | None, fauna: dict | None) -> dict[str, list[dict]]:
    luz = [
        {"id": f["properties"]["id"], "lat": f["geometry"]["coordinates"][1], "lon": f["geometry"]["coordinates"][0]}
        for f in (spots or {}).get("features", [])
    ]
    puntos = [
        {"id": x["id"], "lat": x["lat"], "lon": x["lon"]}
        for x in (fauna or {}).get("lugares", [])
        if (x.get("r") or 0) <= RADIO_MAX_FAUNA_KM
    ]
    return {"luz": luz, "fauna": puntos}


def main(argv: list[str] | None = None) -> None:
    datos = Path("public/datos")
    ap = argparse.ArgumentParser(prog="python -m rasante acceso", description=__doc__.split("\n")[0])
    ap.add_argument("--pbf", type=Path, required=True)
    ap.add_argument("--spots", type=Path, default=datos / "spots.geojson")
    ap.add_argument("--fauna", type=Path, default=datos / "fauna_lugares.json")
    ap.add_argument("--salida", type=Path, default=datos / "acceso.json")
    a = ap.parse_args(argv)
    lugares = lugares_de(leer(a.spots), leer(a.fauna))
    print(f"Aparcamientos de {a.pbf}…", flush=True)
    por_catalogo = calcular(leer_aparcamientos(a.pbf), lugares)
    doc = {
        "generado": datetime.now(UTC).isoformat(timespec="seconds"),
        "fuente": "OpenStreetMap (ODbL)",
        "radio_km": RADIO_KM,
        "minutos": f"línea recta × {TORTUOSIDAD} a {KMH} km/h",
        **por_catalogo,
    }
    escribir_json(a.salida, doc)
    for c, xs in lugares.items():
        print(f"  {c}: {len(por_catalogo[c])} de {len(xs)} con aparcamiento a menos de {RADIO_KM:.0f} km")
