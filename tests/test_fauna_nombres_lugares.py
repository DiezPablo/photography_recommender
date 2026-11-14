from rasante.fauna import nombres_lugares as n


def test_ebird_sin_avisos_ni_abreviaturas():
    assert n.ebird("Urdaibai BR--General Area (please consider using more precise location)".replace("--", " · ")) == (
        "Reserva de la Biosfera de Urdaibai · zona general"
    )
    assert n.ebird("*Aiguamolls de l'Empordà PNat · Area General* (please, choose a more accurate location)") == (
        "Parque Natural de Aiguamolls de l'Empordà · zona general"
    )
    assert n.ebird("La Sagra · Area General (usar hot spots mas específicos)") == "La Sagra · zona general"
    assert n.ebird("PN del Teide · Area General") == "Parque Nacional del Teide · zona general"
    assert n.ebird("Gozón · La Pelleya") == "Gozón · La Pelleya"
    assert n.ebird("Sierra de El Toro  ·  Área General") == "Sierra de El Toro · zona general"
    assert (
        n.ebird("Tossals d'Almatret RN 2000 · Area General") == "Red Natura 2000 de Tossals d'Almatret · zona general"
    )
    assert (
        n.ebird("Arribes del Duero PNat (límite) · Gamones") == "Parque Natural de Arribes del Duero (límite) · Gamones"
    )
    # un paréntesis que no es un aviso se queda
    assert n.ebird("Laguna de Gallocanta (Tornos)") == "Laguna de Gallocanta (Tornos)"


def test_wikidata_tipos_en_ingles():
    assert n.wikidata("Doñana Nature Park") == "Parque natural de Doñana"
    assert n.wikidata("Picos de Europa Biosphere Reserve") == "Reserva de la biosfera de Picos de Europa"
    assert n.wikidata("Parque Nacional de Ordesa") == "Parque Nacional de Ordesa"


def test_observatorios_de_osm():
    assert n.observatorio("Hide G") == "Observatorio G"
    assert n.observatorio("Observatory of Salinas") == "Observatorio de Salinas"
    assert n.observatorio("Bird Watching") is None
    assert n.observatorio("Hide") is None
    assert n.observatorio("Observatorio del Cerrillo") == "Observatorio del Cerrillo"
