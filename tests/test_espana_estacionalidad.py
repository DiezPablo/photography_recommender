"""Estacionalidad y backtest de España con filas sintéticas (como las de la descarga SQL de GBIF)."""

from safari.espana.estacionalidad import backtest, confianza, estacionalidad, ranking
from safari.espana.gbif_descarga import consulta

AVES = 212
GRULLA, ANADE, GORRION = 2474953, 9761484, 5231190
CELDA = "10kmE335N206"


def filas():
    salida = []
    for anio in (2022, 2023, 2024):
        for mes in range(1, 13):
            # la grulla en Gallocanta: de noviembre a febrero
            if mes in (11, 12, 1, 2):
                salida.append({"celda": CELDA, "clase": AVES, "especie": GRULLA, "anio": anio, "mes": mes, "n": 40})
            salida.append({"celda": CELDA, "clase": AVES, "especie": ANADE, "anio": anio, "mes": mes, "n": 10})
            salida.append({"celda": CELDA, "clase": AVES, "especie": GORRION, "anio": anio, "mes": mes, "n": 5})
            # otra celda que no cuenta
            salida.append({"celda": "10kmE1N1", "clase": AVES, "especie": GORRION, "anio": anio, "mes": mes, "n": 999})
    return salida


def test_estacionalidad_y_ranking():
    est = estacionalidad(filas(), {CELDA})
    grulla = est[GRULLA]["frecuencia"]
    assert grulla[11] > grulla[5]  # diciembre frente a junio
    assert grulla[6] is not None and grulla[6] == 0  # julio: con muestra, pero sin grullas ni vecinos
    assert ranking(est, 12)[0][0] == GRULLA
    assert ranking(est, 7)[0][0] == ANADE
    assert est[GORRION]["n"] == 3 * 12 * 5


def test_confianza():
    assert confianza(10) is None
    assert confianza(50) == "baja"
    assert confianza(150) == "media"
    assert confianza(400) == "alta"


def test_backtest():
    r = backtest(filas(), {CELDA}, mes=12, anio=2024, top=2)
    assert r["observadas"] == 3
    assert r["aciertos"] == 2
    assert r["precision"] == 1.0


def test_consulta_sql():
    sql = consulta()
    assert "GBIF_EEARGCode(10000" in sql
    assert "countryCode = 'ES'" in sql
    assert "classKey IN (212, 359, 358, 131)" in sql


def test_por_celda_e_informe(monkeypatch):
    from safari.espana import cli

    celdas = cli.por_celda(filas())
    assert set(celdas) == {CELDA, "10kmE1N1"}
    assert celdas[CELDA]["m"]["Aves"][0] > 0
    assert str(GRULLA) in celdas[CELDA]["e"]
    monkeypatch.setattr(cli, "ZONAS", [{"nombre": "Gallocanta", "radio_km": 0, "mes_prueba": 12}])
    monkeypatch.setattr(cli, "celdas", lambda z: [CELDA])
    texto = cli.informe(filas(), {"clave": "x", "doi": "10.15468/dl.x", "registros": 1}, str)
    assert "## Gallocanta" in texto
    assert f"1. {GRULLA}" in texto
