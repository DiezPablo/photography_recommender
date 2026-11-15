# Sistema de diseño de Rasante

Recoge lo que ya hay (tokens de `src/estilos/01-tokens.css`, el «rediseño B» de 11-2026) y las reglas para lo
nuevo. Lo mantiene `/diseno`; cada spec que toque la interfaz lo cita en su sección «Diseño».

## Principios
1. **La foto y el veredicto mandan**: lo primero de cada pantalla es el lugar (con su foto si la hay) y si merece
   la pena ir. Números y desgloses, a un segundo nivel (plegados o debajo).
2. **Información justa**: cada pantalla responde una pregunta (`docs/producto/modos.md`); lo que no ayuda, fuera.
3. **Móvil primero**: una columna, nada de tablas densas, objetivos táctiles de 44 px. En escritorio, la misma
   jerarquía con más aire y el mapa al lado.
4. **Funciona sin JavaScript**: enlaces y HTML del servidor; JS solo para mejorar (filtros, mapa, ubicación).
5. **Contraste AA** en claro y en oscuro.

## Color
Papel casi blanco y tinta casi negra; el color se reserva para el dato.

| Token | Uso |
|---|---|
| `--fondo`, `--superficie`, `--superficie-2`, `--borde` | Papel, tarjetas, bandas, filetes |
| `--texto`, `--texto-2`, `--texto-3` | Tinta: principal, secundaria, notas al pie |
| `--n-top`, `--n-buena`, `--n-regular`, `--n-floja` | Escala de la nota de luz (≥ 8, ≥ 6,5, ≥ 4,5, resto) |
| `--sol`, `--luna`, `--vl` | Sol, luna y Vía Láctea en cartas y calendarios |
| `--c-fauna` (`--ocre`) | Lo de fauna: el magenta que se sobreimprime en los mapas |
| `--c-flora`, `--c-otono`, `--c-paisaje`, `--c-agua`, `--c-nieve` | Categorías de eventos |
| `--cielo-noche`, `--cielo-azul`, `--cielo-dorada`, `--cielo-dia` | Fondos de franjas del día |

Modo oscuro: los mismos tokens redefinidos (sistema o `data-tema="oscuro"`). Nada de colores sueltos en el CSS de
una pantalla: si falta uno, se añade aquí y en los tokens.

## Tipografía
Archivo para todo (títulos estrechos con su eje de anchura, `wdth` 72-80) y una monoespaciada para cifras
(`--f-datos`). Escala: título de página `clamp(2rem, 7vw, 3.4rem)`, sección 1,35 rem, cuerpo 1 rem, notas 0,85 rem.
La nota de luz es una **cifra** (`ui/Cifra.tsx`) teñida con su escala; en «lo habitual» la cifra es un porcentaje.

## Forma
Esquinas de 2-4 px (`--radio`, `--radio-m`, `--radio-s`). Sin sombras en reposo; `--sombra-alta` solo para lo que
flota (mapas a pantalla completa, menús). Separación de secciones con un filete de 2 px en tinta (`.momento`) o con
`--borde` en las tarjetas.

## Componentes
- **Cabecera**: marca, conmutador Luz/Fauna (`.mundos`) y menú de la sección; en el móvil, barra inferior de cinco
  accesos como mucho.
- **Portada** (spec 004): pregunta, foto con veredicto del mejor plan de hoy (`.portada-hoy`) y tres momentos
  (`.momento`: hoy, este finde, más adelante), cada uno con su plan (`.plan-momento`: cifra + lugar + cuándo) y sus
  enlaces a Luz y a Fauna.
- **Lista de resultados** (`Ranking`): posición, cifra, nombre, cuándo y por qué en una línea, miniatura.
- **Ficha**: cabecera con foto y veredicto; bloques plegables (`details.plegable`) para lo secundario.
- **Rótulo** (`.rotulo`): versalitas pequeñas para situar («Lo mejor de hoy · atardecer · 18:02»).
- **Nota al pie** (`.nota-pie`): fuente, método o advertencia, siempre en una línea corta.

## Pendiente (spec 004)
Web instalable (manifiesto e iconos), conmutador visible de modo noche y poda del CSS que solo usaban los safaris.
