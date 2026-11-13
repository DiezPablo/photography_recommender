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


def test_km_ruta():
    assert lugares.km_ruta("12.5") == 12.5
    assert lugares.km_ruta("12,5 km") == 12.5
    assert lugares.km_ruta("8 mi") == 12.9
    assert lugares.km_ruta("3500 m") == 3.5
    assert lugares.km_ruta(None) is None
    assert lugares.km_ruta("variable") is None


def test_observatorios_agrupa_y_filtra(monkeypatch):
    from safari import overpass as consultas

    elementos = [
        {"type": "node", "id": 1, "lat": 40.970, "lon": -1.520, "tags": {"leisure": "bird_hide", "name": "La Reguera"}},
        {"type": "node", "id": 2, "lat": 40.971, "lon": -1.521, "tags": {"leisure": "bird_hide"}},  # mismo sitio
        {"type": "way", "id": 3, "center": {"lat": 41.5, "lon": -2.0}, "tags": {"leisure": "bird_hide"}},
        {"type": "node", "id": 4, "lat": 42.0, "lon": -3.0, "tags": {"name": "Exhibición de aves rapaces"}},
        {"type": "node", "id": 5, "lat": 43.0, "lon": -4.0, "tags": {"access": "private"}},
    ]
    monkeypatch.setattr(consultas, "overpass", lambda consulta, timeout=0: {"elements": elementos})
    xs = lugares.observatorios()
    assert [(x["id"], x["n"], x.get("k")) for x in xs] == [("osm-node-1", "La Reguera", 2), ("osm-way-3", None, None)]


def test_sin_repetir_ignora_tildes_y_signos_y_hereda():
    espacio = {"id": "wd-Q1", "n": "Complexo Ons - O Grove", "t": "Red Natura 2000", "lat": 42.4, "lon": -8.9, "r": 5}
    otro = {**espacio, "id": "wd-Q2", "n": "Complexo Ons-O Grove", "z": "ES1140004"}
    punto = {
        "id": "eb-L1",
        "n": "Complexo Ons – O Grove",
        "t": "Punto de observación",
        "lat": 42.41,
        "lon": -8.9,
        "r": 2,
        "e": 180,
    }
    assert lugares.sin_repetir([espacio, otro, punto]) == [espacio]
    assert espacio["z"] == "ES1140004" and espacio["e"] == 180  # fmt: skip


def test_una_figura_por_espacio():
    parque = {
        "id": "wd-Q1969050",
        "n": "Parque nacional de Sierra Nevada",
        "t": "Parque nacional",
        "lat": 37.05,
        "lon": -3.3,
        "r": 16,
    }
    zec = {
        "id": "wd-Q108063786",
        "n": "Sierra Nevada",
        "t": "Red Natura 2000",
        "lat": 37.05,
        "lon": -3.3,
        "r": 23,
        "z": "ES6140004",
    }
    biosfera = {
        "id": "wd-Q108516215",
        "n": "Reserva de la Biosfera de Sierra Nevada",
        "t": "Reserva de la biosfera",
        "lat": 37.0503,
        "lon": -3.3,
        "r": 23,
    }
    lejos = {"id": "wd-Q9", "n": "Sierra de Baza", "t": "Parque natural", "lat": 37.3, "lon": -2.8, "r": 12}
    punto = {"id": "eb-L5", "n": "Hoya de la Mora", "t": "Punto de observación", "lat": 37.05, "lon": -3.3, "r": 2}
    assert lugares.una_figura([zec, biosfera, parque, lejos, punto]) == [parque, lejos, punto]
    # el parque se queda con el contorno y el radio del espacio mayor
    assert parque["z"] == "ES6140004" and parque["r"] == 23  # fmt: skip


def test_unificar_y_codigo_natura():
    espacio = {"id": "wd-Q5", "n": "Cabo Vilán", "t": "Monumento natural", "lat": 43.16, "lon": -9.21, "r": 1}
    punto_espacio = {
        "id": "eb-L5142064",
        "n": "Cabo Vilan",
        "t": "Punto de observación",
        "lat": 43.161,
        "lon": -9.21,
        "r": 2,
        "e": 140,
    }
    punto = {
        "id": "eb-L7127873",
        "n": "Albufera de Adra",
        "t": "Punto de observación",
        "lat": 36.75,
        "lon": -2.95,
        "r": 2,
        "e": 210,
    }
    homonimo_lejos = {
        "id": "eb-L2",
        "n": "Albufera de Adra",
        "t": "Punto de observación",
        "lat": 39.3,
        "lon": -0.3,
        "r": 2,
    }
    sitios = {
        "ES6110001": {"n": "Albufera de Adra", "lat": 36.751, "lon": -2.951},
        "ES1110005": {"n": "Costa da Morte", "lat": 43.2, "lon": -9.1},
    }
    xs = lugares.unificar([punto, punto_espacio, homonimo_lejos, espacio], sitios)
    # el espacio se queda (con las especies de su punto de eBird); los puntos sin espacio siguen
    assert [x["id"] for x in xs] == ["wd-Q5", "eb-L7127873", "eb-L2"]
    assert espacio["e"] == 140
    # el punto que se llama como el espacio Natura 2000 de al lado se queda con su código; el homónimo lejano, no
    assert punto["z"] == "ES6110001" and "z" not in homonimo_lejos
