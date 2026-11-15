"""python -m rasante fauna <orden>: el pipeline del modo Fauna (cada orden escribe su fichero de public/datos o
el de --salida).

  cuadricula    cuadrícula de 10 km con GBIF (GBIF_USUARIO, GBIF_CLAVE) → fauna_cuadricula.json
  ebird         frecuencia de detección de aves (eBird en GBIF) → fauna_ebird.json
  recientes     vistas en 30 días y rarezas (eBird con EBIRD_CLAVE, iNaturalist) → fauna_recientes.json
  lugares       lugares y Natura 2000 → fauna_lugares.json, fauna_natura.json
  listas        listas de eBird por punto en 7 y 30 días → fauna_listas.json
  regiones      actividad diaria de eBird por región (listas, observadores, especies) → fauna_ebird_regiones.json
  especies      especies registradas en cada punto de eBird, por tandas → fauna_especies_punto.json
  actividad F   hora de actividad por especie (iNaturalist) a partir de un fauna_cuadricula.json → fauna_actividad.json
"""

from __future__ import annotations

import argparse
from pathlib import Path

DATOS = Path("public/datos")
ORDENES = (
    "cuadricula",
    "ebird",
    "recientes",
    "lugares",
    "listas",
    "regiones",
    "especies",
    "actividad",
)


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(
        prog="python -m rasante fauna", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("orden", choices=ORDENES)
    ap.add_argument(
        "entrada", nargs="?", type=Path, help="solo en «actividad»: el fauna_cuadricula.json del que salen las especies"
    )
    ap.add_argument("--salida", type=Path, help="fichero de salida (por defecto, el de cada orden en public/datos)")
    a = ap.parse_args(argv)
    if a.orden == "actividad":
        from rasante.fauna import inat_espana

        if not a.entrada:
            ap.error("actividad necesita el fauna_cuadricula.json de entrada")
        inat_espana.actividad_main(a.salida or DATOS / "fauna_actividad.json", a.entrada)
    elif a.orden == "lugares":
        from rasante.fauna import lugares, natura

        destino = a.salida or DATOS / "fauna_lugares.json"
        # primero Natura 2000: los lugares que se llaman como un espacio sin lugar propio se quedan con su código
        natura.main(destino.parent / "fauna_natura.json")
        lugares.main(destino, destino.parent / "fauna_natura.json")
    elif a.orden == "ebird":
        from rasante.fauna import ebird_frecuencia

        ebird_frecuencia.main()
    elif a.orden == "listas":
        from rasante.fauna import ebird_listas

        destino = a.salida or DATOS / "fauna_listas.json"
        ebird_listas.main(destino, destino.parent / "fauna_lugares.json")
    elif a.orden == "regiones":
        from rasante.fauna import ebird_actividad

        ebird_actividad.main(a.salida or DATOS / "fauna_ebird_regiones.json")
    elif a.orden == "especies":
        from rasante.fauna import ebird_especies

        destino = a.salida or DATOS / "fauna_especies_punto.json"
        ebird_especies.main(destino, destino.parent / "fauna_lugares.json")
    elif a.orden == "recientes":
        from rasante.fauna import ebird

        destino = a.salida or DATOS / "fauna_recientes.json"
        ebird.recientes_espana(destino)
        ebird.rarezas_espana(destino.parent / "fauna_rarezas.json")
    else:
        from rasante.fauna import cuadricula

        cuadricula.main()
