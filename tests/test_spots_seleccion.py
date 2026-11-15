"""Selección de spots (spec 018): cuota por provincia con variedad de tipos y de cielo, y tope al cielo urbano."""

import pandas as pd

from rasante.spots import seleccion
from rasante.spots.seleccion import seleccionar


def _cand(filas):
    return pd.DataFrame(filas, columns=["nombre", "provincia", "tipo", "cielo", "puntuacion"])


def test_cada_provincia_tiene_su_cuota_y_el_resto_va_por_puntuacion():
    filas = [(f"A{i}", "Ávila", "cumbre" if i % 2 else "lago", 0.3, 10 - i * 0.1) for i in range(30)]
    filas += [(f"B{i}", "Burgos", "mirador" if i % 2 else "cascada", 0.0, 5 - i * 0.1) for i in range(5)]
    sel = seleccionar(_cand(filas), total=25, por_provincia=10)
    assert len(sel) == 25
    # Burgos solo tiene 5: entran todos aunque puntúen menos que los de Ávila
    assert (sel.provincia == "Burgos").sum() == 5
    assert (sel.provincia == "Ávila").sum() == 20
    assert list(sel.puntuacion) == sorted(sel.puntuacion, reverse=True)


def test_ningun_tipo_se_come_la_cuota_de_una_provincia():
    # diez miradores muy populares y unas pocas cumbres, lagos y cascadas detrás
    filas = [(f"M{i}", "Madrid", "mirador", 0.0, 20 - i) for i in range(10)]
    otros = ["cumbre", "lago", "cascada", "cumbre", "lago", "faro"]
    filas += [(f"C{i}", "Madrid", t, 0.0, 6 - i) for i, t in enumerate(otros)]
    sel = seleccionar(_cand(filas), total=10, por_provincia=10)
    assert (sel.tipo == "mirador").sum() == 4  # el 40 % de 10
    assert set(sel.tipo) == {"mirador", "cumbre", "lago", "cascada", "faro"}
    # con solo cinco alternativas, el hueco que queda lo ocupa el siguiente mirador
    sel = seleccionar(_cand(filas[:-1]), total=10, por_provincia=10)
    assert (sel.tipo == "mirador").sum() == 5


def test_si_no_hay_variedad_se_rellena_por_puntuacion():
    filas = [(f"M{i}", "Cádiz", "playa", 0.0, 10 - i) for i in range(12)]
    sel = seleccionar(_cand(filas), total=8, por_provincia=8)
    assert len(sel) == 8 and list(sel.nombre) == [f"M{i}" for i in range(8)]


def test_cupo_de_cielo_oscuro_en_cada_provincia():
    # ocho urbanos muy populares y tres de cielo oscuro poco conocidos
    filas = [(f"U{i}", "Barcelona", t, -1.6, 20 - i) for i, t in enumerate(["mirador", "playa", "faro", "cumbre"] * 2)]
    filas += [(f"O{i}", "Barcelona", "cumbre", 0.3, 1 - i * 0.1) for i in range(3)]
    sel = seleccionar(_cand(filas), total=8, por_provincia=8)
    assert len(sel) == 8
    assert (sel.cielo >= 0).sum() == 2  # el 25 % de 8
    assert {"O0", "O1"} <= set(sel.nombre) and "O2" not in set(sel.nombre)


def test_el_cielo_urbano_no_pasa_del_tope_en_el_resto_nacional(monkeypatch):
    monkeypatch.setattr(seleccion, "MIN_OSCURO", 0)
    filas = [(f"P{i}", "Sevilla", "mirador", 0.0, 1) for i in range(2)]
    filas += [(f"U{i}", "Madrid", "mirador", -1.6, 30 - i) for i in range(20)]
    filas += [(f"N{i}", "Madrid", "cumbre", 0.3, 5 - i * 0.1) for i in range(20)]
    sel = seleccionar(_cand(filas), total=20, por_provincia=2)
    urbanos = (sel.cielo <= seleccion.URBANO).sum()
    assert len(sel) == 20 and urbanos == 4  # el 20 % de 20: el resto, de cielo oscuro aunque puntúe menos


def test_urbano_es_bortle_7_o_mas(monkeypatch):
    # el corte de «urbano» de la selección es el mismo que el de la auditoría (Bortle ≥ 7 del atlas)
    from rasante.cielo.contaminacion import PALETA

    for _, sqm, bortle in PALETA.values():
        monkeypatch.setattr(seleccion, "contaminacion", lambda la, lo, s=sqm: {"sqm": s})
        assert (seleccion.ajuste_cielo(40, -3) <= seleccion.URBANO) == (bortle >= 7), (sqm, bortle)
