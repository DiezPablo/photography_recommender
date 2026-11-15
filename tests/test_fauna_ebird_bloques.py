"""eBird, bloques 2 y 3 de la spec 021 (sin red, con la forma documentada de la API 2.0): actividad por región,
especies por punto y el presupuesto diario de peticiones."""

import json
from datetime import date

import pytest

from rasante.fauna import ebird, ebird_actividad, ebird_especies

REGIONES = [{"code": "ES-CL-SG", "name": "Segovia"}, {"code": "ES-MD", "name": "Madrid"}]


@pytest.fixture
def con_clave(monkeypatch):
    monkeypatch.setenv("EBIRD_CLAVE", "x")
    monkeypatch.setattr(ebird, "provincias", lambda pais="ES", s=None: REGIONES)
    monkeypatch.setattr(ebird, "_hechas", 0)
    monkeypatch.delenv("EBIRD_CONTADOR", raising=False)


def test_actividad_por_region_guarda_30_dias_y_rellena(con_clave, monkeypatch, tmp_path):
    pedidas = []

    def falso_get(ruta, params, s=None):
        pedidas.append(ruta)
        monkeypatch.setattr(ebird, "_hechas", ebird._hechas + 1)
        return {"numChecklists": 40, "numContributors": 12, "numSpecies": 95 if "ES-MD" in ruta else 60}

    monkeypatch.setattr(ebird, "_get", falso_get)
    salida = tmp_path / "espana_ebird_regiones.json"
    ebird_actividad.main(salida, date(2026, 11, 15), max_dias=2)
    assert pedidas == [
        "product/stats/ES-CL-SG/2026/11/14",
        "product/stats/ES-MD/2026/11/14",
        "product/stats/ES-CL-SG/2026/11/13",
        "product/stats/ES-MD/2026/11/13",
    ]
    d = json.loads(salida.read_text())
    assert d["regiones"] == {"ES-CL-SG": "Segovia", "ES-MD": "Madrid"}
    assert d["dias"]["2026-11-14"] == {"ES-CL-SG": [40, 12, 60], "ES-MD": [40, 12, 95]}
    # la siguiente ejecución sigue hacia atrás sin repetir días
    pedidas.clear()
    ebird_actividad.main(salida, date(2026, 11, 15), max_dias=1)
    assert pedidas == ["product/stats/ES-CL-SG/2026/11/12", "product/stats/ES-MD/2026/11/12"]
    assert len(json.loads(salida.read_text())["dias"]) == 3


def test_actividad_respeta_el_presupuesto(con_clave, monkeypatch, tmp_path):
    monkeypatch.setattr(ebird, "PRESUPUESTO", 1)  # no llega para las dos regiones de un día
    monkeypatch.setattr(ebird, "_get", lambda *a, **k: pytest.fail("no debería pedir nada"))
    ebird_actividad.main(tmp_path / "r.json", date(2026, 11, 15))
    assert not (tmp_path / "r.json").exists()


def test_el_contador_se_comparte_entre_ordenes(monkeypatch, tmp_path):
    contador = tmp_path / "ebird_peticiones.txt"
    contador.write_text("364")  # recientes, rarezas y listas de esta misma ejecución
    monkeypatch.setenv("EBIRD_CONTADOR", str(contador))
    monkeypatch.setattr(ebird, "_hechas", 52)
    assert ebird.gastadas() == 416 and ebird.quedan() == 84
    ebird._guardar_contador()
    assert contador.read_text() == "416" and ebird.quedan() == 84


def test_especies_por_punto_por_tandas_con_nombres_y_sin_sensibles(con_clave, monkeypatch, tmp_path):
    lugares = tmp_path / "espana_lugares.json"
    lugares.write_text(
        json.dumps(
            {
                "lugares": [
                    {"id": "eb-L1", "e": 250},
                    {"id": "eb-L2", "e": 180},
                    {"id": "eb-L3", "e": 120},
                    {"id": "eb-L9", "e": 40},  # pocos registros: no se pide
                    {"id": "wd-Q1", "e": 300},
                ]
            }
        )
    )
    pedidas = []
    taxonomia = [
        {"speciesCode": "comcra", "sciName": "Grus grus", "comName": "Grulla común", "category": "species"},
        {"speciesCode": "grebus1", "sciName": "Otis tarda", "comName": "Avutarda euroasiática", "category": "species"},
        {"speciesCode": "wescap1", "sciName": "Tetrao urogallus", "comName": "Urogallo común", "category": "species"},
        {"speciesCode": "x00123", "sciName": "Anas sp.", "comName": "pato sp.", "category": "spuh"},
    ]

    def falso_get(ruta, params, s=None):
        pedidas.append(ruta)
        if ruta.startswith("ref/taxonomy"):
            assert params == {"fmt": "json", "locale": "es"}
            return taxonomia
        return ["comcra", "grebus1", "wescap1", "x00123"] if ruta.endswith("L1") else ["comcra"]

    monkeypatch.setattr(ebird, "_get", falso_get)
    salida = tmp_path / "espana_especies_punto.json"
    ebird_especies.main(salida, lugares, max_tanda=2)
    # los dos puntos con más especies y una petición de taxonomía
    assert pedidas == ["product/spplist/L1", "product/spplist/L2", "ref/taxonomy/ebird"]
    d = json.loads(salida.read_text())
    # fuera el urogallo (sensible) y el «sp.»
    assert d["puntos"] == {"L1": ["comcra", "grebus1"], "L2": ["comcra"]}
    assert d["taxones"] == {"comcra": ["Grus grus", "Grulla común"], "grebus1": ["Otis tarda", "Avutarda euroasiática"]}
    # la siguiente tanda sigue por el que falta y no vuelve a pedir la taxonomía (ya conoce sus códigos)
    pedidas.clear()
    ebird_especies.main(salida, lugares, max_tanda=2)
    assert pedidas == ["product/spplist/L3"]
    assert set(json.loads(salida.read_text())["puntos"]) == {"L1", "L2", "L3"}


def test_sin_clave_no_piden_ni_escriben(monkeypatch, tmp_path):
    monkeypatch.delenv("EBIRD_CLAVE", raising=False)
    ebird_actividad.main(tmp_path / "r.json")
    ebird_especies.main(tmp_path / "e.json", tmp_path / "espana_lugares.json")
    assert not (tmp_path / "r.json").exists() and not (tmp_path / "e.json").exists()
