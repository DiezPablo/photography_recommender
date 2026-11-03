"""Zonas de prueba de España (casos de aceptación de la especificación): punto y radio de la zona de observación,
y el mes en que hay que revisar el resultado a mano."""

from __future__ import annotations

from safari.espana.rejilla import celdas_en_radio

ZONAS: list[dict] = [
    {"id": "donana", "nombre": "Doñana", "lat": 37.0, "lon": -6.45, "radio_km": 20, "mes_prueba": 1},
    {"id": "gredos", "nombre": "Sierra de Gredos", "lat": 40.26, "lon": -5.2, "radio_km": 15, "mes_prueba": 5},
    {"id": "picos", "nombre": "Picos de Europa", "lat": 43.2, "lon": -4.85, "radio_km": 20, "mes_prueba": 10},
    {"id": "gallocanta", "nombre": "Laguna de Gallocanta", "lat": 40.98, "lon": -1.5, "radio_km": 10, "mes_prueba": 11},
]


def celdas(zona: dict) -> list[str]:
    return celdas_en_radio(zona["lat"], zona["lon"], zona["radio_km"])
