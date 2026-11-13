# 0020 — `lugares.json`: un índice, dos catálogos, ids existentes
Fecha: 2026-11-13 · Estado: vigente
Contexto: resultados, mapa, plan y auditoría necesitan tratar igual spots y lugares de fauna (spec 003).
Decisión: `python -m rasante lugares` publica `lugares.json` con un núcleo común (territorio, tipo, fuentes con
licencia, foto, acceso, `cerca`, eventos) y un bloque por catálogo. El contrato es
`rasante/recursos/lugar.schema.json`; si un lugar no lo cumple, no se publica. Se conservan los ids que ya usan
las URLs. Lo que cae en un país vecino o mar adentro no entra.
Consecuencias: es un índice (1,8 MB comprimido, 23 000 lugares): nada pesado dentro. Cambiar un campo es
cambiar el esquema y subir `esquema`. La web aún no lo lee; lo usarán 002, 012 y 013.
