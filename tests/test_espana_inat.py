"""iNaturalist en España: recientes sin especies sensibles ni coordenadas ocultas, tramos por el sol y perfil."""

from datetime import date, datetime

from safari import inat
from safari.espana import inat_espana


def obs(nombre, fecha, lat, lon, **extra):
    return {"taxon": {"name": nombre}, "observed_on": fecha, "location": f"{lat},{lon}", **extra}


def test_recientes(monkeypatch):
    res = [
        obs("Capreolus capreolus", "2026-11-01", 40.123, -3.456),
        obs("Capreolus capreolus", "2026-11-03", 40.124, -3.457),  # misma zona: queda la última
        obs("Lynx pardinus", "2026-11-02", 38.2, -4.0),  # sensible
        obs("Salamandra salamandra", "2026-11-02", 43.3, -5.8, obscured=True),
        obs("Vulpes vulpes crucigera", "2026-11-02", 42.0, -2.0),  # subespecie → especie
    ]
    monkeypatch.setattr(inat, "_get", lambda ruta, params, cache=None: {"results": res, "total_results": len(res)})
    r = inat_espana.recientes(hoy=date(2026, 11, 4))
    assert sorted((x["c"], x["f"]) for x in r) == [
        ("Capreolus capreolus", "2026-11-03"),
        ("Vulpes vulpes", "2026-11-02"),
    ]
    assert all(x["l"] is None and x["s"] == "i" for x in r)


def test_altura_sol_y_tramos():
    madrid = (40.42, -3.7)
    assert (
        inat_espana.tramo(inat_espana.altura_sol(datetime.fromisoformat("2026-06-21T14:00:00+00:00"), *madrid)) == "dia"
    )
    assert (
        inat_espana.tramo(inat_espana.altura_sol(datetime.fromisoformat("2026-06-21T04:00:00+00:00"), *madrid))
        == "noche"
    )
    assert (
        inat_espana.tramo(inat_espana.altura_sol(datetime.fromisoformat("2026-06-21T05:00:00+00:00"), *madrid))
        == "crepusculo"
    )


def test_perfil_corrige_por_el_grupo():
    # el grupo sale sobre todo de día; el búho tiene tantas de noche como de día: de noche es su tramo
    cuentas = {
        "Strix aluco": {"noche": 20, "crepusculo": 5, "dia": 20},
        "Turdus merula": {"noche": 1, "crepusculo": 30, "dia": 300},
    }
    p = inat_espana.perfil(cuentas, {"Strix aluco": "Aves", "Turdus merula": "Aves"})
    assert p["Strix aluco"]["f"][0] == 1.0
    assert p["Turdus merula"]["f"][2] > p["Turdus merula"]["f"][0]
