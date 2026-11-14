"""python -m rasante fauna <orden>: el pipeline del modo Fauna (cada orden escribe su fichero de public/datos o
el de --salida).

  cuadricula    cuadrícula de 10 km con GBIF (GBIF_USUARIO, GBIF_CLAVE) → espana.json
  ebird         frecuencia de detección de aves (eBird en GBIF) → espana_ebird.json
  recientes     vistas en 30 días y rarezas (eBird con EBIRD_CLAVE, iNaturalist) → espana_recientes.json
  lugares       lugares, Natura 2000 y rutas de OSM → espana_lugares.json
  listas        listas de eBird por punto en 7 y 30 días → espana_listas.json
  actividad F   hora de actividad por especie (iNaturalist) a partir de un espana.json → espana_actividad.json
  diagnostico   consultas SQL de prueba a GBIF
  experimentos  compara modelos de recomendación con la caché de GBIF
"""

from __future__ import annotations

import argparse
from pathlib import Path

DATOS = Path("public/datos")
ORDENES = ("cuadricula", "ebird", "recientes", "lugares", "listas", "actividad", "diagnostico", "experimentos")


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(
        prog="python -m rasante fauna", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("orden", choices=ORDENES)
    ap.add_argument(
        "entrada", nargs="?", type=Path, help="solo en «actividad»: el espana.json del que salen las especies"
    )
    ap.add_argument("--salida", type=Path, help="fichero de salida (por defecto, el de cada orden en public/datos)")
    a = ap.parse_args(argv)
    if a.orden == "actividad":
        from rasante.fauna import inat_espana

        if not a.entrada:
            ap.error("actividad necesita el espana.json de entrada")
        inat_espana.actividad_main(a.salida or DATOS / "espana_actividad.json", a.entrada)
    elif a.orden == "lugares":
        from rasante.fauna import lugares, natura

        destino = a.salida or DATOS / "espana_lugares.json"
        # primero Natura 2000: los lugares que se llaman como un espacio sin lugar propio se quedan con su código
        natura.main(destino.parent / "espana_natura.json")
        lugares.main(destino, destino.parent / "espana_natura.json")
        lugares.rutas(destino.parent / "espana_rutas.json")
    elif a.orden == "ebird":
        from rasante.fauna import ebird_frecuencia

        ebird_frecuencia.main()
    elif a.orden == "listas":
        from rasante.fauna import ebird_listas

        destino = a.salida or DATOS / "espana_listas.json"
        ebird_listas.main(destino, destino.parent / "espana_lugares.json")
    elif a.orden == "recientes":
        from rasante.fauna import ebird

        destino = a.salida or DATOS / "espana_recientes.json"
        ebird.recientes_espana(destino)
        ebird.rarezas_espana(destino.parent / "espana_rarezas.json")
    elif a.orden == "experimentos":
        from rasante.fauna import experimentos

        experimentos.main()
    elif a.orden == "diagnostico":
        from rasante.fauna import diagnostico

        diagnostico.main()
    else:
        from rasante.fauna import cuadricula

        cuadricula.main()
