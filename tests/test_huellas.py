"""Huella de cada parque (D3): el mismo círculo o el contorno real para GBIF, en WKT antihorario."""

import re

from safari import huellas, mundo


def _puntos(wkt: str) -> list[tuple[float, float]]:
    return [tuple(map(float, p.split())) for p in re.findall(r"-?\d+\.\d+ -?\d+\.\d+", wkt)]


def test_circulo_cerrado_antihorario_y_del_radio():
    wkt = huellas.circulo_wkt(-2.33, 34.83, 60)
    pts = _puntos(wkt)
    assert wkt.startswith("POLYGON((") and pts[0] == pts[-1]
    assert len(pts) == huellas.LADOS_CIRCULO + 1
    assert huellas._area_firmada(pts) > 0
    # 60 km son unos 0,54° de latitud
    assert abs(max(lat for _, lat in pts) - (-2.33 + 60 / 111)) < 0.001


def test_circulo_que_cruza_el_antimeridiano_vuelve_a_la_caja():
    assert huellas.circulo_wkt(-17.8, 179.9, 40) is None
    assert "decimalLongitude" in mundo.zona(-17.8, 179.9, 40)
    assert "geometry" in mundo.zona(-2.33, 34.83, 60)


def test_contorno_horario_se_invierte_y_se_simplifica():
    import math

    # un anillo de 300 vértices en sentido horario
    anillo = [[10 + math.cos(-2 * math.pi * i / 300), 40 + math.sin(-2 * math.pi * i / 300)] for i in range(300)]
    anillo.append(anillo[0])
    wkt = huellas.contorno_wkt({"type": "Polygon", "coordinates": [anillo]})
    pts = _puntos(wkt)
    assert len(pts) <= huellas.MAX_PUNTOS
    assert pts[0] == pts[-1]
    assert huellas._area_firmada(pts) > 0


def test_contorno_de_varios_poligonos_toma_el_mayor():
    pequeno = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
    grande = [[10, 10], [20, 10], [20, 20], [10, 20], [10, 10]]
    geo = {
        "type": "FeatureCollection",
        "features": [{"type": "Feature", "geometry": {"type": "MultiPolygon", "coordinates": [[pequeno], [grande]]}}],
    }
    assert "20.0000 20.0000" in huellas.contorno_wkt(geo)
    assert huellas.contorno_wkt({"type": "Point", "coordinates": [1, 2]}) is None


def test_titulo_de_commons():
    url = "http://commons.wikimedia.org/data/main/Data:Parque_Nacional_de_Do%C3%B1ana.map"
    assert huellas.titulo_commons(url) == "Data:Parque Nacional de Doñana.map"
    assert huellas.titulo_commons("http://ejemplo.org/x") is None


def test_sin_tiempo_se_usa_lo_guardado_con_la_caja_de_antes(monkeypatch, tmp_path):
    from safari.comun.cache import CacheJson

    cache = CacheJson(directorio=tmp_path)
    monkeypatch.setattr(mundo, "CACHE", cache)
    monkeypatch.setattr(mundo, "sin_tiempo", lambda: True)
    params = {**mundo.zona(-2.33, 34.83, 60), "classKey": 359}
    antes = {"classKey": 359, **mundo.caja(-2.33, 34.83, 60)}
    cache.guardar("gbif:" + repr(sorted(antes.items())), {"obs": 5, "especies": [], "meses": [0] * 12})
    _, guardado = mundo._de_cache(params, -2.33, 34.83, 60, "gbif:")
    assert guardado["obs"] == 5 and guardado["antigua"] is True
