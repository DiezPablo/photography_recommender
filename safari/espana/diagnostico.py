"""Diagnóstico de las descargas SQL de GBIF: la primera descarga de España salió válida pero vacía (0 filas). Lanza
consultas pequeñas (solo el entorno de Gallocanta) quitando filtros uno a uno y dice cuántas filas da cada una.
Uso (en Actions, con las credenciales): python -m safari --espana-diagnostico
"""

from __future__ import annotations

import io
import zipfile

from safari.comun.red import sesion
from safari.espana import gbif_descarga

CAJA = "decimalLatitude >= 40.9 AND decimalLatitude <= 41.05 AND decimalLongitude >= -1.6 AND decimalLongitude <= -1.4"

VARIANTES = {
    "solo caja": f"SELECT COUNT(*) AS n FROM occurrence WHERE {CAJA}",
    "+ país": f"SELECT COUNT(*) AS n FROM occurrence WHERE {CAJA} AND countryCode = 'ES'",
    "+ clase aves": f"SELECT COUNT(*) AS n FROM occurrence WHERE {CAJA} AND countryCode = 'ES' AND occurrence.gbif_classification.classkey = '212'",
    "+ coordenadas y sin problemas": (
        f"SELECT COUNT(*) AS n FROM occurrence WHERE {CAJA} AND countryCode = 'ES' AND occurrence.gbif_classification.classkey = '212' "
        "AND hasCoordinate = TRUE AND hasGeospatialIssues = FALSE"
    ),
    "+ presente": (
        f"SELECT COUNT(*) AS n FROM occurrence WHERE {CAJA} AND countryCode = 'ES' AND occurrence.gbif_classification.classkey = '212' "
        "AND occurrenceStatus = 'PRESENT'"
    ),
    "+ año y mes": (
        f"SELECT COUNT(*) AS n FROM occurrence WHERE {CAJA} AND countryCode = 'ES' AND occurrence.gbif_classification.classkey = '212' "
        'AND "year" >= 2005 AND "month" IS NOT NULL AND speciesKey IS NOT NULL'
    ),
    "agrupada (como la de España)": gbif_descarga.consulta().replace(
        "countryCode = 'ES'", f"countryCode = 'ES' AND {CAJA}"
    ),
}


def main() -> None:
    s = sesion()
    for nombre, sql in VARIANTES.items():
        clave = gbif_descarga.pedir(sql, s)
        if not clave:
            return
        meta = gbif_descarga.esperar(clave, max_minutos=60, s=s)
        texto = s.get(meta["downloadLink"], timeout=300).content
        with zipfile.ZipFile(io.BytesIO(texto)) as z:
            contenido = z.read(z.namelist()[0]).decode("utf-8").splitlines()
        print(f"DIAGNÓSTICO {nombre}: {len(contenido) - 1} filas; primeras: {contenido[:3]}", flush=True)
