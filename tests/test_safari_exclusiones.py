"""Exclusiones de iNaturalist: domésticas en todos los parques y pares imposibles especie-parque."""

from safari import inat


def test_excluida():
    assert inat.excluida("galapagos", "Felis catus")
    assert inat.excluida("kruger", "Canis lupus familiaris")
    assert inat.excluida("ngorongoro", "Ceratotherium simum")
    assert inat.excluida("ngorongoro", "Ceratotherium simum simum")  # subespecie
    assert not inat.excluida("kruger", "Ceratotherium simum")  # en el Kruger sí hay
    assert not inat.excluida("ngorongoro", "Diceros bicornis")


def test_especies_filtra(monkeypatch):
    res = {
        "results": [
            {
                "taxon": {"id": 1, "name": "Ceratotherium simum", "preferred_common_name": "rinoceronte blanco"},
                "count": 10,
            },
            {"taxon": {"id": 2, "name": "Panthera leo", "preferred_common_name": "león"}, "count": 7},
        ]
    }
    monkeypatch.setattr(inat, "_get", lambda ruta, params, cache=None: res)
    xs = inat.especies({"id": "ngorongoro", "lat": -3.2, "lon": 35.5, "radio_km": 20}, "Mammalia", 12)
    assert [x["cientifico"] for x in xs] == ["Panthera leo"]


def test_webs_oficiales():
    from safari.cli import webs_oficiales

    w = webs_oficiales()
    assert w["serengeti"][0] == "https://www.tanzaniaparks.go.tz/"
    assert w["ngorongoro"][0] == "https://www.ncaa.go.tz/"
    assert all(u.startswith("https://") for u, _ in w.values())
