"""Lugares para ver fauna en España, de grandes a pequeños, para buscar y para «cerca de aquí»:

- puntos de observación de eBird (hotspots: lagunas, sotos, parques urbanos, bosques pequeños), con las especies
  vistas allí; necesita EBIRD_CLAVE (una petición);
- espacios protegidos de Wikidata (Natura 2000, parques y reservas naturales, monumentos naturales, parques
  periurbanos…), con su superficie para el radio;
- observatorios de aves de OpenStreetMap (leisure=bird_hide), agrupados por laguna o paraje.

→ espana_lugares.json: [{id, n, t, lat, lon, r, e, z}] (t: tipo; r: radio en km; e: especies vistas en eBird; z:
código Natura 2000, si lo tiene).
"""

from __future__ import annotations

import math
import re
import time

import requests

from safari.comun.red import sesion
from safari.espana import ebird

WIKIDATA = "https://query.wikidata.org/sparql"
MIN_ESPECIES_HOTSPOT = 30  # por debajo suelen ser puntos de una sola visita
# tipos de «área protegida» que no son de naturaleza (conjuntos históricos, yacimientos, lugares geológicos)
NO_NATURALES = {"Q3317612", "Q9096832", "Q28748126", "Q56528396", "Q107989230"}

CONSULTA = """
SELECT ?i ?iLabel ?tipo ?tipoLabel ?c ?area ?n2k WHERE {
  ?i wdt:P17 wd:Q29; wdt:P625 ?c; wdt:P31 ?tipo.
  ?tipo wdt:P279* wd:Q473972.
  OPTIONAL { ?i p:P2046/psn:P2046/wikibase:quantityAmount ?area. }
  OPTIONAL { ?i wdt:P3425 ?n2k. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,ca,gl,eu,en". }
}
"""


def radio_km(area_m2: float | None, defecto: float = 3) -> float:
    """Radio de un círculo con esa superficie, entre 1 y 30 km."""
    if not area_m2:
        return defecto
    return round(min(30, max(1, math.sqrt(area_m2 / 1e6 / math.pi))), 1)


def tipo_corto(etiqueta: str) -> str:
    t = etiqueta.lower()
    for clave, texto in (
        ("natura 2000", "Red Natura 2000"),
        ("importancia comunitaria", "Red Natura 2000"),
        ("especial protección para las aves", "ZEPA"),
        ("especial conservación", "Red Natura 2000"),
        ("parque nacional", "Parque nacional"),
        ("parque natural", "Parque natural"),
        ("reserva de biosfera", "Reserva de la biosfera"),
        ("reserva natural", "Reserva natural"),
        ("monumento natural", "Monumento natural"),
        ("periurbano", "Parque periurbano"),
        ("paraje", "Paraje natural"),
        ("paisaje protegido", "Paisaje protegido"),
        ("ramsar", "Humedal Ramsar"),
        ("microrreserva", "Microrreserva"),
    ):
        if clave in t:
            return texto
    return "Espacio protegido"


def _consulta_wikidata(s: requests.Session, intentos: int = 3) -> list[dict]:
    """La consulta SPARQL con reintentos: a veces el servicio corta la respuesta a medias (JSON incompleto)."""
    for i in range(intentos):
        try:
            r = s.get(WIKIDATA, params={"query": CONSULTA, "format": "json"}, timeout=180)
            r.raise_for_status()
            return r.json()["results"]["bindings"]
        except (requests.RequestException, ValueError) as e:
            if i == intentos - 1:
                raise
            print(f"  Wikidata: {e}; reintento", flush=True)
            time.sleep(30 * (i + 1))
    return []


def protegidos(s: requests.Session | None = None) -> list[dict]:
    s = s or sesion()
    por_id: dict[str, dict] = {}
    for b in _consulta_wikidata(s):
        qid = b["i"]["value"].rsplit("/", 1)[-1]
        tipo = b["tipo"]["value"].rsplit("/", 1)[-1]
        m = re.match(r"Point\(([-\d.]+) ([-\d.]+)\)", b["c"]["value"])
        nombre = b.get("iLabel", {}).get("value", "")
        if tipo in NO_NATURALES or not m or not nombre or re.fullmatch(r"Q\d+", nombre):
            continue
        area = float(b["area"]["value"]) if "area" in b else None
        lugar = {
            "id": f"wd-{qid}",
            "n": nombre,
            "t": tipo_corto(b.get("tipoLabel", {}).get("value", "")),
            "lat": round(float(m.group(2)), 4),
            "lon": round(float(m.group(1)), 4),
            "r": radio_km(area),
        }
        if "n2k" in b:
            lugar["z"] = b["n2k"]["value"]  # código Natura 2000: su contorno y sus cuadrículas en espana_natura.json
        ya = por_id.get(qid)
        # un mismo espacio con varios tipos (ZEPA y ZEC…): el más concreto que no sea el genérico
        if not ya or (ya["t"] in ("Espacio protegido", "Red Natura 2000") and lugar["t"] != "Espacio protegido"):
            if ya and ya.get("z") and not lugar.get("z"):
                lugar["z"] = ya["z"]
            por_id[qid] = lugar
        elif lugar.get("z") and not ya.get("z"):
            ya["z"] = lugar["z"]
    return list(por_id.values())


