"""lugares.json (spec 003): spots y lugares de fauna en el núcleo común, enlazados por cercanía, contra el esquema."""

import copy

from conftest import sin_nan

from rasante.comun.territorio import Provincias
from rasante.lugares import modelo
from rasante.lugares.cli import construir, errores

PROVINCIAS = Provincias()


def _spot(id_, nombre, lat, lon, tipo="mirador", origen="osm", **extra):
    props = {
        "id": id_,
        "nombre": nombre,
        "tipo_osm": tipo,
        "origen": origen,
        "provincia": "Madrid",
        "ccaa": "Comunidad de Madrid",
        "wikidata": None,
        "puntuacion": 7.2,
        "galeria": [],
        "horizonte": {"elevacion": 1800, "angulos": [0.0] * 45 + [10.0] * 45 + [2.0] * 90},
        "contaminacion": {"zona": "3b", "sqm": 21.38, "bortle": 4, "descripcion": "rural"},
        **extra,
    }
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": props}


SPOTS = {
    "features": [
        _spot("mirador-de-los-robledos-aaaa", "Mirador de los Robledos", 40.857, -3.889),
        _spot(
            "penalara-bbbb",
            "Peñalara",
            40.850,
            -3.956,
            tipo="cumbre",
            origen="wikidata",
            wikidata="Q1234",
            galeria=[
                {
                    "url": "https://upload.wikimedia.org/x.jpg",
                    "autor": "Ana",
                    "licencia": "CC BY-SA 4.0",
                    "enlace": "https://commons.wikimedia.org/wiki/File:x.jpg",
                }
            ],
        ),
        _spot("faro-de-fisterra-cccc", "Faro de Fisterra", 42.882, -9.272, tipo="faro", provincia="A Coruña", ccaa="?"),
    ]
}
FAUNA = {
    "lugares": [
        {"id": "eb-L1", "n": "Rascafría · El Paular", "t": "Punto de observación", "lat": 40.888, "lon": -3.887, "r": 2, "e": 120},
        {"id": "osm-node-99", "n": "Observatorio de Santillana", "t": "Observatorio de aves", "lat": 40.72, "lon": -3.84, "r": 2},
        {"id": "wd-Q55", "n": "Lagunas de Villafáfila", "t": "Humedal Ramsar", "lat": 41.82, "lon": -5.6, "r": 9, "z": "ES0000004"},
        {"id": "eb-L2", "n": "Mar adentro", "t": "Punto de observación", "lat": 44.2, "lon": -9.9, "r": 2, "e": 5},
        {"id": "eb-L3", "n": "Marvão", "t": "Punto de observación", "lat": 39.394, "lon": -7.377, "r": 2, "e": 9},
    ]
}  # fmt: skip
NATURA = {
    "sitios": {
        "ES0000004": {"n": "Lagunas de Villafáfila", "t": "C", "a": 327.0, "lat": 41.82, "lon": -5.6, "celdas": ["10kmE299N220", "10kmE300N220"]},
        "ES3110002": {"n": "Cuenca del río Lozoya y Sierra Norte", "t": "B", "a": 500.0, "lat": 40.95, "lon": -3.8, "celdas": ["10kmE315N208"]},
    }
}  # fmt: skip
EVENTOS = [
    {"id": "nieve-guadarrama", "categoria": "nieve", "lat": 40.82, "lon": -3.95, "radio_km": 20.0},
    {"id": "grullas-villafafila", "categoria": "fauna", "lat": 41.82, "lon": -5.6, "radio_km": 15.0},
]


def _doc():
    return construir(SPOTS, FAUNA, NATURA, EVENTOS, PROVINCIAS)


def test_cumple_el_esquema_sin_nan_y_con_ids_unicos():
    doc, fuera = _doc()
    assert errores(doc) == []
    sin_nan(doc)
    ids = [x["id"] for x in doc["lugares"]]
    assert len(ids) == len(set(ids))
    # los ids de entrada no cambian; el espacio Natura sin lugar propio entra y el que ya lo tiene no se repite
    assert {"penalara-bbbb", "eb-L1", "osm-node-99", "wd-Q55", "n2k-ES3110002"} <= set(ids)
    assert "n2k-ES0000004" not in ids
    # fuera de España (Portugal) y mar adentro: no entran, pero se cuentan
    assert fuera == 2 and "eb-L2" not in ids and "eb-L3" not in ids
    assert doc["cuenta"]["catalogo"] == {"luz": 3, "fauna": 4}


