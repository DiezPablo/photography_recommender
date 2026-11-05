"""Nombres comunes de safari: diccionario, mayúsculas, guion blando y pendientes."""

from safari.nombres_comunes import diccionario, nombre_comun


def test_mayusculas_y_propios():
    assert nombre_comun("Mirounga leonina", "Elefante Marino Del Sur") == "Elefante marino del sur"
    assert nombre_comun("Zalophus wollebaeki", "León Marino de las Galápagos") == "León marino de las Galápagos"
    assert nombre_comun("Rucervus eldii", "Ciervo Porquerizo De Indochina") == "Ciervo porquerizo de Indochina"
    assert nombre_comun("Eudorcas thomsonii", "Gacela de Thomson") == "Gacela de Thomson"


def test_diccionario_y_limpieza():
    assert nombre_comun("Varanus niloticus", "Monitor del Nilo") == "Varano del Nilo"
    assert nombre_comun("Trichechus manatus", "Manatí\u00ad del Caribe") == "Manatí del Caribe"
    assert nombre_comun("Ara chloropterus", "Guacamaya roja") == "Guacamayo aliverde"
    assert "\u00ad" not in "".join(diccionario().values())


def test_sin_traducir_es_pendiente():
    assert nombre_comun("Agama dodomae", None) is None
    assert nombre_comun("Agama dodomae", "Agama dodomae") is None
