"""iNaturalist en España (API pública, ≤ 1 petición/s con el cliente de `safari.inat`):

- `recientes()`: mamíferos, reptiles y anfibios vistos en 30 días (grado de investigación), la última de cada
  especie por zona de ~10 km, para «visto hace poco» junto a las aves de eBird. Sin las observaciones con
  coordenadas ocultas ni las especies que se persiguen o se cogen (lince, oso, lobo, desmán, tortugas): de esas,
  nada reciente. Sin la dirección (puede ser una calle): solo el punto a 2 decimales.
- `actividad()`: a qué hora se ve cada especie, por la altura del sol en el momento de cada foto (noche,
  crepúsculo o día) y comparada con su grupo, que corrige cuándo sale la gente.
"""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta

from safari import inat
from safari.espana import nombres

ESPANA = 6774
GRUPOS = "Mammalia,Reptilia,Amphibia"
SENSIBLES = {
    "Lynx pardinus",
    "Ursus arctos",
    "Canis lupus",
    "Galemys pyrenaicus",
    "Testudo graeca",
    "Testudo hermanni",
    "Mustela lutreola",
}
TRAMOS = ("noche", "crepusculo", "dia")


def especie(nombre: str) -> str:
    return " ".join(nombre.split()[:2])


def recientes(dias: int = 30, hoy: date | None = None) -> list[dict]:
    """[{c, f, lat, lon, l: None, s: "i"}]: la última de cada especie por celda de ~0,1°."""
    hoy = hoy or date.today()
    desde = (hoy - timedelta(days=dias)).isoformat()
    ultimas: dict[tuple[str, int, int], dict] = {}
    pagina = 1
    while True:
        d = inat._get(
            "observations",
            {
                "place_id": ESPANA,
                "iconic_taxa": GRUPOS,
                "d1": desde,
                "quality_grade": "research",
                "per_page": 200,
                "page": pagina,
                "order_by": "observed_on",
            },
            inat.CACHE_RECIENTE,
        )
        for o in d.get("results", []):
            nombre = especie((o.get("taxon") or {}).get("name") or "")
            if (
                not nombre
                or " " not in nombre
                or nombre in SENSIBLES
                or nombres.estados().get(nombre, {}).get("estado") == "domestica"
                or o.get("obscured")
                or o.get("geoprivacy") in ("obscured", "private")
                or o.get("taxon_geoprivacy") in ("obscured", "private")
                or not o.get("location")
                or not o.get("observed_on")
            ):
                continue
            lat, lon = (float(x) for x in o["location"].split(","))
            clave = (nombre, round(lat * 10), round(lon * 10))
            if clave not in ultimas or o["observed_on"] > ultimas[clave]["f"]:
                ultimas[clave] = {
                    "c": nombre,
                    "f": o["observed_on"],
                    "lat": round(lat, 2),
                    "lon": round(lon, 2),
                    "l": None,
                    "s": "i",
                }
        if pagina * 200 >= min(d.get("total_results", 0), 10000):
            break
        pagina += 1
    return list(ultimas.values())


def altura_sol(cuando: datetime, lat: float, lon: float) -> float:
    """Altura del sol en grados (fórmulas de NOAA, precisión de un grado: de sobra para día/crepúsculo/noche)."""
    t = cuando.astimezone(UTC)
    n = t.timetuple().tm_yday
    hora = t.hour + t.minute / 60
    g = 2 * math.pi / 365 * (n - 1 + (hora - 12) / 24)
    decl = (
        0.006918
        - 0.399912 * math.cos(g)
        + 0.070257 * math.sin(g)
        - 0.006758 * math.cos(2 * g)
        + 0.000907 * math.sin(2 * g)
        - 0.002697 * math.cos(3 * g)
        + 0.00148 * math.sin(3 * g)
    )
    ecuacion = 229.18 * (
        0.000075
        + 0.001868 * math.cos(g)
        - 0.032077 * math.sin(g)
        - 0.014615 * math.cos(2 * g)
        - 0.040849 * math.sin(2 * g)
    )
    minutos_solares = hora * 60 + ecuacion + 4 * lon
    angulo = math.radians(minutos_solares / 4 - 180)
    phi = math.radians(lat)
    cos_cenit = math.sin(phi) * math.sin(decl) + math.cos(phi) * math.cos(decl) * math.cos(angulo)
    return 90 - math.degrees(math.acos(max(-1.0, min(1.0, cos_cenit))))