def test_cada_catalogo_lleva_solo_su_bloque():
    doc, _ = _doc()
    por_id = {x["id"]: x for x in doc["lugares"]}
    pico = por_id["penalara-bbbb"]
    assert pico["catalogo"] == "luz" and "fauna" not in pico and pico["tipo"] == "cumbre"
    assert pico["luz"]["bortle"] == 4 and pico["luz"]["cielo_mag"] == 21.38
    assert pico["foto"]["autor"] == "Ana"
    assert [f["fuente"] for f in pico["fuentes"]] == ["Wikidata", "Wikimedia Commons"]
    # horizonte por rumbos: abierto al norte, tapado al sureste
    assert pico["luz"]["horizonte"]["N"] == 0 and pico["luz"]["horizonte"]["SE"] == 10
    faro = por_id["faro-de-fisterra-cccc"]
    assert faro["ccaa"] == "Galicia"  # la comunidad sale de la provincia (decisión 0007), no del dato de entrada
    humedal = por_id["wd-Q55"]
    assert humedal["catalogo"] == "fauna" and "luz" not in humedal and humedal["tipo"] == "humedal"
    assert humedal["provincia"] == "Zamora" and humedal["ccaa"] == "Castilla y León"
    assert humedal["fauna"]["celdas"] == ["10kmE299N220", "10kmE300N220"]  # las de su contorno Natura 2000
    assert humedal["fauna"]["espacio"] == {"nombre": "Lagunas de Villafáfila", "figura": "Humedal Ramsar"}
    punto = por_id["eb-L1"]
    assert punto["tipo"] == "punto_de_observacion" and punto["fauna"]["especies_ebird"] == 120
    assert punto["fauna"]["celdas"] and punto["fauna"]["espacio"] is None
    assert por_id["osm-node-99"]["fuentes"] == [{"fuente": "OpenStreetMap", "ref": "node/99", "licencia": "ODbL"}]


def test_cerca_solo_del_otro_catalogo_y_a_15_km():
    doc, _ = _doc()
    por_id = {x["id"]: x for x in doc["lugares"]}
    for x in doc["lugares"]:
        for c in x["cerca"]:
            y = por_id[c]
            assert y["catalogo"] != x["catalogo"]
            assert modelo.km(x["lat"], x["lon"], y["lat"], y["lon"]) <= modelo.KM_CERCA
    # del más cercano al más lejano
    assert por_id["mirador-de-los-robledos-aaaa"]["cerca"][0] == "eb-L1"
    assert por_id["eb-L1"]["cerca"] == ["mirador-de-los-robledos-aaaa", "penalara-bbbb"]
    assert por_id["faro-de-fisterra-cccc"]["cerca"] == [] and por_id["wd-Q55"]["cerca"] == []


def test_eventos_de_su_ambito():
    doc, _ = _doc()
    por_id = {x["id"]: x for x in doc["lugares"]}
    assert por_id["penalara-bbbb"]["eventos"] == ["nieve-guadarrama"]
    assert por_id["wd-Q55"]["eventos"] == ["grullas-villafafila"]
    assert por_id["eb-L1"]["eventos"] == []  # la nieve no es un evento de fauna


def test_falla_sin_fuente_sin_provincia_o_con_dos_bloques():
    doc, _ = _doc()
    malo = copy.deepcopy(doc)
    malo["lugares"][0]["fuentes"] = []
    malo["lugares"][1]["provincia"] = None
    malo["lugares"][2]["fauna"] = copy.deepcopy(malo["lugares"][-1]["fauna"])
    malo["lugares"].append(copy.deepcopy(malo["lugares"][0]))
    fallos = "\n".join(errores(malo))
    assert "fuentes" in fallos and "provincia" in fallos and "repetido" in fallos
    assert malo["lugares"][2]["id"] in fallos


def test_un_catalogo_puede_faltar():
    doc, _ = construir(SPOTS, None, None, [], PROVINCIAS)
    assert errores(doc) == [] and doc["cuenta"]["catalogo"] == {"luz": 3}
