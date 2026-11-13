# 002 — Auditoría de la base de datos: cobertura y licencias

Estado: hecha
Modo: plataforma (Luz y Fauna)
Situación del fotógrafo: —

## Problema
El catálogo es el activo (visión), pero nadie lo había medido: qué provincias están flojas, qué campos están
vacíos, qué lugares están repetidos y con qué licencia viene cada cosa.

## Alcance
- Orden `python -m rasante auditar`: informe Markdown sobre `lugares.json` (spec 003), repetible antes y después
  de tocar el pipeline.
- `docs/datos/fuentes.md`: cada fuente con su licencia, si admite uso comercial y dónde se atribuye en la web.
- Primer informe con los datos publicados y sus hallazgos, al backlog.
- **Fuera de alcance**: corregir lo que salga (cada hallazgo es una spec); auditar especies, previsión o hides.

## Criterios de aceptación
- [x] `python -m rasante auditar --lugares F --salida F.md` escribe cobertura por provincia y catálogo, tipos,
      campos sin dato, fuentes, posibles duplicados dentro de cada catálogo y nombres dudosos.
- [x] Tests sin red con un índice pequeño: detecta un duplicado de cada clase, una provincia sin spots y un
      nombre genérico.
- [x] `docs/datos/auditoria-2026-11-13.md` generado con los datos publicados.
- [x] `docs/datos/fuentes.md` con todas las fuentes de los dos modos; lo no comprobado, marcado.
- [x] Hallazgos convertidos en líneas del backlog (018-020).

## Hallazgos (13-11-2026)
- **Spots muy desiguales**: de 4 a 133 por provincia, mediana 12; 30 provincias están en el mínimo de 12 que
  garantiza el descubrimiento. El 32 % de los spots tiene cielo urbano (Bortle ≥ 7) y el 19 % no tiene foto.
- **Fauna repetida**: 48 pares con el mismo nombre a menos de 2 km (el mismo espacio con dos fichas de Wikidata,
  o como punto de eBird y como espacio Natura 2000) y 41 pares de espacios a menos de 100 m (la ZEC y el parque
  natural del mismo sitio).
- **Acceso**: ningún lugar tiene aparcamiento (la logística de OSM está aparcada con las rutas, 0019).
- **Fotos**: ningún lugar de fauna tiene foto.
- **Atribución**: faltan créditos de la EEA en los contornos Natura 2000 y cuatro fuentes en Método.
- Sin problemas: ningún spot duplicado, todos con horizonte, brillo del cielo, tipo y provincia.

## Datos
Sin fuentes nuevas ni ficheros publicados nuevos. El informe va en git (`docs/datos/`), unas 150 líneas.

## Notas de implementación
`rasante/lugares/auditoria.py`. Los nombres «dudosos» incluyen pueblos de tres letras (Bel, Jou): es una lista
para mirar, no para borrar.
