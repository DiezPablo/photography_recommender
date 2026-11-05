"""Nombres comunes en español (España) de las especies de safari: un diccionario revisado a mano
(recursos/nombres_safari.csv) que manda sobre iNaturalist y, para el resto, una limpieza: sin el guion blando
invisible (U+00AD), «de el» → «del», y mayúscula solo en la inicial y en los nombres propios
(recursos/nombres_propios.txt): «Elefante Marino Del Sur» → «Elefante marino del sur», «León Marino de las
Galápagos» → «León marino de las Galápagos». La web usa los mismos ficheros para los nombres que pide en directo.
"""

from __future__ import annotations

import csv
import re
from functools import cache
from pathlib import Path

RECURSOS = Path(__file__).resolve().parent / "recursos"


@cache
def diccionario() -> dict[str, str]:
    with (RECURSOS / "nombres_safari.csv").open(encoding="utf-8") as f:
        return {r["cientifico"]: r["nombre"] for r in csv.DictReader(f)}


@cache
def propios() -> set[str]:
    lineas = (RECURSOS / "nombres_propios.txt").read_text(encoding="utf-8").splitlines()
    return {x.strip() for x in lineas if x.strip() and not x.startswith("#")}


def mayusculas(nombre: str) -> str:
    """Mayúscula en la inicial y en los nombres propios; el resto, en minúscula."""
    p = propios()
    palabras = nombre.split(" ")
    salida = []
    for i, w in enumerate(palabras):
        partes = w.split("-")
        salida.append(
            "-".join(x if x in p or (x[:1].upper() + x[1:].lower()) in p else x.lower() for x in partes) if i else w
        )
    texto = " ".join(salida)
    # «El» solo es propio tras «de» («Damán de El Cabo» no, pero sí en topónimos con artículo)
    texto = re.sub(r"\bde El\b(?! [A-ZÁÉÍÓÚ])", "de el", texto)
    texto = texto[:1].upper() + texto[1:]
    return re.sub(r"\bde el\b", "del", texto)


def nombre_comun(cientifico: str | None, bruto: str | None) -> str | None:
    """El nombre que se enseña: el del diccionario o el de iNaturalist limpio; None si no hay (o es el científico)."""
    if cientifico:
        sp = " ".join(cientifico.split()[:2])
        d = diccionario()
        if cientifico in d or sp in d:
            return d.get(cientifico) or d[sp]
    if not bruto:
        return None
    limpio = re.sub(r"\s+", " ", bruto.replace("­", "")).strip()
    if not limpio or (cientifico and limpio.lower() == cientifico.lower()):
        return None  # sin traducir: la web enseña el científico y queda marcado como pendiente
    return mayusculas(limpio[:1].upper() + limpio[1:])
