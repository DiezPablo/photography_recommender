"""Revisión anual de los datos escritos a mano (tarifas, tasas, visados, cierres, edades mínimas).

Busca en src/features/safaris las fechas de revisión (`REVISADO… = "dd-mm-aaaa"`, `CONSULTADO = …` y los
`revisado: "dd-mm-aaaa"` de cada país) y escribe en la salida un informe en Markdown con lo que tiene más de
MAX_DIAS. Sale con código 1 si hay algo que revisar (el workflow abre entonces una incidencia).
Uso: python .github/scripts/revision_datos.py [--max-dias 365]
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date, datetime
from pathlib import Path

FEATURES = Path(__file__).resolve().parents[2] / "src" / "features"
RAICES = [FEATURES / "safaris", FEATURES / "espana"]
QUE = {
    "temporadaVerde.ts": "Tarifas de los lodges por mes (temporada verde): abrir cada enlace y copiar las del año nuevo.",
    "tasas.ts": "Tasas de entrada de los parques: comprobar en la fuente de cada una.",
    "paises.ts": "Visado, fiebre amarilla, malaria y dinero por país: web oficial del visado y Exteriores.",
    "cierres.ts": "Cierres estacionales (tigres en el monzón, Kaziranga, Yala…): fechas del año en las fuentes.",
    "familias.ts": "Edades mínimas (gorilas, chimpancés) y parques sin malaria.",
    "eventos.ts": "Calendario de fenómenos (desoves, ballenas, osos, crecidas…): meses en las fuentes.",
    "fenomenos.ts": "Fenómenos de fauna en España (berrea, grullas, Estrecho…): meses en las fuentes.",
    "hides.ts": "Hides y salidas guiadas en España: que la web siga activa, temporadas y precios.",
    "fotografia.ts": "Dificultad y consejos de fotografía por especie en España.",
}
FECHA = re.compile(r'(?:REVISADO\w*|CONSULTADO)\s*=\s*"(\d{2}-\d{2}-\d{4})"|revisado:\s*"(\d{2}-\d{2}-\d{4})"')


def fechas() -> dict[str, list[date]]:
    salida: dict[str, list[date]] = {}
    for f in sorted(p for raiz in RAICES for p in raiz.glob("*.ts")):
        for m in FECHA.finditer(f.read_text(encoding="utf-8")):
            salida.setdefault(f.name, []).append(datetime.strptime(m.group(1) or m.group(2), "%d-%m-%Y").date())
    return salida


def informe(max_dias: int, hoy: date | None = None) -> tuple[str, bool]:
    hoy = hoy or date.today()
    filas, viejo = [], False
    for fichero, lista in fechas().items():
        antigua = min(lista)
        dias = (hoy - antigua).days
        caduca = dias > max_dias
        viejo |= caduca
        filas.append(
            f"- [{'x' if not caduca else ' '}] `{fichero}` — revisado el {antigua:%d-%m-%Y} ({dias} días). "
            f"{QUE.get(fichero, '')}"
        )
    texto = "\n".join(
        [
            f"Datos escritos a mano con más de {max_dias} días (sin marcar). Al revisarlos, actualiza la fecha en el",
            "fichero (`REVISADO…`, `CONSULTADO` o `revisado:` de cada país) y anota los cambios en",
            "`docs/decisiones.md`.",
            "",
            *filas,
        ]
    )
    return texto, viejo


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-dias", type=int, default=365)
    a = ap.parse_args()
    texto, viejo = informe(a.max_dias)
    print(texto)
    sys.exit(1 if viejo else 0)
