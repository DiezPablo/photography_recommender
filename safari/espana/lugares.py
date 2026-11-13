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
import unicodedata
from collections import defaultdict

import requests

from safari.comun.red import sesion
from safari.espana import ebird, nombres_lugares

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

    d = None
    for intento in range(3):  # la consulta de toda España a veces no entra a la primera
        d = overpass(CONSULTA_OBSERVATORIOS + f"// intento {intento}\n", timeout=300)
        if d:
            break
        time.sleep(60 * (intento + 1))
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


def clave_nombre(nombre: str) -> str:
    """El nombre sin tildes, mayúsculas ni signos: «Complexo Ons - O Grove» y «Complexo Ons-O Grove» son el mismo."""
    sin = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", sin).strip()


def _km(x: dict, y: dict) -> float:
    return math.dist((x["lat"], x["lon"] * 0.8), (y["lat"], y["lon"] * 0.8)) * 111


def _heredar(queda: dict, sobra: dict) -> None:
    """Lo que el lugar que se quita sabía y el que se queda no: especies de eBird y código Natura 2000."""
    for campo in ("e", "z"):
        if sobra.get(campo) and not queda.get(campo):
            queda[campo] = sobra[campo]


def sin_repetir(xs: list[dict], km: float = 3) -> list[dict]:
    """Quita los lugares con el mismo nombre que otro ya visto a menos de km (dos observatorios de una laguna, o
    el punto de eBird de un espacio que ya está). El que queda hereda las especies de eBird y el código Natura."""
    vistos: dict[str, list[dict]] = {}
    salida = []
    for x in xs:
        clave = clave_nombre(x["n"])
        ya = next((y for y in vistos.get(clave, []) if _km(x, y) < km), None)
        if ya:
            _heredar(ya, x)
            continue
        vistos.setdefault(clave, []).append(x)
        salida.append(x)
    return salida


# De la figura que más dice a quien busca dónde ir a la que menos: el parque antes que la ZEC del mismo sitio
FIGURAS = (
    "Parque nacional",
    "Parque natural",
    "Reserva natural",
    "Paraje natural",
    "Monumento natural",
    "Paisaje protegido",
    "Parque periurbano",
    "Humedal Ramsar",
    "Microrreserva",
    "Reserva de la biosfera",
    "ZEPA",
    "Red Natura 2000",
    "Espacio protegido",
)


def una_figura(xs: list[dict], metros: float = 100) -> list[dict]:
    """Un espacio con varias figuras (parque natural, ZEC, reserva de la biosfera…) viene de Wikidata como varios
    lugares en el mismo punto: queda el de la figura más conocida, con el mayor radio y el código Natura 2000."""
    espacios = [x for x in xs if x["id"].startswith("wd-")]
    grupo = {x["id"]: x["id"] for x in espacios}

    def raiz(i: str) -> str:
        while grupo[i] != i:
            grupo[i] = grupo[grupo[i]]
            i = grupo[i]
        return i

    rejilla: dict[tuple[int, int], list[dict]] = defaultdict(list)
    for x in espacios:
        rejilla[(round(x["lat"] * 100), round(x["lon"] * 100))].append(x)
    for (i, j), celda in rejilla.items():
        vecinos = [y for di in (-1, 0, 1) for dj in (-1, 0, 1) for y in rejilla.get((i + di, j + dj), ())]
        for x in celda:
            for y in vecinos:
                if x["id"] < y["id"] and _km(x, y) * 1000 < metros:
                    grupo[raiz(x["id"])] = raiz(y["id"])
    juntos: dict[str, list[dict]] = defaultdict(list)
    for x in espacios:
        juntos[raiz(x["id"])].append(x)
    fuera: set[str] = set()
    orden = {f: n for n, f in enumerate(FIGURAS)}
    for varios in juntos.values():
        if len(varios) < 2:
            continue
        queda = min(varios, key=lambda x: (orden.get(x["t"], len(FIGURAS)), -x["r"], x["id"]))
        for sobra in varios:
            if sobra is not queda:
                _heredar(queda, sobra)
                queda["r"] = max(queda["r"], sobra["r"])
                fuera.add(sobra["id"])
    return [x for x in xs if x["id"] not in fuera]


def con_codigo_natura(xs: list[dict], sitios: dict[str, dict], km: float = 3) -> None:
    """Un espacio Natura 2000 sin lugar propio pero con un lugar del mismo nombre al lado (casi siempre su punto de
    eBird): ese lugar se queda con el código, y con él su contorno y sus cuadrículas, en vez de salir dos veces."""
    con_codigo = {x["z"] for x in xs if x.get("z")}
    por_nombre: dict[str, list[dict]] = defaultdict(list)
    for x in xs:
        por_nombre[clave_nombre(x["n"])].append(x)
    for codigo, s in sitios.items():
        if codigo in con_codigo:
            continue
        cerca = [x for x in por_nombre.get(clave_nombre(s["n"]), []) if not x.get("z") and _km(x, s) < km]
        if cerca:
            min(cerca, key=lambda x: _km(x, s))["z"] = codigo


