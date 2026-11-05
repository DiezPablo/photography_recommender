"""iNaturalist (API pública, sin clave): especies observadas alrededor de un punto, por mes y recientes.

Pide ≤ 1 petición por segundo, como recomienda iNaturalist. Solo se usan las fotos con licencia Creative
Commons (las «todos los derechos reservados» no se publican).
"""

from __future__ import annotations

import csv
import json
import time
from functools import cache
from pathlib import Path

import requests

from safari.comun.cache import CacheJson
from safari.comun.red import sesion
from safari.nombres_comunes import nombre_comun

API = "https://api.inaturalist.org/v1"
CACHE = CacheJson(prefijo="inat_", max_edad_s=25 * 86400)
CACHE_RECIENTE = CacheJson(prefijo="inat_reciente_", max_edad_s=6 * 3600)
_SESION = sesion()
_ultima = [0.0]


def _get(ruta: str, params: dict, cache: CacheJson = CACHE) -> dict:
    clave = json.dumps({"ruta": ruta, **params}, sort_keys=True)
    guardado = cache.leer(clave)
    if guardado is not None:
        return guardado
    for intento in range(5):
        espera = 1.0 - (time.time() - _ultima[0])
        if espera > 0:
            time.sleep(espera)
        _ultima[0] = time.time()
        try:
            r = _SESION.get(f"{API}/{ruta}", params=params, timeout=60)
        except (requests.ConnectionError, requests.Timeout):
            time.sleep(5 * (intento + 1))
            continue
        if r.status_code in (429, 500, 502, 503):
            time.sleep(int(r.headers.get("Retry-After", 0) or 20 * (intento + 1)))
            continue
        r.raise_for_status()
        datos = r.json()
        cache.guardar(clave, datos)
        return datos
    raise requests.ConnectionError(f"iNaturalist no responde: {ruta}")


def _zona(p: dict) -> dict:
    # solo grado de investigación (identificación confirmada por la comunidad): con «verificable» entraban errores
    # como el rinoceronte blanco en el Ngorongoro
    return {"lat": p["lat"], "lng": p["lon"], "radius": p["radio_km"], "quality_grade": "research"}


EXCLUSIONES = Path(__file__).resolve().parent / "recursos" / "exclusiones.csv"


@cache
def _exclusiones() -> dict[str, set[str]]:
    salida: dict[str, set[str]] = {}
    with EXCLUSIONES.open(encoding="utf-8") as f:
        for r in csv.DictReader(f):
            salida.setdefault(r["parque"], set()).add(r["cientifico"])
    return salida


def excluida(parque: str | None, cientifico: str | None) -> bool:
    """Domésticas (en todos los parques) y pares imposibles especie-parque (fuera de su área: errores de
    identificación), de recursos/exclusiones.csv."""
    if not cientifico:
        return False
    sp = " ".join(cientifico.split()[:2])
    e = _exclusiones()
    return sp in e.get("*", set()) or cientifico in e.get("*", set()) or sp in e.get(parque or "", set())


def foto(t: dict) -> dict | None:
    f = t.get("default_photo") or {}
    if not f.get("license_code") or not f.get("medium_url"):
        return None
    return {"url": f["medium_url"], "autor": f.get("attribution"), "licencia": f["license_code"].upper()}


def ficha_taxon(t: dict) -> dict:
    return {
        "taxon": t["id"],
        "cientifico": t["name"],
        "nombre": nombre_comun(t["name"], t.get("preferred_common_name")),
        "grupo": t.get("iconic_taxon_name"),
        "foto": foto(t),
    }


def foto_alternativa(taxon_id: int) -> dict | None:
    """Si la foto por defecto del taxón no tiene licencia abierta, la primera de sus otras fotos que sí la tenga
    (mejor sin ND, que no permite recortarla). Unas 19 especies estrella se quedaban sin foto."""
    d = _get(f"taxa/{taxon_id}", {"locale": "es"})
    fotos = [tp.get("photo") or {} for t in d.get("results", []) for tp in t.get("taxon_photos", [])]
    con_licencia = [f for f in fotos if f.get("license_code") and f.get("medium_url")]
    con_licencia.sort(key=lambda f: "nd" in f["license_code"].lower())
    if not con_licencia:
        return None
    f = con_licencia[0]
    return {"url": f["medium_url"], "autor": f.get("attribution"), "licencia": f["license_code"].upper()}


def taxon(cientifico: str) -> dict | None:
    """Taxón de iNaturalist por nombre científico exacto o sinónimo (Bison bison es Bos bison en iNaturalist)."""
    d = _get("taxa", {"q": cientifico, "rank": "species,subspecies", "locale": "es", "per_page": 10})
    buscado = cientifico.lower()
    for t in d.get("results", []):
        if buscado in (t.get("name", "").lower(), (t.get("matched_term") or "").lower()):
            ficha = ficha_taxon(t)
            if ficha["foto"] is None:
                ficha["foto"] = foto_alternativa(t["id"])
            return ficha
    return None


def especies(p: dict, grupo: str, n: int, desde: str | None = None, cache: CacheJson = CACHE) -> list[dict]:
    """Especies de un grupo (Mammalia, Aves, Reptilia…) con más observaciones alrededor del parque."""
    params = {**_zona(p), "iconic_taxa": grupo, "locale": "es", "per_page": n}
    if desde:
        params["d1"] = desde
    d = _get("observations/species_counts", params, cache)
    return [
        {**ficha_taxon(r["taxon"]), "n": r["count"]}
        for r in d.get("results", [])
        if not excluida(p.get("id"), r["taxon"].get("name"))
    ]


def conteos(p: dict, taxones: list[int], desde: str | None = None, cache: CacheJson = CACHE) -> dict[int, int]:
    """Observaciones de cada uno de esos taxones alrededor del parque (todas las fechas o desde `desde`)."""
    if not taxones:
        return {}
    params = {**_zona(p), "taxon_id": ",".join(map(str, sorted(taxones))), "per_page": 500}
    if desde:
        params["d1"] = desde
    d = _get("observations/species_counts", params, cache)
    pedidos = set(taxones)
    salida: dict[int, int] = {}
    for r in d.get("results", []):
        t = r["taxon"]
        if excluida(p.get("id"), t.get("name")):
            continue
        # una subespecie cuenta para la especie pedida
        clave = t["id"] if t["id"] in pedidos else next((a for a in t.get("ancestor_ids", []) if a in pedidos), None)
        if clave is not None:
            salida[clave] = salida.get(clave, 0) + r["count"]
    return salida


def por_mes(p: dict, grupo: str | None = None, taxon: int | None = None) -> list[int]:
    """Observaciones por mes del año (enero a diciembre), de un grupo, de un taxón o de todo."""
    params = {**_zona(p), "date_field": "observed", "interval": "month_of_year"}
    if grupo:
        params["iconic_taxa"] = grupo
    if taxon:
        params["taxon_id"] = taxon
    d = _get("observations/histogram", params)
    meses = d.get("results", {}).get("month_of_year", {})
    return [int(meses.get(str(m), 0)) for m in range(1, 13)]
