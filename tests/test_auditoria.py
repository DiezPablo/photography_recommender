"""Auditoría de lugares.json (spec 002): cobertura, campos vacíos, duplicados y nombres dudosos."""

from datetime import date

from test_lugares import EVENTOS, FAUNA, NATURA, PROVINCIAS, SPOTS, _spot

from rasante.lugares.auditoria import auditar, informe, normal
from rasante.lugares.cli import construir


def _doc():
    spots = {
        "features": [
            *SPOTS["features"],
            # a 150 m del Mirador de los Robledos: candidato a duplicado
            _spot("mirador-de-la-gitana-dddd", "Mirador de la Gitana", 40.8582, -3.8882),
            _spot("mirador-eeee", "Mirador", 37.1, -3.6, provincia="Granada", ccaa="Andalucía"),
        ]
    }
    fauna = {
        "lugares": [
            *FAUNA["lugares"],
            # el mismo embalse como punto de eBird y como observatorio, y dos observatorios pegados
            {"id": "eb-L9", "n": "Observatorio de Santillana", "t": "Punto de observación", "lat": 40.721, "lon": -3.841, "r": 2},
            {"id": "osm-node-100", "n": "Observatorio norte", "t": "Observatorio de aves", "lat": 40.7204, "lon": -3.8403, "r": 2},
        ]
    }  # fmt: skip
    return construir(spots, fauna, NATURA, EVENTOS, PROVINCIAS)[0]


def test_normal():
    assert normal("  Peñalara — (Cumbre) ") == "penalara cumbre"


def test_hallazgos():
    a = auditar(_doc(), ["Madrid", "A Coruña", "Granada", "Zamora", "Soria"])
    assert a["cuenta"] == {"luz": 5, "fauna": 6}
    cob = {c["provincia"]: c for c in a["cobertura"]}
    assert cob["Madrid"]["spots"] == 3 and cob["Madrid"]["puntos"] == 2 and cob["Madrid"]["sitios"] == 3
    assert cob["Soria"] == {"provincia": "Soria", "ccaa": "—", "spots": 0, "puntos": 0, "sitios": 0}
    # duplicados dentro de cada catálogo
    assert [(x["id"], y["id"]) for _, x, y in a["duplicados"]["luz"]] == [
        ("mirador-de-la-gitana-dddd", "mirador-de-los-robledos-aaaa")
    ]
    assert [(x["id"], y["id"]) for _, x, y in a["duplicados"]["fauna_mismo_nombre"]] == [("eb-L9", "osm-node-99")]
    assert [(x["id"], y["id"]) for _, x, y in a["duplicados"]["fauna_pegados"]] == [("osm-node-100", "osm-node-99")]
    assert [x["id"] for x in a["nombres"]] == ["mirador-eeee"]
    assert a["vacios"]["luz"]["sin foto"] == 4 and a["vacios"]["luz"]["total"] == 5
    assert a["vacios"]["fauna"]["puntos de eBird sin recuento de especies"] == 1


def test_informe_en_markdown():
    texto = informe(auditar(_doc(), ["Madrid", "Soria"]), date(2026, 11, 13))
    assert texto.startswith("# Auditoría de la base de datos de lugares (2026-11-13)")
    assert "| Soria | — | 0 ⚠ | 0 ⚠ | 0 |" in texto
    assert "2 sin ninguno (Soria, Zamora)" in texto
    assert "Mirador de la Gitana (`mirador-de-la-gitana-dddd`) ↔ Mirador de los Robledos" in texto
    assert "«Mirador» (`mirador-eeee`, luz, Granada)" in texto
