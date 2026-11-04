"""Descargas SQL de GBIF: observaciones de España agrupadas por celda de 10 km, especie, año y mes.

Una sola descarga (asíncrona: se pide, se espera y se baja un ZIP con un TSV) sustituye a millones de consultas a
la API normal. Necesita una cuenta de GBIF (GBIF_USUARIO, GBIF_CLAVE en el entorno); sin ella, no hace nada.
Documentación: https://techdocs.gbif.org/en/data-use/api-sql-downloads (función experimental: comprobarla si
cambia). Cada descarga tiene un DOI que hay que citar en la web.
"""

from __future__ import annotations

import csv
import io
import os
import time
import zipfile
from collections.abc import Iterable

import requests

from safari.comun.red import sesion

API = "https://api.gbif.org/v1/occurrence/download"
# clases de GBIF que interesan para fotografiar fauna: aves, mamíferos, reptiles y anfibios
CLASES = {"Aves": 212, "Mammalia": 359, "Reptilia": 358, "Amphibia": 131}
# En el backbone de GBIF «Reptilia» ya no es una clase (es sinónimo pro parte): los reptiles cuelgan de Squamata,
# Testudines y Crocodylia, que se piden y se juntan de nuevo en Reptilia (358)
REPTILES = {11592253: 358, 11418114: 358, 11493978: 358}
PAUSA_S = 60


def credenciales() -> tuple[str, str] | None:
    usuario, clave = os.environ.get("GBIF_USUARIO"), os.environ.get("GBIF_CLAVE")
    return (usuario, clave) if usuario and clave else None


def consulta(pais: str = "ES", desde: int = 2005, clases: Iterable[int] = (*CLASES.values(), *REPTILES)) -> str:
    """SQL de la descarga: recuentos por celda de 10 km, clase, especie, año y mes (año para el backtest).

    La tabla SQL de GBIF clasifica por defecto con Catalogue of Life (claves de texto como «V2» para Aves); las
    claves numéricas del backbone de GBIF, las que usa el resto de la app, van con el prefijo
    `gbif_classification.` (y como texto). Con `classKey IN (212, …)` la descarga salía vacía.
    """
    lista = ", ".join(f"'{c}'" for c in clases)
    celda = "GBIF_EEARGCode(10000, decimalLatitude, decimalLongitude, COALESCE(coordinateUncertaintyInMeters, 1000))"
    clase, especie = "occurrence.gbif_classification.classkey", "occurrence.gbif_classification.specieskey"
    return (
        f'SELECT {celda} AS celda, {clase} AS classkey, {especie} AS specieskey, "year", "month", '
        "COUNT(*) AS n FROM occurrence "
        f"WHERE countryCode = '{pais}' AND hasCoordinate = TRUE AND hasGeospatialIssues = FALSE "
        f'AND {especie} IS NOT NULL AND "month" IS NOT NULL AND "year" >= {desde} '
        f"AND occurrenceStatus = 'PRESENT' AND {clase} IN ({lista}) "
        f'GROUP BY {celda}, {clase}, {especie}, "year", "month"'
    )


def pedir(sql: str, s: requests.Session | None = None) -> str | None:
    """Pide la descarga y devuelve su clave (o None sin credenciales)."""
    cred = credenciales()
    if not cred:
        print("  GBIF: sin GBIF_USUARIO/GBIF_CLAVE, no se descarga nada", flush=True)
        return None
    s = s or sesion()
    r = s.post(
        f"{API}/request",
        json={"sendNotification": False, "format": "SQL_TSV_ZIP", "sql": sql},
        auth=cred,
        timeout=60,
    )
    r.raise_for_status()
    return r.text.strip()


def esperar(clave: str, max_minutos: float = 180, s: requests.Session | None = None) -> dict:
    """Espera a que la descarga termine; devuelve sus metadatos (downloadLink, doi, totalRecords…)."""
    s = s or sesion()
    fin = time.time() + max_minutos * 60
    while time.time() < fin:
        d = s.get(f"{API}/{clave}", timeout=60).json()
        estado = d.get("status")
        print(f"  GBIF {clave}: {estado}", flush=True)
        if estado == "SUCCEEDED":
            return d
        if estado in ("FAILED", "KILLED", "CANCELLED"):
            raise RuntimeError(f"La descarga {clave} acabó en {estado}")
        time.sleep(PAUSA_S)
    raise TimeoutError(f"La descarga {clave} no terminó en {max_minutos} minutos")


def filas(zip_bytes: bytes) -> list[dict]:
    """Lee el TSV de dentro del ZIP: [{celda, clase, especie, anio, mes, n}]."""
    salida = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        nombre = next(n for n in z.namelist() if n.endswith((".csv", ".tsv", ".txt")) or "." not in n)
        texto = z.read(nombre).decode("utf-8")
    for f in csv.DictReader(io.StringIO(texto), delimiter="\t"):
        g = {k.lower(): v for k, v in f.items()}
        if not g["celda"]:
            continue  # sin celda: incertidumbre mayor que la cuadrícula
        salida.append(
            {
                "celda": g["celda"],
                "clase": REPTILES.get(int(g["classkey"]), int(g["classkey"])),
                "especie": int(g["specieskey"]),
                "anio": int(g["year"]),
                "mes": int(g["month"]),
                "n": int(g["n"]),
            }
        )
    return salida


def descargar(sql: str | None = None) -> tuple[list[dict], dict] | None:
    """Todo el proceso: pedir, esperar y leer. None sin credenciales."""
    s = sesion()
    clave = pedir(sql or consulta(), s)
    if not clave:
        return None
    meta = esperar(clave, s=s)
    zip_bytes = s.get(meta["downloadLink"], timeout=600).content
    return filas(zip_bytes), {"clave": clave, "doi": meta.get("doi"), "registros": meta.get("totalRecords")}
