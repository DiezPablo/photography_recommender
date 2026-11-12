"""python -m rasante lugares: índice común de spots de luz y lugares de fauna → lugares.json (spec 003).

Lee spots.geojson (modo Luz) y espana_lugares.json + espana_natura.json (modo Fauna), tal como están publicados
(sueltos o .gz), los pasa al esquema de rasante/recursos/lugar.schema.json, enlaza cada lugar con los del otro
catálogo que tiene cerca y con sus eventos, valida y escribe. Falla, sin escribir nada, si algún lugar no cumple
el esquema o hay identificadores repetidos.

  python -m rasante lugares --spots spots.geojson --fauna espana_lugares.json --natura espana_natura.json
"""

from __future__ import annotations

import argparse
import gzip
import json
from datetime import UTC, datetime
from pathlib import Path

from jsonschema import Draft202012Validator

from rasante.comun.ficheros import escribir_json
from rasante.comun.territorio import Provincias
from rasante.eventos import naturaleza
from rasante.lugares import modelo
from rasante.prevision.mar import Costa

ESQUEMA = Path(__file__).resolve().parents[1] / "recursos" / "lugar.schema.json"


def leer(ruta: Path | None):
    """JSON de un fichero suelto o comprimido; None si no existe (un catálogo puede faltar)."""
    if ruta is None or not ruta.exists():
        return None
    if ruta.suffix == ".gz":
        with gzip.open(ruta, "rt", encoding="utf-8") as f:
            return json.load(f)
    return json.loads(ruta.read_text(encoding="utf-8"))


def construir(
    spots: dict | None,
    fauna: dict | None,
    natura: dict | None,
    eventos: list[dict],
    provincias: Provincias | None = None,
    costa=None,
) -> tuple[dict, int]:
    """El documento lugares.json y cuántos lugares de fauna se descartan por caer fuera de España o en el mar."""
    # la cuadrícula es del pipeline de fauna (safari.espana) hasta que se unifiquen los paquetes (spec 006)
    from safari.espana.rejilla import celdas_en_radio

    provincias = provincias or Provincias()
    sitios = (natura or {}).get("sitios", {})
    lugares = [modelo.de_spot(f, costa) for f in (spots or {}).get("features", [])]
    fuera = 0
    for x in modelo.con_natura((fauna or {}).get("lugares", []), sitios):
        lugar = modelo.de_fauna(x, sitios, provincias, celdas_en_radio)
        if lugar:
            lugares.append(lugar)
        else:
            fuera += 1
    modelo.enlazar_cerca(lugares)
    modelo.enlazar_eventos(lugares, eventos)
    lugares.sort(key=lambda x: (x["catalogo"] != "luz", x["id"]))
    doc = {
        "esquema": 1,
        "generado": datetime.now(UTC).isoformat(timespec="seconds"),
        "fuentes": modelo.FUENTES,
        "cuenta": modelo.resumen(lugares),
        "lugares": lugares,
    }
    return doc, fuera


def errores(doc: dict, maximo: int = 15) -> list[str]:
    """Incumplimientos del esquema e identificadores repetidos (lista vacía si todo está bien)."""
    validador = Draft202012Validator(json.loads(ESQUEMA.read_text(encoding="utf-8")))
    salida = []
    for e in validador.iter_errors(doc):
        ruta = list(e.absolute_path)
        donde = doc["lugares"][ruta[1]].get("id", ruta[1]) if len(ruta) > 1 and ruta[0] == "lugares" else "documento"
        salida.append(f"{donde}: {'/'.join(map(str, ruta[2:])) or '(lugar)'}: {e.message[:160]}")
        if len(salida) >= maximo:
            break
    vistos: set[str] = set()
    for x in doc["lugares"]:
        if x.get("id") in vistos:
            salida.append(f"{x['id']}: identificador repetido")
        vistos.add(x.get("id"))
    ids = vistos
    for x in doc["lugares"]:
        if any(c not in ids for c in x.get("cerca", [])):
            salida.append(f"{x['id']}: `cerca` apunta a un lugar que no existe")
    return salida[: maximo + 5]


def imprimir_resumen(doc: dict, fuera: int) -> None:
    c = doc["cuenta"]
    print(f"Lugares: {c['total']} ({', '.join(f'{k} {v}' for k, v in c['catalogo'].items())})")
    for cat in ("luz", "fauna"):
        if cat not in c["catalogo"]:
            continue
        print(f"  {cat} por tipo: " + ", ".join(f"{k} {v}" for k, v in c["tipo"][cat].items()))
        print(f"  {cat} por comunidad: " + ", ".join(f"{k} {v}" for k, v in c["ccaa"][cat].items()))
        print(f"  {cat}: {c['con_cerca'].get(cat, 0)} con lugares del otro catálogo a ≤ {modelo.KM_CERCA:.0f} km, "
              f"{c['con_eventos'].get(cat, 0)} con eventos")  # fmt: skip
    print(f"  con foto: {c['con_foto']}; lugares de fauna fuera de España o mar adentro (descartados): {fuera}")


def main(argv: list[str] | None = None) -> None:
    datos = Path("public/datos")
    ap = argparse.ArgumentParser(prog="python -m rasante lugares", description=__doc__.split("\n")[0])
    ap.add_argument("--spots", type=Path, default=datos / "spots.geojson")
    ap.add_argument("--fauna", type=Path, default=datos / "espana_lugares.json")
    ap.add_argument("--natura", type=Path, default=datos / "espana_natura.json")
    ap.add_argument("--salida", type=Path, default=datos / "lugares.json")
    a = ap.parse_args(argv)

    spots, fauna, natura = leer(a.spots), leer(a.fauna), leer(a.natura)
    if not spots and not fauna:
        raise SystemExit("No hay ni spots ni lugares de fauna: nada que escribir")
    for nombre, d in (("spots", spots), ("lugares de fauna", fauna), ("Natura 2000", natura)):
        if d is None:
            print(f"Aviso: sin {nombre}; el índice sale sin ellos")
    provincias = Provincias()
    doc, fuera = construir(spots, fauna, natura, naturaleza.cargar(provincias=provincias), provincias, Costa())
    fallos = errores(doc)
    if fallos:
        raise SystemExit("lugares.json no cumple el esquema:\n  " + "\n  ".join(fallos))
    a.salida.parent.mkdir(parents=True, exist_ok=True)
    escribir_json(a.salida, doc)
    imprimir_resumen(doc, fuera)
    print(f"Escrito {a.salida} ({a.salida.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
