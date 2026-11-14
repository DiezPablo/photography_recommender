"""Nombre científico y común en español de cada especie (clave de GBIF), con caché: la API de especies de GBIF no
pide cuenta. Una petición por especie la primera vez, con pausa."""

from __future__ import annotations

import csv
import re
import time
from functools import cache
from pathlib import Path

import requests

from rasante.comun.cache import CacheJson
from rasante.comun.red import sesion

API = "https://api.gbif.org/v1/species"
CACHE = CacheJson(prefijo="gbif_especie_")
PAUSA_S = 0.5


def especie(clave: int, s: requests.Session | None = None) -> dict:
    """{"c": científico, "n": nombre común en español o None}."""
    guardado = CACHE.leer(str(clave))
    if guardado is not None:
        return guardado
    s = s or sesion()
    time.sleep(PAUSA_S)
    base = s.get(f"{API}/{clave}", timeout=30).json()
    vern = s.get(f"{API}/{clave}/vernacularNames", params={"limit": 200}, timeout=30).json().get("results", [])
    nombres = [v["vernacularName"] for v in vern if v.get("language") == "spa" and v.get("vernacularName")]
    salida = {"c": base.get("canonicalName") or base.get("scientificName"), "n": nombres[0] if nombres else None}
    CACHE.guardar(str(clave), salida)
    return salida


CORRECCIONES = Path(__file__).resolve().parent.parent / "recursos" / "nombres_espana.csv"
# palabras que van con mayúscula dentro de un nombre común (topónimos y apellidos)
PROPIAS = {
    "audouin",
    "cuvier",
    "bonelli",
    "leach",
    "sandwich",
    "thekla",
    "cabrera",
    "madeira",
    "san",
    "antón",
    "nilo",
    "carbonell",
    "schreiber",
    "bocage",
}


@cache
def correcciones() -> dict[str, str]:
    """Nombres revisados a mano (SEO/BirdLife y SECEM) para los que GBIF trae uno de otro país o equivocado."""
    with CORRECCIONES.open(encoding="utf-8") as f:
        return {r["cientifico"]: r["nombre"] for r in csv.DictReader(f)}


def nombre_es(cientifico: str | None, bruto: str | None) -> str | None:
    """El nombre común que se muestra: el corregido a mano o el de GBIF limpio («"Golondrina Tijereta, …"» →
    «Golondrina tijereta»), en minúsculas salvo la inicial y los nombres propios."""
    if cientifico and cientifico in correcciones():
        return correcciones()[cientifico]
    if not bruto:
        return None
    t = re.split(r"[,|;]", bruto.strip().strip('"').strip())[0].strip()
    if not t:
        return None
    palabras = [p if p.lower() in PROPIAS and i else p.lower() for i, p in enumerate(t.split())]
    texto = " ".join(palabras)
    return texto[0].upper() + texto[1:]


ESTADOS = Path(__file__).resolve().parent.parent / "recursos" / "especies_estado_espana.csv"


@cache
def estados() -> dict[str, dict]:
    """Especies domésticas (se quitan), invasoras (con etiqueta) y con aviso, por nombre científico. Las invasoras
    según el Catálogo español de especies exóticas invasoras (RD 630/2013 y actualizaciones)."""
    with ESTADOS.open(encoding="utf-8") as f:
        return {r["cientifico"]: {"estado": r["estado"], "nota": r["nota"] or None} for r in csv.DictReader(f)}
