"""Nombres de lugares en español. Los hotspots de eBird traen avisos para los observadores («General Area (please
consider using more precise location)») y abreviaturas (PN, PNat, BR); algunos espacios de Wikidata solo tienen
etiqueta en inglés («Doñana Nature Park»), y algunos observatorios de OSM se llaman «Hide G» o «Bird Watching»."""

import re

# avisos entre paréntesis o asteriscos para quien registra observaciones en eBird
_AVISO = re.compile(
    r"\s*\((?=[^)]*\b(please|use|usar|usa|create|choose|elige|utiliz|hotspots?|hot spots?|precis|specific|"
    r"espec[ií]fic)\b)[^)]*\)",
    re.IGNORECASE,
)
_ZONA_GENERAL = re.compile(r"\b(general area|area general|área general|zona general)\b", re.IGNORECASE)

# abreviaturas de eBird en España; detrás del nombre («Doñana PNat») pasan delante («Parque Natural de Doñana»)
_ABREVIATURAS = {
    "PNat": "Parque Natural",
    "PN": "Parque Nacional",
    "BR": "Reserva de la Biosfera",
    "RN 2000": "Red Natura 2000",
    "RN": "Reserva Natural",
    "PR": "Parque Regional",
    "MN": "Monumento Natural",
}
_ABR = "|".join(re.escape(a) for a in _ABREVIATURAS)
_DETRAS = re.compile(rf"^(.+?)\s+({_ABR})(\s*\(.*\))?$")
_DELANTE = re.compile(rf"^({_ABR})\s+")


def _tramo(t: str) -> str:
    """Un tramo del nombre (entre « · »)."""
    if m := _DETRAS.match(t):
        resto = m.group(1)
        enlace = "" if re.match(r"(de|del|d')\b", resto) else ("del " if resto.startswith("El ") else "de ")
        if enlace == "del ":
            resto = resto[3:]
        return f"{_ABREVIATURAS[m.group(2)]} {enlace}{resto}{m.group(3) or ''}"
    if m := _DELANTE.match(t):
        return f"{_ABREVIATURAS[m.group(1)]} {t[m.end() :]}"
    return t


# tipos en inglés de Wikidata: «X Nature Park» → «Parque natural X»
_TIPOS_EN = [
    (re.compile(r"^(.+?)\s+(Natural|Nature) Park$"), "Parque natural de {}"),
    (re.compile(r"^(.+?)\s+National Park$"), "Parque nacional de {}"),
    (re.compile(r"^(.+?)\s+Biosphere Reserve$"), "Reserva de la biosfera de {}"),
    (re.compile(r"^(.+?)\s+Geological Park$"), "Parque geológico de {}"),
    (re.compile(r"^(.+?)\s+Cultural Park$"), "Parque cultural de {}"),
    (re.compile(r"^(.+?)\s+Nature Reserve$"), "Reserva natural de {}"),
    (re.compile(r"^(.+?)\s+Natural Monument$"), "Monumento natural de {}"),
    (re.compile(r"^(.+?)\s+Regional Park$"), "Parque regional de {}"),
]

# observatorios de OSM con nombre en inglés
_HIDE = re.compile(r"^(bird ?hide|hide|bird ?watching|birdwatching|observatory)\b\s*(of\s+)?", re.IGNORECASE)


def ebird(nombre: str) -> str:
    t = _AVISO.sub("", nombre).replace("*", "")
    t = _ZONA_GENERAL.sub("zona general", t)
    tramos = [_tramo(" ".join(x.split())) for x in t.split("·")]
    return " · ".join(x for x in tramos if x).strip(" ·-")


def wikidata(nombre: str) -> str:
    for patron, plantilla in _TIPOS_EN:
        if m := patron.match(nombre.strip()):
            return plantilla.format(m.group(1))
    return nombre


def observatorio(nombre: str | None) -> str | None:
    """«Hide G» → «Observatorio G»; «Hide» o «Bird Watching» a secas → sin nombre (se nombra después)."""
    if not nombre:
        return None
    if m := _HIDE.match(nombre.strip()):
        resto = nombre.strip()[m.end() :].strip(" -·")
        if not resto:
            return None
        return f"Observatorio {'de ' if m.group(2) else ''}{resto}"
    return nombre
