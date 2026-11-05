from safari import inat

P = {"id": "serengeti", "lat": -2.33, "lon": 34.83, "radio_km": 60}


def _obs(id_, licencia, taxon=None, url="https://x/photos/1/square.jpg"):
    return {
        "id": id_,
        "taxon": taxon or {},
        "photos": [{"license_code": licencia, "url": url, "attribution": "(c) alguien"}],
    }


def test_foto_en_parque_prefiere_sin_nd_y_tamano_medio(monkeypatch):
    llamadas = []

    def falso(ruta, params, cache=None):
        llamadas.append(params)
        return {"results": [_obs(1, "cc-by-nc-nd"), _obs(2, None), _obs(3, "cc-by")]}

    monkeypatch.setattr(inat, "_get", falso)
    f = inat.foto_en_parque(P, 41964)
    assert f["obs"] == 3 and f["licencia"] == "CC-BY" and f["url"].endswith("/medium.jpg")
    assert llamadas[0]["taxon_id"] == 41964 and llamadas[0]["order_by"] == "votes"
    assert llamadas[0]["quality_grade"] == "research"


def test_foto_en_parque_sin_fotos_abiertas(monkeypatch):
    monkeypatch.setattr(inat, "_get", lambda *a, **k: {"results": [_obs(1, None)]})
    assert inat.foto_en_parque(P, 1) is None


def test_galeria_una_por_especie_sin_excluidas(monkeypatch):
    leon = {"id": 41964, "name": "Panthera leo", "preferred_common_name": "león"}
    gato = {"id": 118552, "name": "Felis catus", "preferred_common_name": "gato"}
    ñu = {"id": 42296, "name": "Connochaetes taurinus", "preferred_common_name": "Ñu azul"}
    res = [_obs(1, "cc-by", leon), _obs(2, "cc-by", leon), _obs(3, "cc-by", gato), _obs(4, "cc0", ñu)]
    monkeypatch.setattr(inat, "_get", lambda *a, **k: {"results": res})
    g = inat.galeria(P)
    assert [x["obs"] for x in g] == [1, 4]
    assert g[0]["nombre"] == "León"


def test_fotos_elegidas_mandan_sobre_la_de_inaturalist():
    f = inat.fotos_elegidas()
    assert len(f) >= 25
    assert f["Panthera leo"]["licencia"] in {"CC-BY", "CC-BY-SA", "CC-BY-NC", "CC-BY-NC-SA", "CC0"}
    assert all("ND" not in x["licencia"] for x in f.values())  # se recortan: nada de ND
    assert all(x["web"].startswith("https://www.inaturalist.org/photos/") for x in f.values())
    assert f["Giraffa camelopardalis"]["posicion"]
