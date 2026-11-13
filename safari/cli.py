"""Fauna en España: las órdenes del pipeline (cada una escribe su fichero de public/datos o el de --salida).

Uso:
  python -m safari --espana                      # cuadrícula de 10 km con GBIF → espana.json
  python -m safari --espana-ebird                # frecuencia de detección de aves (eBird en GBIF) → espana_ebird.json
  python -m safari --espana-recientes            # vistas en 30 días y rarezas (eBird, iNaturalist)
  python -m safari --espana-lugares              # lugares, Natura 2000 y rutas de OSM
  python -m safari --espana-listas               # listas de eBird por punto en 7 y 30 días
  python -m safari --espana-actividad espana.json  # hora de actividad por especie (iNaturalist)
"""

from __future__ import annotations

import argparse
from pathlib import Path

DATOS = Path("public/datos")


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(prog="safari", description=__doc__.splitlines()[0])
    ap.add_argument("--salida", type=Path, help="fichero de salida (por defecto, el de cada orden en public/datos)")
    ap.add_argument("--espana", action="store_true", help="fauna en España con GBIF (necesita GBIF_USUARIO/CLAVE)")
    ap.add_argument("--espana-actividad", type=Path, help="espana.json → hora de actividad por especie (iNaturalist)")
    ap.add_argument("--espana-lugares", action="store_true", help="lugares de fauna en España (eBird, Wikidata, OSM)")
    ap.add_argument("--espana-ebird", action="store_true", help="frecuencia de detección de aves (eBird en GBIF)")
    ap.add_argument("--espana-recientes", action="store_true", help="aves vistas en 30 días por provincia (eBird)")
    ap.add_argument("--espana-listas", action="store_true", help="listas de eBird por punto en 7 y 30 días")
    ap.add_argument("--espana-diagnostico", action="store_true", help="consultas SQL de prueba a GBIF (Gallocanta)")
    ap.add_argument(
        "--espana-experimentos", action="store_true", help="compara modelos de recomendación de España (caché de GBIF)"
    )
    a = ap.parse_args(argv)
    if a.espana_actividad:
        from safari.espana import inat_espana

        inat_espana.actividad_main(a.salida or DATOS / "espana_actividad.json", a.espana_actividad)
        return
    if a.espana_lugares:
        from safari.espana import lugares, natura

        destino = a.salida or DATOS / "espana_lugares.json"
        # primero Natura 2000: los lugares que se llaman como un espacio sin lugar propio se quedan con su código
        natura.main(destino.parent / "espana_natura.json")
        lugares.main(destino, destino.parent / "espana_natura.json")
        lugares.rutas(destino.parent / "espana_rutas.json")
        return
    if a.espana_ebird:
        from safari.espana import ebird_frecuencia

        ebird_frecuencia.main()
        return
    if a.espana_listas:
        from safari.espana import ebird_listas

        destino = a.salida or DATOS / "espana_listas.json"
        ebird_listas.main(destino, destino.parent / "espana_lugares.json")
        return
    if a.espana_recientes:
        from safari.espana import ebird

        destino = a.salida or DATOS / "espana_recientes.json"
        ebird.recientes_espana(destino)
        ebird.rarezas_espana(destino.parent / "espana_rarezas.json")
        return
    if a.espana_experimentos:
        from safari.espana import experimentos

        experimentos.main()
        return
    if a.espana_diagnostico:
        from safari.espana import diagnostico

        diagnostico.main()
        return
    if a.espana:
        from safari.espana import cli as espana

        espana.main()
        return
    ap.error("falta la orden: una de las --espana… (python -m safari --help)")