PUBLICADO = "https://github.com/DiezPablo/photography_recommender/releases/download/datos/espana_lugares.json.gz"


def observatorios_publicados(s: requests.Session) -> list[dict]:
    """Si Overpass falla, los observatorios ya publicados por este proyecto (ids osm-node-…, osm-way-…); los de
    formatos anteriores no se reutilizan."""
    import gzip
    import json

    try:
        r = s.get(PUBLICADO, timeout=120)
        r.raise_for_status()
        xs = json.loads(gzip.decompress(r.content))["lugares"]
    except (requests.RequestException, ValueError, KeyError, OSError):
        return []
    return [x for x in xs if re.match(r"osm-(node|way|relation)-\d+$", x.get("id", ""))]


def unificar(xs: list[dict], sitios: dict[str, dict] | None = None) -> list[dict]:
    """Sin repetidos (spec 019): un espacio antes que su punto de eBird homónimo, una sola figura por espacio y el
    código Natura 2000 para el lugar que se llama igual que un espacio sin lugar propio."""
    prioridad = {"wd": 0, "eb": 1, "osm": 2}
    xs = sorted(xs, key=lambda x: prioridad.get(x["id"].split("-")[0], 3))  # estable: dentro de cada fuente, igual
    xs = una_figura(sin_repetir(xs))
    con_codigo_natura(xs, sitios or {})
    return xs


def todos(
    s: requests.Session | None = None, sitios: dict[str, dict] | None = None
) -> tuple[list[dict], dict[str, int]]:
    """Los lugares de las tres fuentes y cuántos de cada una (una fuente que falla no tumba a las demás)."""
    s = s or sesion()
    salida, cuenta = [], {}
    for nombre, f in (("eBird", hotspots), ("Wikidata", protegidos), ("OpenStreetMap", observatorios)):
        try:
            xs = f(s)
        except (requests.RequestException, KeyError, ValueError) as e:
            print(f"  lugares {nombre}: {e}", flush=True)
            xs = observatorios_publicados(s) if nombre == "OpenStreetMap" else []
            if xs:
                print(f"  lugares {nombre}: se reutilizan {len(xs)} ya publicados", flush=True)
        cuenta[nombre] = len(xs)
        salida += xs
    # nombres en español: sin avisos ni abreviaturas de eBird, tipos de Wikidata y observatorios de OSM traducidos
    for x in salida:
        if x["id"].startswith("eb-"):
            x["n"] = nombres_lugares.ebird(x["n"])
        elif x["id"].startswith("wd-"):
            x["n"] = nombres_lugares.wikidata(x["n"])
        elif x["id"].startswith("osm-"):
            x["n"] = nombres_lugares.observatorio(x.get("n"))
    # observatorios sin nombre: «Observatorio de aves junto a <el lugar con nombre más cercano a menos de 5 km>»
    con_nombre = [x for x in salida if x.get("n")]
    for x in salida:
        if x.get("n"):
            continue
        cerca = min(con_nombre, key=lambda y: math.dist((x["lat"], x["lon"]), (y["lat"], y["lon"])), default=None)
        km = math.dist((x["lat"], x["lon"] * 0.8), (cerca["lat"], cerca["lon"] * 0.8)) * 111 if cerca else 99
        x["n"] = f"Observatorio de aves junto a {cerca['n']}" if cerca and km < 5 else "Observatorio de aves"
    salida = unificar(salida, sitios)
    cuenta = {f: sum(1 for x in salida if x["id"].startswith(p)) for f, p in PREFIJOS.items()}
    return salida, cuenta


def main(salida, natura=None) -> None:
    """`natura`: espana_natura.json ya escrito (para dar su código a los lugares homónimos); puede no existir."""
    import json
    from datetime import date

    from safari.comun.ficheros import escribir_json

    sitios = json.loads(natura.read_text(encoding="utf-8")).get("sitios", {}) if natura and natura.exists() else {}
    xs, cuenta = todos(sitios=sitios)
    # sin observatorios (Overpass caído y nada propio publicado) se publica igual: mejor sin ellos un día que con
    # los de otro proyecto
    faltan = [f for f, n in cuenta.items() if not n and f not in ("OpenStreetMap",) and (f != "eBird" or ebird.clave())]
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
