"""Frecuencia de detección de eBird con filas de la forma de la descarga SQL (texto, como llegan en el TSV)."""

from rasante.fauna import ebird_frecuencia as ef

C = "10kmE334N205"


def filas():
    listas = [
        {"celda": C, "month": "11", "prueba": "0", "listas": "200"},
        {"celda": C, "month": "11", "prueba": "1", "listas": "40"},
        {"celda": C, "month": "6", "prueba": "0", "listas": "5"},  # pocas: sin %
        {"celda": "", "month": "11", "prueba": "0", "listas": "999"},  # sin celda: fuera
    ]
    especies = [
        {"celda": C, "specieskey": "2474950", "month": "11", "prueba": "0", "listas": "150"},  # grulla
        {"celda": C, "specieskey": "9999", "month": "11", "prueba": "0", "listas": "10"},
        {"celda": C, "specieskey": "2474950", "month": "11", "prueba": "1", "listas": "30"},
        {"celda": C, "specieskey": "7777", "month": "11", "prueba": "1", "listas": "2"},
    ]
    return listas, especies


def test_frecuencias():
    f = ef.frecuencias(*filas())
    assert set(f) == {C}
    assert f[C]["l"][10] == 200
    assert f[C]["d"]["2474950"][10] == 75
    assert f[C]["d"]["9999"][10] == 5
    assert f[C]["d"]["2474950"][5] is None  # junio: 5 listas, menos del mínimo


def test_backtest():
    listas, especies = filas()
    bt = ef.backtest(ef.frecuencias(listas, especies), ef.frecuencias(listas, especies, prueba=True), {C}, 11)
    assert bt["observadas"] == 2
    assert bt["aciertos"] == 1
    assert bt["listas"] == 200


def test_spearman():
    assert ef.spearman([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]) == 1.0
    assert ef.spearman([1, 2, 3, 4, 5], [50, 40, 30, 20, 10]) == -1.0
    assert ef.spearman([1, 2], [1, 2]) is None


def test_calibracion_y_comparar():
    listas, especies = filas()
    entreno, prueba = ef.frecuencias(listas, especies), ef.frecuencias(listas, especies, prueba=True)
    cal = {x["banda"]: x for x in ef.calibracion(entreno, prueba)}
    assert cal["60-100 %"]["previsto"] == 75 and cal["60-100 %"]["visto"] == 75
    assert cal["5-10 %"]["visto"] == 0  # la especie 9999 no salió en 2025
    c = ef.comparar(entreno, prueba, {"2474950": 50.0}, {C}, 11)
    assert c["especies"] == 3
