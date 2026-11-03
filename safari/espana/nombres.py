"""Nombre científico y común en español de cada especie (clave de GBIF), con caché: la API de especies de GBIF no
pide cuenta. Una petición por especie la primera vez, con pausa."""

from __future__ import annotations

import time

import requests

from safari.comun.cache import CacheJson
from safari.comun.red import sesion

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
