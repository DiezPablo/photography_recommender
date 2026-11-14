"""Cuadrícula EEA (EPSG:3035) comprobada contra pyproj."""

import pytest

from rasante.fauna.rejilla import bloque, celda, celdas_en_radio, laea

# (lat, lon, este, norte) calculados con pyproj 3 (EPSG:4326 → EPSG:3035)
REFERENCIAS = [
    (40.4168, -3.7038, 3159390.36, 2029850.92),  # Madrid
    (36.99, -6.44, 2857873.19, 1704101.92),  # Doñana
    (43.2, -4.85, 3119632.77, 2351809.52),  # Picos de Europa
    (40.98, -1.5, 3353087.59, 2060469.38),  # Gallocanta
    (28.27, -16.64, 1706831.4, 1039286.85),  # Tenerife
    (52.23, 21.01, 5069955.27, 3292371.99),  # Varsovia
]


@pytest.mark.parametrize(("lat", "lon", "este", "norte"), REFERENCIAS)
def test_laea_como_pyproj(lat, lon, este, norte):
    e, n = laea(lat, lon)
    assert e == pytest.approx(este, abs=1)
    assert n == pytest.approx(norte, abs=1)


def test_codigos():
    assert celda(40.4168, -3.7038) == "10kmE315N202"
    assert celda(43.2, -4.85) == "10kmE311N235"
    assert celda(40.4168, -3.7038, 1000) == "1kmE3159N2029"
    assert bloque("10kmE315N202") == "100kmE31N20"


def test_celdas_en_radio():
    cerca = celdas_en_radio(40.4168, -3.7038, 15)
    assert "10kmE315N202" in cerca
    assert 9 <= len(cerca) <= 16
    assert celdas_en_radio(40.4168, -3.7038, 0) == ["10kmE315N202"]
