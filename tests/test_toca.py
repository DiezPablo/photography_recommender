"""¿Toca ejecutar? (.github/scripts/toca.py, decisión 0024): cron cada hora y ventanas en hora peninsular."""

import importlib.util
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

_ruta = Path(__file__).parents[1] / ".github" / "scripts" / "toca.py"
_spec = importlib.util.spec_from_file_location("toca", _ruta)
toca = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(toca)

M = ZoneInfo("Europe/Madrid")
VENTANAS = toca.ventanas("4-7,12-16")


def test_dentro_de_la_ventana_y_sin_ejecucion_buena():
    assert toca.decidir("schedule", datetime(2026, 11, 18, 5, 30, tzinfo=M), VENTANAS, None)[0]
    # la buena de ayer no cuenta
    assert toca.decidir(
        "schedule", datetime(2026, 11, 18, 5, 30, tzinfo=M), VENTANAS, datetime(2026, 11, 17, 13, 0, tzinfo=M)
    )[0]


def test_una_por_ventana():
    assert not toca.decidir(
        "schedule", datetime(2026, 11, 18, 6, 47, tzinfo=M), VENTANAS, datetime(2026, 11, 18, 4, 50, tzinfo=M)
    )[0]
    # la de la mañana no quita la de la tarde
    assert toca.decidir(
        "schedule", datetime(2026, 11, 18, 12, 47, tzinfo=M), VENTANAS, datetime(2026, 11, 18, 4, 50, tzinfo=M)
    )[0]


def test_fuera_de_ventana_no_y_a_mano_siempre():
    assert not toca.decidir("schedule", datetime(2026, 11, 18, 9, 47, tzinfo=M), VENTANAS, None)[0]
    assert toca.decidir("workflow_dispatch", datetime(2026, 11, 18, 9, 47, tzinfo=M), VENTANAS, None)[0]
    assert toca.decidir("push", datetime(2026, 11, 18, 23, 0, tzinfo=M), VENTANAS, None)[0]


def test_tope_diario_por_el_cupo_de_open_meteo():
    hora = datetime(2026, 11, 18, 12, 47, tzinfo=M)
    # dos buenas hoy (p. ej. por push): ni la programada ni otro push
    assert not toca.decidir("schedule", hora, VENTANAS, None, hoy=2, maximo=2)[0]
    assert not toca.decidir("push", hora, VENTANAS, None, hoy=2, maximo=2)[0]
    # a mano y forzada, sí; sin tope, como antes
    assert toca.decidir("workflow_dispatch", hora, VENTANAS, None, hoy=5, maximo=2, forzar=True)[0]
    assert toca.decidir("push", hora, VENTANAS, None, hoy=5)[0]
    assert toca.decidir("schedule", hora, VENTANAS, None, hoy=1, maximo=2)[0]
