"""Clientes de GBIF (descargas SQL) y eBird: sin credenciales no hacen nada; con respuestas grabadas, las leen."""

import io
import zipfile

from rasante.fauna import ebird, gbif_descarga


def test_sin_credenciales(monkeypatch):
    monkeypatch.delenv("GBIF_USUARIO", raising=False)
    monkeypatch.delenv("GBIF_CLAVE", raising=False)
    monkeypatch.delenv("EBIRD_CLAVE", raising=False)
    assert gbif_descarga.credenciales() is None
    assert gbif_descarga.descargar() is None
    assert ebird.recientes(40.98, -1.5) == []
    assert ebird.hotspots(40.98, -1.5) == []


def test_lee_el_zip_de_gbif():
    tsv = "celda\tclassKey\tspeciesKey\tyear\tmonth\tn\n10kmE335N206\t212\t2474953\t2024\t12\t40\n"
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("0001234-261103.csv", tsv)
    assert gbif_descarga.filas(buf.getvalue()) == [
        {"celda": "10kmE335N206", "clase": 212, "especie": 2474953, "anio": 2024, "mes": 12, "n": 40}
    ]


class _Respuesta:
    def __init__(self, datos):
        self._datos = datos

    def raise_for_status(self):
        pass

    def json(self):
        return self._datos


class _Sesion:
    def __init__(self, datos):
        self.datos = datos
        self.cabeceras = None

    def get(self, url, params=None, headers=None, timeout=None):
        self.cabeceras = headers
        return _Respuesta(self.datos)


def test_ebird_recientes(monkeypatch):
    monkeypatch.setenv("EBIRD_CLAVE", "x")
    monkeypatch.setattr(ebird, "PAUSA_S", 0)
    s = _Sesion(
        [
            {
                "sciName": "Grus grus",
                "comName": "Grulla común",
                "obsDt": "2026-11-02 08:15",
                "locName": "Laguna de Gallocanta",
                "howMany": 12000,
            }
        ]
    )
    r = ebird.recientes(40.98, -1.5, s=s)
    assert r == [
        {
            "cientifico": "Grus grus",
            "nombre": "Grulla común",
            "fecha": "2026-11-02",
            "lugar": "Laguna de Gallocanta",
            "n": 12000,
        }
    ]
    assert s.cabeceras == {"X-eBirdApiToken": "x"}
