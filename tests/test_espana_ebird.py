"""eBird por provincias con respuestas de la forma de la API 2.0 (sin red)."""

import json

from safari.espana import ebird

OBS = [
    {
        "sciName": "Grus grus",
        "obsDt": "2026-11-02 08:15",
        "lat": 40.9712,
        "lng": -1.5203,
        "locName": "Laguna",
        "obsValid": True,
        "locationPrivate": False,
    },
    {
        "sciName": "Otis tarda",
        "obsDt": "2026-10-28",
        "lat": 40.9,
        "lng": -1.4,
        "locName": "Mi finca",
        "obsValid": True,
        "locationPrivate": True,
    },
    {"sciName": "Anas sp.", "obsDt": "2026-10-28", "lat": 40.9, "lng": -1.4, "obsValid": False},
]


def test_recientes_espana(monkeypatch, tmp_path):
    monkeypatch.setenv("EBIRD_CLAVE", "x")

    def falso(ruta, params, s=None):
        return [{"code": "ES-AR-TE", "name": "Teruel"}] if ruta.startswith("ref/") else OBS

    monkeypatch.setattr(ebird, "_get", falso)
    from safari.espana import inat_espana

    monkeypatch.setattr(inat_espana, "recientes", lambda: [])
    salida = tmp_path / "r.json"
    assert ebird.recientes_espana(salida) == 2
    d = json.loads(salida.read_text())
    assert d["obs"][0] == {"c": "Grus grus", "f": "2026-11-02", "lat": 40.97, "lon": -1.52, "l": "Laguna", "s": "e"}
    assert d["obs"][1]["l"] is None  # ubicación privada: sin nombre


def test_sin_clave(monkeypatch, tmp_path):
    from safari.espana import inat_espana

    monkeypatch.delenv("EBIRD_CLAVE", raising=False)
    monkeypatch.setattr(inat_espana, "recientes", lambda: [])
    assert ebird.recientes_espana(tmp_path / "r.json") == 0
    assert not (tmp_path / "r.json").exists()
