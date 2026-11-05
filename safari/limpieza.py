"""Limpieza de los operadores y alojamientos que salen de OpenStreetMap: fuera aerolíneas, bares y nombres
cortados; un solo registro por empresa (misma web o mismo teléfono) y por alojamiento (mismo nombre a menos de
500 m), y cada alojamiento en el parque más cercano cuando cae en el círculo de varios."""

import math
import re
import unicodedata
from urllib.parse import urlparse

# OSM etiqueta como agencia de viajes las oficinas de las aerolíneas y los alquileres de coches
NO_OPERADOR = re.compile(
    r"\b(air(lines?|ways)?|aviation|flights?|airport|aeropuerto|emirates|qatar|klm|lufthansa|turkish|ethiopian|"
    r"kenya airways|precision|fastjet|rwandair|safarilink|auric|car (hire|rental)|rent[- ]?a[- ]?car|hertz|avis|"
    r"europcar|bus|coach|shuttle|exchange|bureau de change|bank|money)\b",
    re.IGNORECASE,
)
# bares y restaurantes que alguien etiquetó como hotel o casa de huéspedes
NO_ALOJAMIENTO = re.compile(
    r"\b(bar|pub|club|restaurant|restaurante|grill|disco|night ?club|butchery)\b", re.IGNORECASE
)
MIN_LETRAS = 3


def _sin_acentos(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")


def clave_nombre(nombre: str) -> str:
    """Nombre comparable: sin acentos, mayúsculas, signos ni palabras de relleno."""
    t = re.sub(r"[^a-z0-9 ]", " ", _sin_acentos(nombre).lower())
    t = re.sub(r"\b(the|ltd|limited|co|company|and|y|de|del|la|el)\b", " ", t)
    return " ".join(t.split())


def ortografia(nombre: str) -> str:
    """Espacios repetidos fuera y los nombres escritos todo en mayúsculas, en tipo título («SERENA LODGE» →
    «Serena Lodge»); el resto se deja como lo escribió su dueño."""
    t = " ".join(nombre.split()).strip(" -–,.")
    letras = [c for c in t if c.isalpha()]
    if len(letras) > 4 and all(c.isupper() for c in letras):
        t = " ".join(p if len(p) <= 3 and p.isupper() and not p.isalpha() else p.capitalize() for p in t.split())
    return t


def cortado(nombre: str) -> bool:
    """Nombres a medias: muy cortos o que acaban en puntos suspensivos, guion o «&»."""
    t = nombre.strip()
    return sum(c.isalpha() for c in t) < MIN_LETRAS or bool(re.search(r"(\.\.\.|…|[-–&/(,])$", t))


def dominio(web: str | None) -> str | None:
    if not web:
        return None
    host = urlparse(web if "://" in web else f"https://{web}").netloc.lower()
    host = host.removeprefix("www.")
    # las páginas de Facebook o Instagram no identifican a la empresa por el dominio
    return None if not host or host.endswith(("facebook.com", "instagram.com", "wa.me", "google.com")) else host


def telefono(t: str | None) -> str | None:
    """Los últimos nueve dígitos: igual con o sin prefijo del país."""
    d = re.sub(r"\D", "", t or "")
    return d[-9:] if len(d) >= 7 else None


def operadores(lista: list[dict]) -> list[dict]:
    """Fuera aerolíneas y similares, y uno por empresa (misma web, mismo teléfono o mismo nombre)."""
    salida, vistos = [], set()
    for o in lista:
        if NO_OPERADOR.search(o["nombre"]) or cortado(o["nombre"]):
            continue
        claves = {("n", clave_nombre(o["nombre"]))}
        if d := dominio(o.get("web")):
            claves.add(("w", d))
        if f := telefono(o.get("telefono")):
            claves.add(("t", f))
        if claves & vistos:
            continue
        vistos |= claves
        salida.append({**o, "nombre": ortografia(o["nombre"])})
    return salida


def _metros(a: dict, b: dict) -> float:
    dy = (a["lat"] - b["lat"]) * 111_320
    dx = (a["lon"] - b["lon"]) * 111_320 * math.cos(math.radians(a["lat"]))
    return math.hypot(dx, dy)


def alojamientos(lista: list[dict]) -> list[dict]:
    """Fuera bares y nombres cortados; un alojamiento con el mismo nombre (o la misma web) a menos de 500 m es el
    mismo, mapeado dos veces (el edificio y un punto)."""
    salida: list[dict] = []
    for a in lista:
        if NO_ALOJAMIENTO.search(a["nombre"]) or cortado(a["nombre"]):
            continue
        a = {**a, "nombre": ortografia(a["nombre"])}
        n, d = clave_nombre(a["nombre"]), dominio(a.get("web"))
        if any(
            _metros(a, b) < 500 and (n == clave_nombre(b["nombre"]) or (d and d == dominio(b.get("web"))))
            for b in salida
        ):
            continue
        salida.append(a)
    return salida


def repartir(listas: list[list[dict]]) -> list[list[dict]]:
    """Un alojamiento que cae en el círculo de dos parques (Ngorongoro y Serengeti, Kruger y Sabi Sands) se queda
    solo en el más cercano (`km` al centro de cada parque)."""
    mejor: dict[str, tuple[float, int]] = {}
    for i, lista in enumerate(listas):
        for a in lista:
            if a.get("osm") and a.get("km") is not None and (a["osm"] not in mejor or a["km"] < mejor[a["osm"]][0]):
                mejor[a["osm"]] = (a["km"], i)
    return [
        [a for a in lista if a.get("osm") not in mejor or mejor[a["osm"]][1] == i] for i, lista in enumerate(listas)
    ]


def repartir_alojamientos(parques: list[dict]) -> None:
    """`repartir` sobre los alojamientos de OSM de cada parque del mundo, en el sitio."""
    con = [p for p in parques if p.get("osm")]
    for p, lista in zip(con, repartir([p["osm"]["alojamientos"] for p in con]), strict=True):
        p["osm"]["alojamientos"] = lista