def tramo(altura: float) -> str:
    """Noche con el sol 6° bajo el horizonte o más; crepúsculo hasta 15° sobre él (alba y última luz, la hora
    dorada y un poco más); día por encima."""
    return "noche" if altura < -6 else "crepusculo" if altura < 15 else "dia"


def tramos_especie(cientifico: str, max_obs: int = 200) -> dict[str, int]:
    """Cuántas observaciones con hora de la especie en España caen en cada tramo (una página de la API)."""
    d = inat._get(
        "observations",
        {
            "place_id": ESPANA,
            "taxon_name": cientifico,
            "quality_grade": "research",
            "per_page": max_obs,
            "order_by": "created_at",
        },
    )
    cuenta = dict.fromkeys(TRAMOS, 0)
    for o in d.get("results", []):
        if not o.get("time_observed_at") or not o.get("location") or o.get("obscured"):
            continue
        try:
            cuando = datetime.fromisoformat(o["time_observed_at"])
        except ValueError:
            continue
        lat, lon = (float(x) for x in o["location"].split(","))
        cuenta[tramo(altura_sol(cuando, lat, lon))] += 1
    return cuenta


def perfil(cuentas: dict[str, dict[str, int]], grupo_de: dict[str, str]) -> dict[str, dict]:
    """{especie: {"f": [noche, crepúsculo, día] en 0-1, "n": observaciones}}: cuánto más (o menos) aparece en cada
    tramo que su grupo, escalado a su mejor tramo. Corrige que la gente sale más de día: un búho sale de noche
    aunque tenga más fotos de día que de noche en total, si su grupo tiene muchas menos de noche."""
    grupos: dict[str, dict[str, int]] = defaultdict(lambda: dict.fromkeys(TRAMOS, 0))
    for c, x in cuentas.items():
        for t in TRAMOS:
            grupos[grupo_de.get(c, "")][t] += x[t]
    salida = {}
    for c, x in cuentas.items():
        n = sum(x.values())
        g = grupos[grupo_de.get(c, "")]
        ng = sum(g.values())
        if n < 10 or not ng:
            continue
        razon = [(x[t] / n) / (g[t] / ng) if g[t] else 0 for t in TRAMOS]
        tope = max(razon) or 1
        salida[c] = {"f": [round(r / tope, 2) for r in razon], "n": n}
    return salida


def actividad_main(salida, espana_json) -> None:
    """espana_actividad.json a partir de las especies de espana.json (una petición por especie, con caché de 25
    días: la primera vez unos 15 minutos)."""
    import json
    from pathlib import Path

    from safari.comun.ficheros import escribir_json

    especies = json.loads(Path(espana_json).read_text(encoding="utf-8"))["especies"]
    grupo_de = {e["c"]: e.get("clase") or "" for e in especies.values() if e.get("c")}
    cuentas = {}
    for c in sorted(grupo_de):
        try:
            cuentas[c] = tramos_especie(c)
        except Exception as e:  # una especie que falla no tumba las demás
            print(f"  actividad {c}: {e}", flush=True)
    datos = perfil(cuentas, grupo_de)
    escribir_json(
        salida,
        {
            "generado": date.today().isoformat(),
            "fuente": "iNaturalist (hora de las observaciones de grado de investigación en España)",
            "tramos": list(TRAMOS),
            "especies": datos,
        },
    )
    print(f"{salida}: actividad de {len(datos)} especies", flush=True)
