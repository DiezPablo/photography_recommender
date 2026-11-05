from safari.refinar import nucleo, solapes


def _p(id_, nombre, lat, lon, radio=20, punt=100, destacado=False, pais="Tanzania"):
    return {
        "id": id_,
        "nombre": nombre,
        "lat": lat,
        "lon": lon,
        "radio_km": radio,
        "puntuacion": punt,
        "destacado": destacado,
        "pais_nombre": pais,
        "nivel": "A" if destacado else "B",
    }


def test_nucleo_sin_genericos_ni_pais():
    paises = {"benin", "niger", "burkina faso"}
    assert nucleo("W National Park of Benin", paises) == "w"
    assert nucleo("Parque nacional W de Níger", paises) == "w"
    assert nucleo("Parque nacional del Lago Manyara", paises) == "lago manyara"


def test_contenedores_y_duplicados():
    ps = [
        _p("serengeti", "Serengeti", -2.33, 34.83, 60, 900, True),
        _p("bio", "Serengeti-Ngorongoro Biosphere Reserve", -2.6, 35.0, 40, 500),
        _p("w-ne", "Parque nacional de W", 12.3, 2.4, 40, 300, pais="Níger"),
        _p("w-bj", "W National Park of Benin", 11.9, 2.6, 40, 200, pais="Benín"),
        _p("tarangire", "Tarangire", -4.0, 36.0, 30, 400),
    ]
    solapes(ps)
    marcado = {p["id"]: p.get("solapa") for p in ps}
    assert marcado == {"serengeti": None, "bio": "serengeti", "w-ne": None, "w-bj": "w-ne", "tarangire": None}
