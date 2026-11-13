# 0021 — Safaris del mundo, fuera de esta versión
Fecha: 2026-11-13 · Estado: vigente
Contexto: los safaris (parques del mundo, planificador, presupuesto…) venían en el repo base, pero no aportan a
«dónde ir a fotografiar en España» y complicaban cerrar esta versión. Pablo decide dejarlos fuera y retomarlos
más adelante solo si los dos lo vemos necesario.
Decisión: se retiran de la web, del pipeline y de los workflows (spec 005). Sus URLs llevan a la portada con una
redirección temporal. No se borra del historial: el último `main` con todo es el commit `03bbe59`.
Consecuencias: para recuperarlos, `git checkout 03bbe59 -- <rutas>` o una rama desde ese commit (no hay etiqueta:
la sesión que hizo la retirada no podía subir etiquetas). El paquete Python sigue llamándose `safari` hasta la
spec 006. Los ficheros `safaris*.json` de la release `datos` quedan sin uso.
