"""¿Toca ejecutar este workflow? GitHub retrasa los cron horas (de 7 a 9 h en 11-2026), así que los diarios se
programan cada hora y este paso decide (decisión 0024): sigue si estamos dentro de una de sus ventanas, en hora
peninsular, y no hubo ya una ejecución con éxito en esa ventana. A mano o por push, siempre sigue.

Con --vencida H, sigue también fuera de las ventanas si la última ejecución con éxito tiene H horas o más: GitHub
llega a saltarse casi todas las horas (en 11-2026, tres o cuatro ejecuciones al día) y una ventana entera puede
quedarse sin ninguna (decisión 0025).

«Con éxito» es que corrió el trabajo de verdad, no solo «cuando»: una ejecución que dijo «no» acaba también en
success y no cuenta.

Con --maximo N, además, no sigue si ese día (hora peninsular) ya hubo N ejecuciones con éxito, venga de donde venga
(programada, push o a mano): las previsiones gastan el cupo diario de Open-Meteo (spec 024, punto 6). Solo lo salta
una ejecución a mano con FORZAR=true.

Uso (en un paso de GitHub Actions, con GH_TOKEN):
    python3 .github/scripts/toca.py luz_datos.yml "4-7,12-16" [--maximo 2] [--vencida 8]
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


def _gh(*args: str) -> list | dict:
    salida = subprocess.run(["gh", *args], capture_output=True, text=True, check=True).stdout
    return json.loads(salida or "[]")


def hizo_trabajo(trabajos: list[dict]) -> bool:
    """Si en una ejecución corrió con éxito algún trabajo además de «cuando» (si no, fue un «no toca»)."""
    return any(t.get("name") != "cuando" and t.get("conclusion") == "success" for t in trabajos)


def buenas(workflow: str, cuantas: int = 50, desde: datetime | None = None) -> list[datetime]:
    """Las últimas ejecuciones que hicieron el trabajo, de la más reciente a la más antigua (hasta `desde`)."""
    previas = _gh(
        "run",
        "list",
        "--workflow",
        workflow,
        "--status",
        "success",
        "--limit",
        str(cuantas),
        "--json",
        "databaseId,createdAt",
    )
    fechas = []
    for r in previas:
        t = datetime.fromisoformat(r["createdAt"].replace("Z", "+00:00"))
        if desde and t < desde:
            break
        if hizo_trabajo(_gh("run", "view", str(r["databaseId"]), "--json", "jobs")["jobs"]):
            fechas.append(t)
    return fechas


def decidir(
    evento: str,
    ahora: datetime,
    vs: list[tuple[int, int]],
    ultima: datetime | None,
    hoy: int = 0,
    maximo: int | None = None,
    forzar: bool = False,
    vencida: float | None = None,
) -> tuple[bool, str]:
    """`hoy`: ejecuciones con éxito ese día en hora peninsular; `maximo`: tope diario (None, sin tope);
    `vencida`: horas desde la última buena a partir de las que se corre aunque no haya ventana (None, nunca)."""
    if evento == "workflow_dispatch" and forzar:
        return True, "a mano y forzada: siempre"
    if maximo is not None and hoy >= maximo:
        return False, f"ya hubo {hoy} con éxito hoy (tope {maximo}, por el cupo de Open-Meteo)"
    if evento != "schedule":
        return True, f"evento {evento}: siempre"
    if vencida is not None:
        if ultima is None:
            return True, "no hay ninguna ejecución buena reciente"
        horas = (ahora - ultima).total_seconds() / 3600
        if horas >= vencida:
            return True, f"la última buena tiene {horas:.0f} h (vencida a las {vencida:g} h)"
    inicio = inicio_ventana(ahora, vs)
    if inicio is None:
        return False, f"{ahora:%H:%M} fuera de las ventanas"
    if ultima and ultima >= inicio:
        return False, f"ya hubo una buena a las {ultima.astimezone(MADRID):%H:%M} en esta ventana"
    return True, f"{ahora:%H:%M}: ventana desde las {inicio:%H:%M} sin ejecución buena"


def main() -> None:
    workflow, texto = sys.argv[1], sys.argv[2]
    maximo = int(sys.argv[sys.argv.index("--maximo") + 1]) if "--maximo" in sys.argv else None
    vencida = float(sys.argv[sys.argv.index("--vencida") + 1]) if "--vencida" in sys.argv else None
    evento = os.environ.get("GITHUB_EVENT_NAME", "")
    forzar = os.environ.get("FORZAR", "").lower() == "true"
    ahora = datetime.now(MADRID)
    # basta mirar desde ayer: el tope cuenta hoy y «vencida» no pasa de un día
    previas = buenas(workflow, desde=ahora - timedelta(hours=36))
    ultima = previas[0] if previas else None
    hoy = sum(1 for t in previas if t.astimezone(MADRID).date() == ahora.date())
    toca, motivo = decidir(evento, ahora, ventanas(texto), ultima, hoy, maximo, forzar, vencida)
    print(f"¿Toca? {'sí' if toca else 'no'}: {motivo}")
    with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a", encoding="utf-8") as f:
        f.write(f"toca={'true' if toca else 'false'}\n")


if __name__ == "__main__":
    main()
