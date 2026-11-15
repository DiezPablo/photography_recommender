"""Especies registradas en cada punto de eBird (spec 021, bloque 3): qué se ha visto alguna vez allí.

Una petición por punto (`product/spplist/{punto}`), así que va por tandas: cada ejecución cubre los puntos con
más especies que aún falten, hasta donde llegue el presupuesto del día (ebird.quedan) y MAX_TANDA. El fichero
publicado hace de caché: un punto que ya está no se vuelve a pedir. Los nombres en español salen de la taxonomía
de eBird (una petición, solo cuando aparece un código nuevo).

Las especies sensibles no se dan por punto: eBird ya oculta las suyas y aquí se quitan además las de
AVES_SENSIBLES (decisión 0011: nunca ubicaciones exactas de especies sensibles a la molestia o al expolio).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import requests

from rasante.comun.red import sesion
from rasante.fauna import ebird

MAX_TANDA = 250  # puntos nuevos por ejecución como mucho
MIN_ESPECIES = 100  # solo los puntos con al menos estas especies en eBird (unos 4 500)
RESERVA = 1  # una petición guardada para la taxonomía
AVES_SENSIBLES = {
    "Tetrao urogallus",
    "Aquila adalberti",
    "Aquila fasciata",
    "Gypaetus barbatus",
    "Ciconia nigra",
    "Chlamydotis undulata",
}


def pendientes(lugares: list[dict], hechos: set[str]) -> list[str]:
    """Los puntos de eBird con MIN_ESPECIES o más que aún no tienen lista, de más a menos especies."""
    candidatos = [
        (x.get("e") or 0, x["id"][3:])
        for x in lugares
        if x.get("id", "").startswith("eb-") and (x.get("e") or 0) >= MIN_ESPECIES and x["id"][3:] not in hechos
    ]
    return [p for _, p in sorted(candidatos, key=lambda c: (-c[0], c[1]))]


def taxones_de(codigos: set[str], s) -> dict[str, list[str]]:
    """{código: [nombre científico, nombre en español]} de la taxonomía de eBird, solo de los códigos pedidos."""
    taxonomia = ebird._get("ref/taxonomy/ebird", {"fmt": "json", "locale": "es"}, s)
    return {
        t["speciesCode"]: [t.get("sciName") or "", t.get("comName") or ""]
        for t in taxonomia
        if isinstance(t, dict) and t.get("speciesCode") in codigos and t.get("category") == "species"
    }


def main(salida: Path, lugares: Path, max_tanda: int = MAX_TANDA) -> None:
    from rasante.comun.ficheros import escribir_json

    if not ebird.clave():
        print("eBird: sin EBIRD_CLAVE; no se piden las especies por punto", flush=True)
        return
    if not lugares.exists():
        print(f"eBird especies: falta {lugares}; no se pide nada", flush=True)
        return
    puntos: dict[str, list[str]] = {}
    taxones: dict[str, list[str]] = {}
    if salida.exists():
        guardado = json.loads(salida.read_text(encoding="utf-8"))
        puntos, taxones = guardado.get("puntos", {}), guardado.get("taxones", {})
    faltan = pendientes(json.loads(lugares.read_text(encoding="utf-8")).get("lugares", []), set(puntos))
    tanda = faltan[: max(0, min(max_tanda, ebird.quedan() - RESERVA))]
    s = sesion()
    nuevos: dict[str, list[str]] = {}
    for p in tanda:
        try:
            codigos = ebird._get(f"product/spplist/{p}", {}, s)
        except requests.RequestException as e:
            print(f"  eBird especies {p}: {e}", flush=True)
            continue
        if isinstance(codigos, list):
            nuevos[p] = [c for c in codigos if isinstance(c, str)]
    desconocidos = {c for cs in nuevos.values() for c in cs} - set(taxones)
    if desconocidos:
        try:
            taxones.update(taxones_de(desconocidos, s))
        except requests.RequestException as e:
            print(f"  eBird taxonomía: {e}; la tanda se repetirá", flush=True)
            nuevos = {}
    # solo especies con nombre (fuera híbridos y «sp.») y nunca las sensibles
    for p, codigos in nuevos.items():
        puntos[p] = [c for c in codigos if c in taxones and taxones[c][0] not in AVES_SENSIBLES]
    usados = {c for cs in puntos.values() for c in cs}
    taxones = {c: t for c, t in taxones.items() if c in usados}
    if not puntos:
        print("eBird especies: sin datos; no se escribe nada", flush=True)
        return
    escribir_json(
        salida,
        {
            "generado": datetime.now(UTC).isoformat(timespec="minutes"),
            "fuente": "eBird (ebird.org), Cornell Lab of Ornithology: especies registradas por punto de observación",
            "taxones": taxones,
            "puntos": puntos,
        },
    )
    print(
        f"{salida}: {len(puntos)} puntos con su lista de especies ({len(nuevos)} nuevos, "
        f"quedan {max(0, len(faltan) - len(nuevos))}); {len(taxones)} especies",
        flush=True,
    )
