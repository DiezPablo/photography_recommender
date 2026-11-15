"""Puntuación de los candidatos para elegir los spots: popularidad en Commons y Wikipedia, tipo de lugar y
cielo (los centros de ciudad acumulan fotos pero son malos para paisaje y nocturna)."""

from __future__ import annotations

import math

import numpy as np
import pandas as pd
import requests

from rasante.cielo.contaminacion import contaminacion

PESO_TIPO = {
    "mirador": 1.0,
    "cabo": 0.8,
    "faro": 0.6,
    "acantilado": 0.6,
    "cumbre": 0.5,
    "lago": 0.6,
    "cascada": 0.4,
    "cañón": 0.6,
    "playa": 0.3,
    "embalse": 0.3,
}


def ajuste_cielo(lat: float, lon: float) -> float:
    """Penalización por cielo urbano (atlas de Lorenz): el recuento de fotos premia los centros de ciudad,
    que son malos sitios para paisaje y nocturna. Un icono urbano con cientos de fotos sigue entrando."""
    try:
        lp = contaminacion(lat, lon)
    except requests.RequestException:
        return 0.0
    if not lp:
        return 0.0
    sqm = lp["sqm"]
    # 20,0: la zona 5b del atlas (19,76) ya es Bortle 7, urbana; con 19,5 se quedaba fuera (auditoría del 15-11)
    return -1.6 if sqm < 18.5 else -0.9 if sqm < 20.0 else -0.3 if sqm < 20.5 else 0.3 if sqm >= 21.3 else 0.0


def entero(v) -> int:
    """Entero de un valor de pandas que puede ser None o NaN (NaN es «verdadero»: `NaN or 0` es NaN)."""
    try:
        v = float(v)
    except (TypeError, ValueError):
        return 0
    return int(v) if np.isfinite(v) else 0


# Spec 018: variedad dentro de cada provincia y tope al cielo urbano en el total
MAX_MISMO_TIPO = 0.4  # de la cuota de una provincia, como mucho este tanto de un mismo tipo (miradores, cumbres…)
MIN_OSCURO = 0.25  # y al menos este tanto con cielo oscuro o sin medir (ajuste_cielo ≥ 0), si los hay
URBANO = -0.9  # ajuste_cielo ≤ esto: cielo urbano (Bortle ≥ 7, brillo < 20,0 mag/arcsec²: zonas 5b y más claras)
MAX_URBANO = 0.2  # del total, como mucho este tanto con cielo urbano


def _de_provincia(c: pd.DataFrame, cuota: int) -> list:
    """Los `cuota` mejores de una provincia (ya ordenados por puntuación) con variedad: ningún tipo pasa de
    MAX_MISMO_TIPO de la cuota y al menos MIN_OSCURO tiene cielo oscuro, si la provincia los tiene. Si los topes
    dejan huecos, se rellenan por puntuación."""
    if len(c) <= cuota:
        return list(c.index)
    tope = max(1, math.ceil(MAX_MISMO_TIPO * cuota))
    elegidos, por_tipo = [], {}
    for i, t in zip(c.index, c.tipo.fillna("otro"), strict=True):
        if len(elegidos) == cuota:
            break
        if por_tipo.get(t, 0) < tope:
            elegidos.append(i)
            por_tipo[t] = por_tipo.get(t, 0) + 1
    elegidos += [i for i in c.index if i not in elegidos][: cuota - len(elegidos)]
    # cielo oscuro: se cambian los peores de cielo claro por los mejores oscuros que se quedaron fuera
    oscuros = c.cielo >= 0
    faltan = math.ceil(MIN_OSCURO * cuota) - int(oscuros[elegidos].sum())
    if faltan > 0:
        entran = [i for i in c.index if oscuros[i] and i not in elegidos][:faltan]
        salen = [i for i in reversed(elegidos) if not oscuros[i]][: len(entran)]
        elegidos = [i for i in elegidos if i not in salen] + entran
    return elegidos


def seleccionar(cand: pd.DataFrame, total: int, por_provincia: int) -> pd.DataFrame:
    """Los spots: `por_provincia` de cada provincia con variedad (todas cubiertas) y el resto hasta `total` por
    puntuación nacional, sin que el cielo urbano pase de MAX_URBANO del total. Necesita las columnas puntuacion,
    provincia, tipo y cielo."""
    cand = cand.sort_values("puntuacion", ascending=False, kind="stable")
    fijos = [i for _, c in cand.groupby("provincia", sort=True) for i in _de_provincia(c, por_provincia)]
    urbanos = int((cand.loc[fijos, "cielo"] <= URBANO).sum())
    tope_urbano = max(urbanos, int(MAX_URBANO * total))
    resto = []
    for i, cielo in zip(cand.index, cand.cielo, strict=True):
        if len(fijos) + len(resto) >= total:
            break
        if i in fijos or i in resto:
            continue
        if cielo <= URBANO:
            if urbanos >= tope_urbano:
                continue
            urbanos += 1
        resto.append(i)
    return cand.loc[fijos + resto].sort_values("puntuacion", ascending=False, kind="stable").reset_index(drop=True)
