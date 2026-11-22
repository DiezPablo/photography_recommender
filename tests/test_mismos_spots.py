"""¿Mismos spots? (.github/scripts/mismos_spots.py, spec 024 punto 4)."""

import importlib.util
import json
from pathlib import Path

_ruta = Path(__file__).parents[1] / ".github" / "scripts" / "mismos_spots.py"
_spec = importlib.util.spec_from_file_location("mismos_spots", _ruta)
mismos = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mismos)


def _geojson(tmp_path: Path, nombre: str, ids: list[str]) -> str:
    ruta = tmp_path / nombre
    ruta.write_text(json.dumps({"features": [{"properties": {"id": i}} for i in ids]}), encoding="utf-8")
    return str(ruta)


def test_mismos_y_distintos(tmp_path, monkeypatch, capsys):
    a = _geojson(tmp_path, "a.geojson", ["x", "y"])
    b = _geojson(tmp_path, "b.geojson", ["y", "x"])
    c = _geojson(tmp_path, "c.geojson", ["x", "z"])
    monkeypatch.setattr("sys.argv", ["mismos_spots.py", a, b])
    assert mismos.main() == 0
    monkeypatch.setattr("sys.argv", ["mismos_spots.py", a, c])
    assert mismos.main() == 1
    assert "1 spots nuevos, 1 fuera" in capsys.readouterr().out
