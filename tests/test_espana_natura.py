"""Natura 2000: cuadrículas que toca un espacio y lectura de un feature del servicio de la EEA."""

from safari.espana import natura
from safari.espana.rejilla import celda


def test_sitio_gallocanta():
    # un cuadrado de ~2 km alrededor de la laguna
    f = {
        "properties": {"SITECODE": "ES0000017", "SITENAME": "Cuenca de Gallocanta", "SITETYPE": "A", "Area_km2": 4.1},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-1.52, 40.96], [-1.50, 40.96], [-1.50, 40.98], [-1.52, 40.98], [-1.52, 40.96]]],
        },
    }
    codigo, s = natura.sitio(f)
    assert codigo == "ES0000017"
    assert s["t"] == "A"
    assert celda(40.97, -1.51) in s["celdas"]
    assert 1 <= len(s["celdas"]) <= 4
    assert s["g"]["type"] == "Polygon"
    assert 40.96 <= s["lat"] <= 40.98


def test_sin_geometria():
    assert natura.sitio({"properties": {"SITECODE": "X"}, "geometry": None}) is None
