"""¿Son los mismos spots? Compara los identificadores de dos spots.geojson (spec 024, punto 4): el que usó la
previsión y el que está publicado ahora. Sale con 0 si coinciden y con 1 (y lo dice) si no.

Uso: python3 .github/scripts/mismos_spots.py usado.geojson publicado.geojson
"""

import json
import sys


def ids(ruta: str) -> set[str]:
    with open(ruta, encoding="utf-8") as f:
        return {x["properties"]["id"] for x in json.load(f)["features"]}


def main() -> int:
    usado, publicado = ids(sys.argv[1]), ids(sys.argv[2])
    if usado == publicado:
        return 0
    print(
        f"El catálogo publicado cambió durante la previsión ({len(publicado - usado)} spots nuevos, "
        f"{len(usado - publicado)} fuera): no se publican informe.json ni lugares.json de esta ejecución."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
