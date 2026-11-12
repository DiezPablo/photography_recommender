# Propuesta: páginas y buscadores que se juntan (decisión D8, pendiente de aprobar)

Fecha: 08-11-2026. Nada de esto está hecho: es la lista para que el usuario apruebe qué se quita. Cada cambio deja
redirecciones desde las direcciones antiguas.

## «Cuándo ir»: lo que se repite

| Hoy | Qué hace | Propuesta |
| --- | --- | --- |
| `/espana?modo=donde` («Buscar especie») | Lista de cuadrículas y lugares de una especie, mes a mes, con mapa | **Quitar.** La carta (`/?especie=`) hace lo mismo en el mapa y su panel da «las más altas con 100 registros o más»; lo único propio (hides y fenómenos de la especie) ya está en la ficha `/espana/especie/[clave]`. Redirige a la carta con la especie. |
| `/safari-en/[a-vs-b]` (comparativas de dos países) | Dos países lado a lado un mes | **Quitar.** `/comparar` compara parques (lo que se reserva) y `/safari-en/[país]` da cada país; las parejas fijas (16) no cubren lo que se busca. Redirige a la página del primer país. |
| `/safari-en/[mes]` | Parques en buena época ese mes | **Quedarse**, pero con el mismo cálculo de temporada que la carta del mundo (`/mapa?mes=`) y un enlace a ella: hoy cada una usa el suyo. |
| Ficha de parque: «Veredicto del mes», «El año en el parque» (`AnoSafari`), «Frecuencia mes a mes» y la de la temporada verde | Cuatro bloques sobre cuándo ir, uno detrás de otro | **Juntar en un bloque «Cuándo ir»**: el veredicto del mes arriba y una sola tabla de 12 meses (temporada, lluvia, frecuencia de las especies estrella, precio en temporada verde). |
| `/temporada-verde` | Cuánto se ahorra fuera de temporada y qué se pierde | **Quedarse**: es lo único con precios. |
| `/migracion` | Dónde está la gran migración cada mes | **Quedarse**: es única. |

## Buscadores de especie: siete distintos

Hoy hay siete maneras de elegir una especie, cada una con su lista y su forma de buscar:

1. Buscador de la cabecera (`ui/BuscadorGlobal.tsx`): parques, especies y países.
2. `ui/SelectorEspecie.tsx`: en la portada de safaris (`EntradasHero`) y en el explorador.
3. El de la carta de España (`CartaEspana`).
4. El de la carta del mundo (`CartaMundo`).
5. El de «Buscar especie» de España (`DondeVerEspecie`), que se iría con esa página.
6. Los botones de especies de «¿Qué quieres ver y cuándo?» de la portada de safaris.
7. La lista de `/especies`.

**Propuesta:** uno solo, `ui/BuscadorEspecie.tsx`, con la búsqueda que ya usa la cabecera (sin tildes y con
errores de una letra, `lib/busqueda.ts`), que reciba la lista (España o mundo) y qué hacer al elegir. Lo usarían las
dos cartas, la portada y el explorador de safaris. Se quedan aparte el buscador de la cabecera (busca de todo) y la
lista de `/especies` (es un índice, no un buscador).

## Lo que se pierde

- La lista de cuadrículas en texto de «Buscar especie» (la carta da las 6 mejores con muestra suficiente; si hace
  falta, se puede añadir «ver todas» en su panel).
- Las comparativas fijas de dos países.
- La vista de cuatro bloques de la ficha de parque (la información se queda, en uno).
