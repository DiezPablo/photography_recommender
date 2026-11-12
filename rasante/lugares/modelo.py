"""Convierte spots (spots.geojson) y lugares de fauna (espana_lugares.json, espana_natura.json) al núcleo común
de «lugar» (rasante/recursos/lugar.schema.json). Los dos catálogos no se fusionan (decisión 0015): un mismo sitio
puede estar en los dos, como dos lugares que se enlazan por cercanía."""

from __future__ import annotations

import math
from collections import defaultdict
from statistics import median

from rasante.comun.territorio import Provincias, ccaa_de

RUMBOS = ("N", "NE", "E", "SE", "S", "SO", "O", "NO")
KM_CERCA = 15.0
MAX_CERCA = 5

# tipo del descubrimiento (rasante.spots.candidatos) → tipo del esquema
TIPO_LUZ = {
    "mirador": "mirador",
    "cumbre": "cumbre",
    "cascada": "cascada",
    "faro": "faro",
    "cabo": "costa",
    "acantilado": "costa",
    "playa": "costa",
    "lago": "agua",
    "embalse": "agua",
    "canon": "canon",
    "cañón": "canon",
}
LICENCIAS = {
    "wikidata": ("Wikidata", "CC0"),
    "osm": ("OpenStreetMap", "ODbL"),
    "propio": ("Rasante (mis_spots.csv)", "propia"),
}
EBIRD = "Condiciones de uso de eBird (no comercial)"
NATURA = "Agencia Europea de Medio Ambiente (reutilización con atribución)"
FUENTES = {
    "Wikidata": "Lugares y espacios protegidos (CC0)",
    "OpenStreetMap": "Miradores, cumbres y observatorios (ODbL)",
    "Wikimedia Commons": "Fotos, con autor y licencia en cada una",
    "eBird": f"Puntos de observación. {EBIRD}",
    "Natura 2000": f"Límites de los espacios. {NATURA}",
}
# espacios Natura 2000 que no tienen lugar propio: mismo texto que la web (src/features/fauna/datos.ts)
TIPO_NATURA = {"A": "ZEPA", "B": "Red Natura 2000", "C": "ZEPA y ZEC"}


def km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia en km (haversine)."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 12742.0 * math.asin(math.sqrt(a))


def horizonte_por_rumbos(angulos: list[float] | None) -> dict[str, float] | None:
    """Altura del relieve hacia cada rumbo: mediana del perfil (un ángulo cada 360/n grados desde el norte) en
    el sector de 45° centrado en el rumbo."""
    if not angulos:
        return None
    n = len(angulos)
    paso = 360.0 / n
    salida = {}
    for i, rumbo in enumerate(RUMBOS):
        centro = i * 45.0
        sector = [a for j, a in enumerate(angulos) if abs((j * paso - centro + 180) % 360 - 180) <= 22.5]
        salida[rumbo] = round(median(sector), 1)
    return salida


def _numero(v) -> float | None:
    return float(v) if isinstance(v, int | float) and math.isfinite(v) else None


def de_spot(f: dict, costa=None) -> dict:
    """Un spot de spots.geojson (feature) como lugar del catálogo de luz."""
    p = f["properties"]
    lon, lat = f["geometry"]["coordinates"][:2]
    origen = p.get("origen") or "propio"
    fuente, licencia = LICENCIAS.get(origen, (str(origen), "desconocida"))
    ref = p.get("wikidata") if origen == "wikidata" else None
    fuentes = [{"fuente": fuente, "ref": ref, "licencia": licencia}]
    if origen != "wikidata" and p.get("wikidata"):
        fuentes.append({"fuente": "Wikidata", "ref": p["wikidata"], "licencia": "CC0"})
    galeria = p.get("galeria") or []
    foto = None
    if galeria and str(galeria[0].get("url", "")).startswith("https://"):
        g = galeria[0]
        foto = {"url": g["url"], "autor": g.get("autor") or None, "licencia": g.get("licencia") or None}
        fuentes.append({"fuente": "Wikimedia Commons", "ref": g.get("enlace") or None, "licencia": "la de cada foto"})
    lp = p.get("contaminacion") or {}
    tipo = TIPO_LUZ.get(p.get("tipo_osm") or "", "otro")
    return {
        "id": p["id"],
        "catalogo": "luz",
        "nombre": p["nombre"],
        "lat": round(lat, 5),
        "lon": round(lon, 5),
        "provincia": p.get("provincia"),
        "ccaa": ccaa_de(p.get("provincia"), p.get("ccaa")),
        "tipo": tipo,
        "fuentes": fuentes,
        "foto": foto,
        "acceso": {"aparcamiento_m": None, "accesible": None},
        "cerca": [],
        "eventos": [],
        "revisado": None,
        "luz": {
            "cielo_mag": _numero(lp.get("sqm")),
            "bortle": lp.get("bortle") if isinstance(lp.get("bortle"), int) else None,
            "horizonte": horizonte_por_rumbos((p.get("horizonte") or {}).get("angulos")),
            "costa": bool(costa and costa.es_costero({"lat": lat, "lon": lon, "tipo": p.get("tipo_osm")})),
            "popularidad": _numero(p.get("puntuacion")),
        },
    }


