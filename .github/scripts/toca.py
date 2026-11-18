"""¿Toca ejecutar este workflow? GitHub retrasa los cron horas (de 7 a 9 h en 11-2026), así que los diarios se
programan cada hora y este paso decide (decisión 0024): sigue si estamos dentro de una de sus ventanas, en hora
peninsular, y no hubo ya una ejecución con éxito en esa ventana. A mano o por push, siempre sigue.

Uso (en un paso de GitHub Actions, con GH_TOKEN): python3 .github/scripts/toca.py luz_datos.yml "3-7,12-16"
Escribe toca=true|false en $GITHUB_OUTPUT.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

MADRID = ZoneInfo("Europe/Madrid")


def ventanas(texto: str) -> list[tuple[int, int]]:
    return [tuple(int(h) for h in v.split("-")) for v in texto.split(",")]  # type: ignore[misc]


def inicio_ventana(ahora: datetime, vs: list[tuple[int, int]]) -> datetime | None:
    """El comienzo de la ventana en la que cae `ahora` (hora local), o None si no cae en ninguna."""
    for desde, hasta in vs:
        if desde <= ahora.hour < hasta:
            return ahora.replace(hour=desde, minute=0, second=0, microsecond=0)
    return None


def ultima_buena(workflow: str) -> datetime | None:
    salida = subprocess.run(
        ["gh", "run", "list", "--workflow", workflow, "--status", "success", "--limit", "1", "--json", "createdAt"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    runs = json.loads(salida or "[]")
    return datetime.fromisoformat(runs[0]["createdAt"].replace("Z", "+00:00")) if runs else None


def decidir(evento: str, ahora: datetime, vs: list[tuple[int, int]], ultima: datetime | None) -> tuple[bool, str]:
    if evento != "schedule":
        return True, f"evento {evento}: siempre"
    inicio = inicio_ventana(ahora, vs)
    if inicio is None:
        return False, f"{ahora:%H:%M} fuera de las ventanas"
    if ultima and ultima >= inicio:
        return False, f"ya hubo una buena a las {ultima.astimezone(MADRID):%H:%M} en esta ventana"
    return True, f"{ahora:%H:%M}: ventana desde las {inicio:%H:%M} sin ejecución buena"


def main() -> None:
    workflow, texto = sys.argv[1], sys.argv[2]
    evento = os.environ.get("GITHUB_EVENT_NAME", "")
    ahora = datetime.now(MADRID)
    ultima = ultima_buena(workflow) if evento == "schedule" else None
    toca, motivo = decidir(evento, ahora, ventanas(texto), ultima)
    print(f"¿Toca? {'sí' if toca else 'no'}: {motivo}")
    with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a", encoding="utf-8") as f:
        f.write(f"toca={'true' if toca else 'false'}\n")


if __name__ == "__main__":
    main()
