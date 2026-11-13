"""Clima de NASA POWER: lluvia por mes y máxima media estimada (sin red)."""

from safari import practico

MESES = practico.MESES_POWER


def test_clima_con_maxima(monkeypatch):
    respuestas = {
        "PRECTOTCORR,T2M_MAX": {"PRECTOTCORR": dict.fromkeys(MESES, 2.0), "T2M_MAX": dict.fromkeys(MESES, 35.0)},
        "T2M,T2M_RANGE": {"T2M": dict.fromkeys(MESES, 20.0), "T2M_RANGE": dict.fromkeys(MESES, 14.0)},
    }
    monkeypatch.setattr(practico, "_power", lambda lat, lon, p: respuestas[p])
    c = practico.clima(-1.5, 35.1, con_maxima=True)
    assert c["lluvia_mm"][0] == 62  # 2 mm/día × 31 días
    assert c["tmax"] == [27] * 12  # 20 + 14/2, no la máxima absoluta (35)
    assert practico.clima(-1.5, 35.1)["tmax"] == [None] * 12
