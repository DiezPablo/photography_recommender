"""Evaluación de la estacionalidad de España (D10): AUC frente a un modelo sin meses y umbral del 5 %."""

from safari.espana.evaluacion import auc, comparar, evaluar


def test_auc_por_rangos():
    assert auc({1: 3, 2: 2, 3: 1}, {1}) == 1.0
    assert auc({1: 1, 2: 2, 3: 3}, {1}) == 0.0
    assert auc({1: 1, 2: 1}, {1}) == 0.5  # empate
    assert auc({1: 1}, {1}) is None


def _filas():
    """Una cuadrícula: la grulla solo en invierno, el gorrión todo el año, el vencejo solo en verano."""
    filas = []
    for anio in range(2015, 2026):
        for mes in range(1, 13):
            invierno, verano = mes in (11, 12, 1, 2), mes in (5, 6, 7, 8)
            for especie, n in ((1, 40 if invierno else 0), (2, 30), (3, 40 if verano else 0)):
                if n:
                    filas.append(
                        {"celda": "10kmE1N1", "clase": 212, "especie": especie, "anio": anio, "mes": mes, "n": n}
                    )
    return filas


def test_la_estacionalidad_gana_al_modelo_sin_meses():
    r = evaluar(_filas(), 2025)["212"]
    assert r["casos"] > 0
    assert r["auc"] > r["auc_ingenuo"]
    assert r["auc"] == 1.0


def test_comparar_con_la_linea_base():
    base = {"212": {"auc": 0.8, "auc_ingenuo": 0.7, "casos": 100}}
    assert comparar({"212": {"auc": 0.77, "auc_ingenuo": 0.7, "casos": 90}}, base) == []
    assert comparar({"212": {"auc": 0.75, "auc_ingenuo": 0.7, "casos": 90}}, base)
    assert comparar({}, base)


def test_lo_que_sube_en_el_mes_se_calcula_en_el_pipeline():
    from safari.espana.cli import sube_por_mes

    # 200 cuadrículas: la grulla en invierno, el gorrión plano
    celdas = {
        f"10kmE{i}N1": {
            "m": {"Aves": [1000] * 12},
            "e": {"1": [60, 60, 10, 5, 5, 5, 5, 5, 5, 10, 60, 60], "2": [30] * 12},
        }
        for i in range(200)
    }
    especies = {"1": {"clase": "Aves"}, "2": {"clase": "Aves"}}
    sube = sube_por_mes(celdas, especies)
    assert [k for k, _, _ in sube[10]] == ["1"]  # noviembre
    assert sube[10][0][1] == 60
    assert sube[5] == []  # en junio no sube nada


def test_experimentos_comparan_modelos_y_grupos():
    from safari.espana.experimentos import experimentar

    filas = _filas()
    # un mamífero en la misma cuadrícula con pocos registros pero ‰ altísimo en su grupo, que en 2025 no se ve
    for anio in range(2015, 2025):
        for mes in range(1, 13):
            filas.append({"celda": "10kmE1N1", "clase": 359, "especie": 9, "anio": anio, "mes": mes, "n": 30})
            filas.append({"celda": "10kmE1N1", "clase": 359, "especie": 8, "anio": anio, "mes": mes, "n": 1})
    r = experimentar(filas, 2025)
    assert set(r["por_grupo"]["212"]) >= {"mensual", "anual", "mezcla", "contraido", "casos"}
    assert r["por_grupo"]["212"]["mensual"] > r["por_grupo"]["212"]["anual"]
    juntos = r["juntos"]
    assert juntos["casos"] > 0
    # el mamífero no visto en 2025 queda arriba con el ‰ de su grupo y abajo con la parte absoluta
    assert juntos["absoluto"] > juntos["grupo"]