def hotspots(s: requests.Session | None = None) -> list[dict]:
    datos = ebird._get("ref/hotspot/ES", {"fmt": "json"}, s)
    return [
        {
            "id": f"eb-{d['locId']}",
            "n": d["locName"].replace("--", " · "),
            "t": "Punto de observación",
            "lat": round(d["lat"], 4),
            "lon": round(d["lng"], 4),
            "r": 2,
            "e": d.get("numSpeciesAllTime"),
        }
        for d in datos
        if (d.get("numSpeciesAllTime") or 0) >= MIN_ESPECIES_HOTSPOT and d.get("lat") is not None
    ]


CONSULTA_OBSERVATORIOS = """
[out:json][timeout:240];
area["ISO3166-1"="ES"][admin_level=2]->.es;
nwr["leisure"="bird_hide"](area.es);
out center tags;
"""
AGRUPAR_M = 400  # varios observatorios de una misma laguna, un lugar


def _centro(e: dict) -> tuple[float, float] | None:
    if "lat" in e:
        return e["lat"], e["lon"]
    c = e.get("center")
    return (c["lat"], c["lon"]) if c else None


def observatorios(s: requests.Session | None = None) -> list[dict]:
    """Observatorios de aves de OpenStreetMap (leisure=bird_hide) en España, agrupados a menos de 400 m; sin las
    exhibiciones de cetrería ni los de acceso privado. Los que no tienen nombre se nombran al final (`todos`)."""
    from safari.practico import overpass

    d = overpass(CONSULTA_OBSERVATORIOS, timeout=300)
    if not d:
        raise requests.ConnectionError("Overpass no respondió (observatorios)")
    grupos: list[dict] = []
    for e in d.get("elements", []):
        t = e.get("tags", {})
        c = _centro(e)
        nombre = t.get("name") or t.get("name:es")
        if not c or t.get("access") in ("private", "no") or (nombre and NO_OBSERVATORIO.search(nombre)):
            continue
        cerca = next(
            (g for g in grupos if math.dist((g["lat"], g["lon"] * 0.8), (c[0], c[1] * 0.8)) * 111_000 < AGRUPAR_M),
            None,
        )
        if cerca:
            cerca["k"] += 1
            cerca["n"] = cerca["n"] or nombre
            continue
        grupos.append({"lat": c[0], "lon": c[1], "n": nombre, "k": 1, "osm": f"{e['type']}/{e['id']}"})
    return [
        {
            "id": f"osm-{g['osm'].replace('/', '-')}",
            "n": g["n"],
            "t": "Observatorio de aves",
            "lat": round(g["lat"], 4),
            "lon": round(g["lon"], 4),
            "r": 2,
            **({"k": g["k"]} if g["k"] > 1 else {}),
        }
        for g in grupos
    ]


PREFIJOS = {"eBird": "eb-", "Wikidata": "wd-", "OpenStreetMap": "osm-"}

# observatorios de OSM que en realidad son exhibiciones de cetrería
NO_OBSERVATORIO = re.compile(r"espect[aá]culo|exhibici[oó]n|exibici[oó]n|cetrer[ií]a|vuelo de rapaces", re.I)


def sin_repetir(xs: list[dict], km: float = 3) -> list[dict]:
    """Quita los lugares con el mismo nombre que otro ya visto a menos de km (dos observatorios de una laguna)."""
    vistos: dict[str, list[dict]] = {}
    salida = []
    for x in xs:
        clave = x["n"].lower()
        if any(
            math.dist((x["lat"], x["lon"] * 0.8), (y["lat"], y["lon"] * 0.8)) * 111 < km for y in vistos.get(clave, [])
        ):
            continue
        vistos.setdefault(clave, []).append(x)
        salida.append(x)
    return salida


