from safari import limpieza


def _op(nombre, web=None, tel=None, lat=-3.37, lon=36.68):
    return {"nombre": nombre, "web": web, "telefono": tel, "lat": lat, "lon": lon, "km": 1, "osm": f"node/{nombre}"}


def test_operadores_sin_aerolineas_ni_duplicados():
    lista = [
        _op("Precision Air", "https://precisionairtz.com"),
        _op("Kenya Airways Office"),
        _op("Leopard Tours", "https://www.leopard-tours.com", "+255 27 250 8441"),
        _op("Leopard Tours Ltd", None, "027 250 8441"),
        _op("Otra Safari Co", "https://leopard-tours.com/contacto"),
        _op("Roy Safaris", "https://roysafaris.com"),
        _op("Ab"),
    ]
    nombres = [o["nombre"] for o in limpieza.operadores(lista)]
    assert nombres == ["Leopard Tours", "Roy Safaris"]


def test_alojamientos_fuera_bares_cortados_y_duplicados_cercanos():
    lista = [
        _op("SERENA SAFARI LODGE"),
        _op("Serena Safari Lodge", lat=-3.3701),  # el mismo, a 11 m
        _op("Serena Safari Lodge", lat=-3.40),  # otro, a más de 3 km
        _op("Sunset Bar"),
        _op("Kilima Camp -"),
        _op("Ndutu Lodge"),
    ]
    nombres = [a["nombre"] for a in limpieza.alojamientos(lista)]
    assert nombres == ["Serena Safari Lodge", "Serena Safari Lodge", "Ndutu Lodge"]


def test_repartir_alojamientos_al_parque_mas_cercano():
    a = {"nombre": "Lodge", "osm": "way/1", "lat": 0, "lon": 0}
    parques = [{"osm": {"alojamientos": [{**a, "km": 30}]}}, {"osm": {"alojamientos": [{**a, "km": 5}]}}, {}]
    limpieza.repartir_alojamientos(parques)
    assert parques[0]["osm"]["alojamientos"] == []
    assert len(parques[1]["osm"]["alojamientos"]) == 1
