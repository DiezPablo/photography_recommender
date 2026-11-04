"""Frecuencia de detección de eBird con filas de la forma de la descarga SQL (texto, como llegan en el TSV)."""

from safari.espana import ebird_frecuencia as ef

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
