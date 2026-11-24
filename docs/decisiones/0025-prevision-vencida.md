# 0025 — Si la última previsión tiene 8 h, se calcula aunque no haya ventana
Fecha: 2026-11-24 · Estado: vigente
Contexto: con la 0024, GitHub lanzó el cron horario solo tres o cuatro veces al día (23-11-2026: 02:08, 10:51 y
23:14), ninguna en una ventana: la previsión se quedó en la del 22 a las 05:06 y la web dio el amanecer del 24
como malo con datos de dos días antes (fue bueno en Madrid). Además, `toca.py` contaba como «buenas» las
ejecuciones que solo habían dicho «no toca», y el 22 a mediodía se saltó la previsión por un tope que no se había
alcanzado.
Decisión: `toca.py --vencida H` deja seguir una ejecución programada fuera de ventana si la última buena tiene H
horas o más (previsión 8 h; recientes de fauna 20 h). Una ejecución es buena si corrió el trabajo de verdad, no
solo «cuando». El tope de dos previsiones al día (cupo de Open-Meteo) sigue mandando.
Consecuencias: la previsión puede salir a horas raras (02:00, 11:00), pero nunca pasa más de un hueco de cron sin
recalcular. Cada «cuando» consulta los trabajos de las ejecuciones del último día y medio (una llamada por
ejecución, dentro del límite del token).
