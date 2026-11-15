"""Acceso a cada lugar (spec 023): aparcamientos de OSM, el más cercano y los minutos andando."""

from conftest import FIX

from rasante.acceso.calculo import Indice, acceso, calcular, minutos_andando
from rasante.acceso.cli import lugares_de
from rasante.acceso.osm import es_aparcamiento, leer_aparcamientos
from rasante.lugares.cli import construir


def test_que_cuenta_como_aparcamiento():
    assert es_aparcamiento({"amenity": "parking"})
    assert not es_aparcamiento({"amenity": "parking", "access": "private"})
    assert not es_aparcamiento({"amenity": "parking", "parking": "underground"})
    assert not es_aparcamiento({"amenity": "drinking_water"})


def test_leer_aparcamientos_de_osm():
    ps = leer_aparcamientos(FIX / "acceso.osm")
    # Cotos, el del Valle (un área, en su centro) y el de Navarra; fuera el privado y el subterráneo
    assert sorted(p["osm"] for p in ps) == ["node/1", "node/9", "way/100"]
    valle = next(p for p in ps if p["osm"] == "way/100")
    assert valle["nombre"] == "Aparcamiento del Valle"
    assert abs(valle["lat"] - 40.791) < 0.001


def test_minutos_andando():
    assert minutos_andando(0) == 1
    assert minutos_andando(1000) == 17  # 1,3 km de camino a 4,5 km/h
    assert minutos_andando(350) == 6


def test_el_mas_cercano_y_nada_lejos():
    ind = Indice(leer_aparcamientos(FIX / "acceso.osm"))
    a = acceso(ind, 40.801, -3.951)
    assert a["nombre"] == "Aparcamiento de Cotos"
    assert 100 <= a["m"] <= 160 and a["m"] % 10 == 0
    assert a["min"] == minutos_andando(a["m"])
    assert acceso(ind, 41.5, -2.5) is None  # a más de 2 km de cualquier aparcamiento


def test_calcular_por_catalogo_y_rellenar_lugares():
    spots = {
        "type": "FeatureCollection",
        "features": [
            {"properties": {"id": "cotos", "nombre": "Puerto de Cotos", "tipo": "mirador"},
             "geometry": {"type": "Point", "coordinates": [-3.951, 40.801]}},
            {"properties": {"id": "lejos", "nombre": "Lejos", "tipo": "mirador"},
             "geometry": {"type": "Point", "coordinates": [-2.5, 41.5]}},
        ],
    }  # fmt: skip
    doc = calcular(leer_aparcamientos(FIX / "acceso.osm"), lugares_de(spots, None))
    assert set(doc["luz"]) == {"cotos"} and doc["fauna"] == {}
    lugares, _ = construir(spots, None, None, [], acceso=doc)
    por_id = {x["id"]: x for x in lugares["lugares"]}
    assert por_id["cotos"]["acceso"]["aparcamiento_m"] == doc["luz"]["cotos"]["m"]
    assert por_id["lejos"]["acceso"]["aparcamiento_m"] is None


def test_fauna_solo_puntos_y_sitios_pequenos():
    fauna = {
        "lugares": [
            {"id": "eb-L1", "n": "Charca", "t": "Punto de observación", "lat": 40.8, "lon": -3.95, "r": 2},
            {"id": "wd-Q1", "n": "Sierra", "t": "Red Natura 2000", "lat": 40.8, "lon": -3.95, "r": 3},
        ]
    }
    assert [x["id"] for x in lugares_de(None, fauna)["fauna"]] == ["eb-L1"]
