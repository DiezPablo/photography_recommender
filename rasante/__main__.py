"""Punto de entrada: python -m rasante <orden> [opciones]."""

from __future__ import annotations

import importlib
import sys

ORDENES = {
    "prevision": ("rasante.prevision.cli", "Previsión y notas de cada spot → informe.json"),
    "spots": ("rasante.spots.cli", "Descubrir spots en toda España → spots.geojson"),
    "eventos": ("rasante.eventos.cli", "Calendario del cielo y de naturaleza → eventos.json"),
    "alineaciones": (
        "rasante.eventos.cli_alineaciones",
        "Sol y luna llena por los picos del horizonte → alineaciones.json",
    ),
    "fauna": ("rasante.fauna.ordenes", "Modo Fauna: cuadrícula, eBird, recientes, lugares… (fauna --help)"),
    "lugares": ("rasante.lugares.cli", "Índice común de spots y lugares de fauna → lugares.json"),
    "auditar": ("rasante.lugares.auditoria", "Auditoría de lugares.json: cobertura, vacíos y duplicados → informe .md"),
    "clima": ("rasante.clima.cli", "Climatología fotográfica por mes (ERA5) → clima.json"),
    "dron": ("rasante.dron.cli", "¿Se puede volar un dron en cada spot? (ENAIRE y espacios protegidos) → dron.json"),
    "verificar": ("rasante.verificacion.cli", "Lo previsto frente a lo observado (METAR) → verificacion.json"),
    "validar": ("rasante.validacion.cli", "Validación histórica de las notas"),
    "avisos": ("rasante.avisos.telegram", "Resumen diario por Telegram (opcional)"),
}


def ayuda() -> str:
    filas = "\n".join(f"  {o:<10} {texto}" for o, (_, texto) in ORDENES.items())
    return f"Uso: python -m rasante <orden> [opciones]\n\nÓrdenes:\n{filas}\n\nAyuda de cada orden: python -m rasante <orden> --help"


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if not argv or argv[0] in ("-h", "--help"):
        print(ayuda())
        return 0
    orden, resto = argv[0], argv[1:]
    if orden not in ORDENES:
        print(f"Orden desconocida: {orden}\n\n{ayuda()}", file=sys.stderr)
        return 2
    importlib.import_module(ORDENES[orden][0]).main(resto)
    return 0


if __name__ == "__main__":
    sys.exit(main())
