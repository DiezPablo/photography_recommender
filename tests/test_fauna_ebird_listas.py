"""Listas de eBird por punto (spec 021): recuentos por día, días que faltan y resumen de 7 y 30 días. Las listas
de prueba siguen el formato documentado de `product/lists` de la API 2.0 de eBird."""

import json
from datetime import date

from rasante.fauna import ebird, ebird_listas


def _lista(loc, especies, hotspot=True, nombre="Ana"):
    return {
        "locId": loc,
        "subId": "S1",
        "userDisplayName": nombre,
        "numSpecies": especies,
        "obsDt": "12 Nov 2026",
        "isoObsDate": "2026-11-12 08:30",
        "loc": {"locId": loc, "name": "x", "isHotspot": hotspot, "lat": 40.0, "lng": -3.0},
    }


def test_resumen_dia_solo_puntos_publicos_y_sin_observadores():
    listas = [_lista("L1", 20), _lista("L1", 35), _lista("L2", 8), _lista("L9", 50, hotspot=False), {"numSpecies": 3}]
    # con la lista de lugares: solo esos puntos
    assert ebird_listas.resumen_dia(listas, {"L1", "L2"}) == {"L1": [2, 35], "L2": [1, 8]}
    # sin ella: los que eBird marca como punto público (la finca L9 no cuenta)
    assert ebird_listas.resumen_dia(listas, None) == {"L1": [2, 35], "L2": [1, 8]}
    assert "Ana" not in json.dumps(ebird_listas.resumen_dia(listas, None))


def test_dias_que_faltan_del_mas_reciente_al_mas_antiguo():
    hoy = date(2026, 11, 13)
    dias = {"2026-11-12": {}, "2026-11-10": {}}
    assert ebird_listas.dias_que_faltan(dias, hoy, 3) == [date(2026, 11, 11), date(2026, 11, 9), date(2026, 11, 8)]
    assert len(ebird_listas.dias_que_faltan({}, hoy, 99)) == 30  # hoy no entra: el día no ha terminado


def test_resumen_de_7_y_30_dias():
    dias = {
        "2026-10-20": {"L1": [4, 60]},
        "2026-11-08": {"L1": [1, 12], "L2": [2, 30]},
        "2026-11-12": {"L1": [3, 41]},
    }
    r = ebird_listas.resumen(dias, date(2026, 11, 13))
    assert r["L1"] == {"l7": 4, "l30": 8, "u": "2026-11-12", "e": 41, "m": 60}
    assert r["L2"] == {"l7": 2, "l30": 2, "u": "2026-11-08", "e": 30, "m": 30}


def test_main_rellena_dias_guarda_el_historial_y_continua(monkeypatch, tmp_path):
    pedidas = []

    def falso_get(ruta, params, s=None):
        # eBird no tiene segundo nivel en las comunidades de una sola provincia: Madrid es «ES-MD»
        if ruta.startswith("ref/region/list/subnational2"):
            return [{"code": "ES-CL-SG", "name": "Segovia"}]
        if ruta.startswith("ref/region/list/subnational1"):
            return [{"code": "ES-CL", "name": "Castilla y León"}, {"code": "ES-MD", "name": "Madrid"}]
        pedidas.append(ruta)
        assert params == {"maxResults": 200}
        return [_lista("L1", 20)] if "ES-MD/" in ruta else [_lista("L2", 9), _lista("L7", 4)]

    monkeypatch.setenv("EBIRD_CLAVE", "x")
    monkeypatch.setattr(ebird, "_get", falso_get)
    lugares = tmp_path / "espana_lugares.json"
    lugares.write_text(json.dumps({"lugares": [{"id": "eb-L1"}, {"id": "eb-L2"}, {"id": "wd-Q1"}]}))
    salida = tmp_path / "espana_listas.json"
    hoy = date(2026, 11, 13)
    ebird_listas.main(salida, lugares, hoy, max_dias=2)
    assert pedidas[:2] == ["product/lists/ES-CL-SG/2026/11/12", "product/lists/ES-MD/2026/11/12"] and len(pedidas) == 4
    d = json.loads(salida.read_text())
    assert d["dias"] == ["2026-11-11", "2026-11-12"]
    assert d["puntos"] == {
        "L1": {"l7": 2, "l30": 2, "u": "2026-11-12", "e": 20, "m": 20},
        "L2": {"l7": 2, "l30": 2, "u": "2026-11-12", "e": 9, "m": 9},
    }  # L7 no es un lugar: fuera
    # la siguiente ejecución sigue con los días que faltan, sin repetir los que ya están
    pedidas.clear()
    ebird_listas.main(salida, lugares, hoy, max_dias=1)
    assert pedidas == ["product/lists/ES-CL-SG/2026/11/10", "product/lists/ES-MD/2026/11/10"]
    guardado = json.loads((tmp_path / "espana_listas_dias.json").read_text())
    assert len(guardado["dias"]) == 3 and guardado["regiones"] == ["ES-CL-SG", "ES-MD"]
    # un historial pedido con otras regiones (el de antes de incluir Madrid) no vale: se empieza de nuevo
    (tmp_path / "espana_listas_dias.json").write_text(json.dumps({"dias": guardado["dias"]}))
    pedidas.clear()
    ebird_listas.main(salida, lugares, hoy, max_dias=1)
    assert pedidas == ["product/lists/ES-CL-SG/2026/11/12", "product/lists/ES-MD/2026/11/12"]
    assert list(json.loads((tmp_path / "espana_listas_dias.json").read_text())["dias"]) == ["2026-11-12"]


def test_sin_clave_no_pide_ni_escribe(monkeypatch, tmp_path):
    monkeypatch.delenv("EBIRD_CLAVE", raising=False)
    ebird_listas.main(tmp_path / "espana_listas.json")
    assert not (tmp_path / "espana_listas.json").exists()
