"""Frecuencia de avistamientos por mes (respuestas reales de iNaturalist del Masái Mara, 27-10-2026)."""

from safari.frecuencia import frecuencia

MAMIFEROS = [1031, 1141, 750, 601, 675, 1537, 2752, 3825, 1891, 1394, 880, 871]
LEON = [105, 123, 86, 53, 65, 146, 296, 414, 196, 159, 65, 88]
LICAON = [0, 2, 0, 0, 0, 2, 0, 16, 0, 1, 0, 0]


def test_corrige_cuanta_gente_va():
    f = frecuencia(LEON, MAMIFEROS)
    assert len(f) == 12
    # en agosto hay cuatro veces más observaciones que en abril, pero la proporción de leones es parecida
    assert abs(f[7] - f[3]) < 30
    assert 90 <= f[7] <= 115  # ~1 de cada 10 mamíferos fotografiados es un león


def test_raros_y_meses_vecinos():
    f = frecuencia(LICAON, MAMIFEROS)
    assert max(f) <= 5
    # diciembre suma con enero (vuelta del año)
    assert frecuencia([0] * 11 + [10], [10] * 12)[0] == round(1000 * 10 / 30)


def test_sin_datos_suficientes():
    assert frecuencia([1] * 12, [5] * 12) == [None] * 12


def test_muestra_con_los_meses_vecinos():
    from safari.frecuencia import muestra

    base = [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5]
    m = muestra(base)
    assert m[0] == 15  # diciembre + enero + febrero
    assert m[11] == 15
    assert m[5] == 0
