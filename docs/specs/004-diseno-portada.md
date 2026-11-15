# 004 — Sistema de diseño y portada

Estado: en curso (prototipo de portada para revisar con Pablo; el resto, después de su visto bueno)
Modo: los dos
Situación del fotógrafo: una tarde · un finde · un viaje

## Problema
La portada son «dos puertas» (Luz y Fauna) que obligan a elegir modo antes de saber qué hay. La pregunta de la
pantalla 1 de `docs/producto/modos.md` es otra: «¿cuándo tienes tiempo y qué te apetece?». Además, el sistema de
diseño solo está en el CSS (sin documentar) y quedan restos de los safaris.

## Alcance
- `docs/diseno/sistema.md`: principios, color, tipografía, forma y componentes, a partir de los tokens actuales.
- **Portada** (prototipo, rama `claude/spec-004-portada`): «¿Cuándo tienes tiempo?»; arriba, la foto y el veredicto
  del mejor plan de hoy; debajo, tres momentos —**hoy** (mejor atardecer y mejor noche), **este finde** (mejor
  plan del primer día de finde con previsión) y **más adelante** (lo habitual del mes que viene y los fenómenos de
  fauna del mes)—, cada uno con sus enlaces a Luz y a Fauna; al final, lo que está en temporada.
- Después del visto bueno: web instalable (manifiesto e iconos), modo noche con conmutador visible, poda del CSS de
  los safaris y llevar el sistema a las fichas (con 010).
- **Fuera de alcance**: la consulta común en la URL (012) y el plan de varios días (016).

## Criterios de aceptación
- [x] Sistema de diseño escrito en `docs/diseno/sistema.md`.
- [x] Prototipo de portada en móvil y escritorio, sin JavaScript, con datos reales; e2e en verde.
- [ ] Visto bueno de Pablo a la dirección visual (capturas en el PR).
- [ ] Web instalable, modo noche y poda del CSS de safaris.

## Diseño
**Móvil** (una columna): título → foto del mejor plan de hoy a todo el ancho (300 px de alto) con rótulo
«Lo mejor de hoy · atardecer · 18:02», nombre grande y cifra con el primer motivo («8,7 · Buen lienzo de nubes
altas…») → **Hoy**: dos planes (cifra, lugar, «Atardecer de hoy · 18:02 · Segovia») y dos enlaces («Todos los
spots de hoy», «Qué fauna veo cerca de mí») → **Este finde** → **Más adelante** → **Esta temporada**.
**Escritorio**: igual, con la foto a 420 px y los tres momentos en fila.
Se oculta tras un toque: el desglose de cada nota (en la ficha). Desaparece de la portada: el texto de
presentación de cada modo.
