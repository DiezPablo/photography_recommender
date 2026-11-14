"""Fuentes de la validación (sin red): el archivo de ERA5 se reintenta cuando falla el servidor."""

import pytest
import requests

from rasante.validacion import fuentes


class _Respuesta:
    def __init__(self, estado, datos=None):
        self.status_code = estado
        self._datos = datos

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code}", response=self)

    def json(self):
        return self._datos


class _Sesion:
    def __init__(self, respuestas):
        self.respuestas = list(respuestas)
        self.pedidas = 0

    def get(self, url, params=None, timeout=None):
        self.pedidas += 1
        return self.respuestas.pop(0)


HORAS = {"hourly": {"time": ["2020-01-01T00:00", "2020-01-01T01:00"], "cloud_cover": [10, 20]}}


def test_era5_reintenta_si_el_servidor_falla(monkeypatch):
    esperas = []
    s = _Sesion([_Respuesta(502), _Respuesta(429), _Respuesta(200, HORAS)])
    monkeypatch.setattr(fuentes, "SESION", s)
    monkeypatch.setattr(fuentes.time, "sleep", esperas.append)
    df = fuentes.era5(40.45, -3.53, ["cloud_cover"])
    assert list(df["cloud_cover"]) == [10, 20] and s.pedidas == 3
    assert esperas == [60, 120]


def test_era5_no_reintenta_un_error_nuestro(monkeypatch):
    s = _Sesion([_Respuesta(400)])
    monkeypatch.setattr(fuentes, "SESION", s)
    monkeypatch.setattr(fuentes.time, "sleep", lambda _: None)
    with pytest.raises(requests.HTTPError):
        fuentes.era5(40.45, -3.53, ["cloud_cover"])
    assert s.pedidas == 1


def test_era5_se_rinde_tras_seis_intentos(monkeypatch):
    s = _Sesion([_Respuesta(503)] * 6)
    monkeypatch.setattr(fuentes, "SESION", s)
    monkeypatch.setattr(fuentes.time, "sleep", lambda _: None)
    with pytest.raises(RuntimeError, match="ERA5 no responde"):
        fuentes.era5(40.45, -3.53, ["cloud_cover"])
    assert s.pedidas == 6