def con_natura(lugares: list[dict], sitios: dict[str, dict]) -> list[dict]:
    """Los lugares de fauna más los espacios Natura 2000 que no tienen ya uno de Wikidata (por código o por
    nombre), igual que hace la web."""
    codigos = {x["z"] for x in lugares if x.get("z")}
    nombres = {x["n"].lower() for x in lugares if x["id"].startswith("wd-")}
    extra = [
        {
            "id": f"n2k-{c}",
            "n": s["n"],
            "t": TIPO_NATURA.get(s.get("t") or "", "Red Natura 2000"),
            "lat": s["lat"],
            "lon": s["lon"],
            "r": round(min(30.0, max(1.0, math.sqrt((s.get("a") or 0) / math.pi))), 1),
            "z": c,
        }
        for c, s in sitios.items()
        if c not in codigos and s["n"].lower() not in nombres
    ]
    return [*lugares, *extra]


def _tipo_fauna(x: dict) -> str:
    t = x["t"].lower()
    if x["id"].startswith("eb-"):
        return "punto_de_observacion"
    if x["id"].startswith("osm-"):
        return "observatorio"
    return "humedal" if "humedal" in t or "ramsar" in t else "espacio_protegido"


def _fuentes_fauna(x: dict) -> list[dict]:
    origen, _, ref = x["id"].partition("-")
    if origen == "eb":
        return [{"fuente": "eBird", "ref": ref, "licencia": EBIRD}]
    if origen == "osm":
        return [{"fuente": "OpenStreetMap", "ref": ref.replace("-", "/", 1), "licencia": "ODbL"}]
    fuentes = [{"fuente": "Wikidata", "ref": ref, "licencia": "CC0"}] if origen == "wd" else []
    if x.get("z"):
        fuentes.append({"fuente": "Natura 2000", "ref": x["z"], "licencia": NATURA})
    return fuentes


def de_fauna(x: dict, sitios: dict[str, dict], provincias: Provincias, celdas_en_radio) -> dict | None:
    """Un lugar de espana_lugares.json (o un espacio Natura 2000) como lugar del catálogo de fauna. None si cae
    fuera de España (o mar adentro: sin provincia no entra en el índice)."""
    info = provincias.de(x["lat"], x["lon"])
    if not info or not info.get("provincia"):
        return None
    sitio = sitios.get(x.get("z") or "")
    radio = float(x.get("r") or 2)
    celdas = (sitio or {}).get("celdas") or celdas_en_radio(x["lat"], x["lon"], min(radio, 10))
    protegido = x["id"].startswith(("wd-", "n2k-"))
    return {
        "id": x["id"],
        "catalogo": "fauna",
        "nombre": x["n"],
        "lat": round(x["lat"], 5),
        "lon": round(x["lon"], 5),
        "provincia": info["provincia"],
        "ccaa": ccaa_de(info["provincia"], info.get("ccaa")),
        "tipo": _tipo_fauna(x),
        "fuentes": _fuentes_fauna(x),
        "foto": None,
        "acceso": {"aparcamiento_m": None, "accesible": None},
        "cerca": [],
        "eventos": [],
        "revisado": None,
        "fauna": {
            "celdas": sorted(celdas),
            "radio_km": radio,
            "espacio": {"nombre": x["n"], "figura": x["t"]} if protegido else None,
            "natura": x.get("z"),
            "especies_ebird": x["e"] if isinstance(x.get("e"), int) else None,
        },
    }


def enlazar_cerca(lugares: list[dict], km_max: float = KM_CERCA, n: int = MAX_CERCA) -> None:
    """Rellena `cerca`: los lugares del otro catálogo a km_max o menos, del más cercano al más lejano."""
    paso = 0.25  # grados; 15 km caben siempre en la celda y sus vecinas
    rejilla: dict[tuple[str, int, int], list[dict]] = defaultdict(list)
    for x in lugares:
        rejilla[(x["catalogo"], int(x["lat"] // paso), int(x["lon"] // paso))].append(x)
    for x in lugares:
        otro = "fauna" if x["catalogo"] == "luz" else "luz"
        i, j = int(x["lat"] // paso), int(x["lon"] // paso)
        candidatos = []
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                for y in rejilla.get((otro, i + di, j + dj), ()):
                    d = km(x["lat"], x["lon"], y["lat"], y["lon"])
                    if d <= km_max:
                        candidatos.append((d, y["id"]))
        x["cerca"] = [id_ for _, id_ in sorted(candidatos)[:n]]


def enlazar_eventos(lugares: list[dict], eventos: list[dict]) -> None:
    """Rellena `eventos`: los de fauna en los lugares de fauna y los de paisaje en los spots, si el lugar cae
    dentro del radio del evento."""
    for x in lugares:
        x["eventos"] = [
            e["id"]
            for e in eventos
            if (e["categoria"] == "fauna") == (x["catalogo"] == "fauna")
            and km(x["lat"], x["lon"], e["lat"], e["lon"]) <= e["radio_km"]
        ]


def resumen(lugares: list[dict]) -> dict:
    """Recuentos por catálogo, tipo y comunidad (para el fichero y para la auditoría, spec 002)."""
    por = lambda clave: {
        cat: dict(sorted(_contar(x[clave] for x in lugares if x["catalogo"] == cat).items(), key=lambda kv: -kv[1]))
        for cat in ("luz", "fauna")
    }
    return {
        "total": len(lugares),
        "catalogo": _contar(x["catalogo"] for x in lugares),
        "tipo": por("tipo"),
        "ccaa": por("ccaa"),
        "con_foto": sum(1 for x in lugares if x["foto"]),
        "con_cerca": _contar(x["catalogo"] for x in lugares if x["cerca"]),
        "con_eventos": _contar(x["catalogo"] for x in lugares if x["eventos"]),
    }


def _contar(valores) -> dict:
    cuenta: dict = defaultdict(int)
    for v in valores:
        cuenta[v] += 1
    return dict(cuenta)
