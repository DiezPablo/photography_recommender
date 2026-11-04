"""Lugares de España: radio por superficie, tipos y puntos de eBird (respuestas con la forma real)."""

from safari.espana import lugares


def test_radio_km():
    assert lugares.radio_km(None) == 3
    assert lugares.radio_km(3.14159e6) == 1.0  # 1 km²... → mínimo 1
    assert lugares.radio_km(314.159e6) == 10.0
    assert lugares.radio_km(1e12) == 30


def test_tipo_corto():
    assert lugares.tipo_corto("Zona de Especial Protección para las Aves") == "ZEPA"
    assert lugares.tipo_corto("Parque Natural") == "Parque natural"
    assert lugares.tipo_corto("área protegida") == "Espacio protegido"


def test_hotspots(monkeypatch):
    datos = [
        {"locId": "L1", "locName": "Gallocanta--Observatorio", "lat": 40.97, "lng": -1.52, "numSpeciesAllTime": 210},
        {"locId": "L2", "locName": "Mi jardín", "lat": 40.0, "lng": -3.0, "numSpeciesAllTime": 4},
    ]
    monkeypatch.setattr(lugares.ebird, "_get", lambda ruta, params, s=None: datos)
    xs = lugares.hotspots()
    assert xs == [
        {
            "id": "eb-L1",
            "n": "Gallocanta · Observatorio",
            "t": "Punto de observación",
            "lat": 40.97,
            "lon": -1.52,
            "r": 2,
            "e": 210,
        }
    ]


def test_sin_repetir():
    a = {"n": "Observatorio junto a Puente de Arganda", "lat": 40.30, "lon": -3.50}
    b = {**a, "lat": 40.31}
    c = {**a, "lat": 40.60}
    assert lugares.sin_repetir([a, b, c]) == [a, c]


def test_estados_especies():
    from safari.espana import nombres

    e = nombres.estados()
    assert e["Felis catus"]["estado"] == "domestica"
    assert e["Trachemys scripta"]["estado"] == "invasora"
    assert e["Canis lupus"]["nota"]