def todos(s: requests.Session | None = None) -> tuple[list[dict], dict[str, int]]:
    """Los lugares de las tres fuentes y cuántos de cada una (una fuente que falla no tumba a las demás)."""
    s = s or sesion()
    salida, cuenta = [], {}
    for nombre, f in (("eBird", hotspots), ("Wikidata", protegidos), ("OpenStreetMap", observatorios)):
        try:
            xs = f(s)
        except (requests.RequestException, KeyError, ValueError) as e:
            print(f"  lugares {nombre}: {e}", flush=True)
            xs = []
        cuenta[nombre] = len(xs)
        salida += xs
    # observatorios sin nombre: «Observatorio de aves junto a <el lugar con nombre más cercano a menos de 5 km>»
    con_nombre = [x for x in salida if x.get("n")]
    for x in salida:
        if x.get("n"):
            continue
        cerca = min(con_nombre, key=lambda y: math.dist((x["lat"], x["lon"]), (y["lat"], y["lon"])), default=None)
        km = math.dist((x["lat"], x["lon"] * 0.8), (cerca["lat"], cerca["lon"] * 0.8)) * 111 if cerca else 99
        x["n"] = f"Observatorio de aves junto a {cerca['n']}" if cerca and km < 5 else "Observatorio de aves"
    salida = sin_repetir(salida)
    cuenta = {f: sum(1 for x in salida if x["id"].startswith(p)) for f, p in PREFIJOS.items()}
    return salida, cuenta


def main(salida) -> None:
    from datetime import date

    from safari.comun.ficheros import escribir_json

    xs, cuenta = todos()
    faltan = [f for f, n in cuenta.items() if not n and (f != "eBird" or ebird.clave())]
    if faltan:
        # mejor el fichero de ayer completo que uno al que le falta una fuente entera
        print(f"Lugares: sin datos de {', '.join(faltan)}; no se escribe nada", flush=True)
        return
    escribir_json(
        salida,
        {
            "generado": date.today().isoformat(),
            "fuentes": {
                "eBird": "Puntos de observación de eBird (ebird.org)",
                "Wikidata": "Espacios protegidos de Wikidata (CC0)",
                "OpenStreetMap": "Observatorios de aves de OpenStreetMap (ODbL)",
            },
            "cuenta": cuenta,
            "lugares": sorted(xs, key=lambda x: x["id"]),
        },
    )
    print(f"{salida}: {len(xs)} lugares {cuenta}", flush=True)


CONSULTA_RUTAS = """
[out:json][timeout:300];
area["ISO3166-1"="ES"][admin_level=2]->.es;
rel["route"="hiking"](area.es);
out center tags;
"""


def km_ruta(texto: str | None) -> float | None:
    """La etiqueta distance de OSM («12.5», «12,5 km», «8 mi») en km."""
    if not texto:
        return None
    m = re.match(r"\s*([\d.,]+)\s*(km|mi|m)?", texto)
    if not m:
        return None
    try:
        v = float(m.group(1).replace(",", "."))
    except ValueError:
        return None
    return round(v * 1.609 if m.group(2) == "mi" else v / 1000 if m.group(2) == "m" else v, 1)


def rutas(salida, s: requests.Session | None = None) -> None:
    """espana_rutas.json: rutas de senderismo de OpenStreetMap (relaciones route=hiking) con su centro, nombre,
    código (GR, PR, SL…) y longitud, para «Rutas de senderismo cerca» en la ficha de cada lugar."""
    from safari.comun.ficheros import escribir_json
    from safari.practico import overpass

    d = overpass(CONSULTA_RUTAS, timeout=330)
    if not d:
        print("  Rutas: Overpass no respondió; no se escribe nada", flush=True)
        return
    xs = []
    for e in d.get("elements", []):
        t = e.get("tags", {})
        c = _centro(e)
        nombre = t.get("name:es") or t.get("name") or t.get("ref")
        if not c or not nombre:
            continue
        xs.append(
            {
                "id": e["id"],
                "n": nombre,
                "ref": t.get("ref"),
                "lat": round(c[0], 4),
                "lon": round(c[1], 4),
                "km": km_ruta(t.get("distance")),
            }
        )
    if not xs:
        print("  Rutas: ninguna; no se escribe nada", flush=True)
        return
    escribir_json(salida, {"fuente": "OpenStreetMap (ODbL)", "rutas": xs})
    print(f"{salida}: {len(xs)} rutas de senderismo", flush=True)
