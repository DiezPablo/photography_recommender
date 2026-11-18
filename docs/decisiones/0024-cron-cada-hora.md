# 0024 — Los workflows diarios, cada hora con ventana
Fecha: 2026-11-18 · Estado: vigente
Contexto: GitHub ejecuta los `schedule` de este repo con 7 a 9 horas de retraso (11-2026): la previsión «de las
03:47» salía hacia las 11-12 h, después del amanecer, y la del mediodía, de noche. No es cuestión de elegir otra
hora: el retraso varía.
Decisión: `luz_datos.yml` y `fauna_recientes.yml` se programan cada hora; un primer trabajo (`cuando`,
`.github/scripts/toca.py`) deja seguir solo la primera ejecución que cae en una ventana en hora peninsular (previsión:
4-7 h y 12-16 h; recientes: 5-12 h) sin otra buena antes en esa ventana. A mano o por push, siempre sigue.
Consecuencias: Open-Meteo sigue en dos previsiones al día. Cada hora corre un trabajo de segundos que casi siempre
dice «no». Los semanales, mensuales y trimestrales siguen con su cron: unas horas de retraso no les afectan.
