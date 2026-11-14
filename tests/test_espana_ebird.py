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


def test_notables_una_por_especie_y_lugar(monkeypatch):
    datos = [
        {
            "sciName": "Calidris melanotos",
            "comName": "Correlimos pectoral",
            "locId": "L1",
            "obsDt": "2026-11-01 08:00",
            "lat": 43.4,
            "lng": -3.8,
            "locName": "Marismas--Santoña",
            "howMany": 1,
            "obsReviewed": False,
            "obsValid": True,
        },
        {
            "sciName": "Calidris melanotos",
            "comName": "Correlimos pectoral",
            "locId": "L1",
            "obsDt": "2026-11-03 09:30",
            "lat": 43.4,
            "lng": -3.8,
            "locName": "Marismas--Santoña",
            "howMany": 2,
            "obsReviewed": True,
            "obsValid": True,
        },
    ]
    monkeypatch.setenv("EBIRD_CLAVE", "x")
    monkeypatch.setattr(ebird, "_get", lambda ruta, params, s=None: datos)
    xs = ebird.notables_region("ES-CB-S")
    assert len(xs) == 1
    assert xs[0]["f"] == "2026-11-03 09:30" and xs[0]["k"] == 2 and xs[0]["r"] is True
    assert xs[0]["l"] == "Marismas · Santoña"


def test_provincias_incluye_las_comunidades_de_una_sola_provincia(monkeypatch):
    """eBird solo da segundo nivel donde lo hay: Madrid, Asturias o Murcia son regiones de primer nivel y sin
    ellas se quedaban sin datos (visto en producción el 14-11-2026: ni una observación en esas comunidades)."""

    def falso(ruta, params, s=None):
        if "subnational2" in ruta:
            return [{"code": "ES-AR-TE", "name": "Teruel"}, {"code": "ES-CN-TF", "name": "Tenerife"}]
        return [
            {"code": "ES-AR", "name": "Aragón"},
            {"code": "ES-CN", "name": "Canarias"},
            {"code": "ES-MD", "name": "Madrid"},
            {"code": "ES-AS", "name": "Asturias"},
        ]

    monkeypatch.setattr(ebird, "_get", falso)
    assert [p["code"] for p in ebird.provincias()] == ["ES-AR-TE", "ES-CN-TF", "ES-MD", "ES-AS"]
