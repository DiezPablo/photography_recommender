"""Idoneidad de un lugar para cada momento (spec 013): lo que da de sí el sitio, sin el tiempo.

No es una nota validada: es un criterio de orden para cuando no hay previsión (más allá de 5 días), que se
multiplica por la climatología del mes. Usa solo lo que no cambia de un día a otro y los mismos factores que la
previsión, para que un lugar no salga bien en una y mal en la otra:

- Amanecer y atardecer: el relieve hacia donde sale o se pone el sol el día 15 de cada mes (el azimut se mueve
  unos 60° entre junio y diciembre: un valle abierto al sureste vale en invierno y no en verano), con el factor
  de la previsión (`notas.luz.factor_relieve`). 10 = horizonte libre.
- Noche: la contaminación lumínica (`notas.noche.factor_sqm`) y el relieve hacia el sur, que es por donde pasa
  bajo el centro de la Vía Láctea (culmina a unos 20° en la Península).
"""

from __future__ import annotations

from datetime import date
from statistics import median
from zoneinfo import ZoneInfo

from rasante.cielo import astro
from rasante.terreno import horizonte

from .base import clamp
from .luz import factor_relieve
from .noche import factor_sqm

# Año de referencia para los azimuts (no bisiesto): la salida no cambia de un año a otro.
ANIO = 2025
TZ = ZoneInfo("Europe/Madrid")
# Peso de la luz rasante y del color en un amanecer o atardecer redondo (como en nota_luz: base 3 + lienzo 7).
PESO_LUZ, PESO_COLOR = 3.0, 7.0
# Relieve hacia el sur (grados) desde el que empieza a tapar el centro de la Vía Láctea y con el que lo tapa del
# todo; aun tapado queda cielo estrellado, por eso el factor no baja de 0,6.
SUR_LIBRE, SUR_TAPADO, FACTOR_SUR_MIN = 5.0, 20.0, 0.6


def idoneidad_luz(relieve: float | None) -> float:
    """0-10 para un amanecer o atardecer con el horizonte a `relieve` grados hacia el sol."""
    f_luz, f_color = factor_relieve(relieve)
    return round(PESO_LUZ * f_luz + PESO_COLOR * f_color, 1)


def relieve_sur(perfil: dict | None) -> float | None:
    """Mediana del horizonte (grados) entre el sureste y el suroeste."""
    if not perfil or not perfil.get("angulos"):
        return None
    a = perfil["angulos"]
    paso = 360 / len(a)
    return round(median(x for i, x in enumerate(a) if 135 <= i * paso <= 225) / 10, 1)


def idoneidad_noche(sqm: float | None, sur: float | None) -> float:
    """0-10 para una noche de estrellas: cielo oscuro y sur despejado."""
    f_sur = 1.0 if sur is None else 1 - (1 - FACTOR_SUR_MIN) * clamp((sur - SUR_LIBRE) / (SUR_TAPADO - SUR_LIBRE))
    return round(10 * factor_sqm(sqm) * f_sur, 1)


def de_lugar(lat: float, lon: float, perfil: dict | None, sqm: float | None) -> dict:
    """La idoneidad de un lugar: por mes (enero a diciembre) para amanecer y atardecer, una para la noche, y los
    ángulos de relieve de los que salen, para poder explicarla."""
    hz = (lambda az: horizonte.angulo(perfil, az) or 0.0) if perfil and perfil.get("angulos") else None
    relieve: dict = {"amanecer": [], "atardecer": []}
    for momento, lista in relieve.items():
        for mes in range(1, 13):
            if hz is None:
                lista.append(None)
                continue
            _, ang = astro.sol_sobre_relieve(lat, lon, date(ANIO, mes, 15), TZ, hz, momento)
            lista.append(None if ang is None else round(ang, 1))
    sur = relieve_sur(perfil)
    return {
        "amanecer": [idoneidad_luz(r) for r in relieve["amanecer"]],
        "atardecer": [idoneidad_luz(r) for r in relieve["atardecer"]],
        "noche": idoneidad_noche(sqm, sur),
        "relieve": {**relieve, "sur": sur},
    }
