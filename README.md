# Rasante

Dónde ir a fotografiar naturaleza en España: la mejor **luz** (amanecer, atardecer, noche, eventos del cielo) en
cada spot y la **fauna** que se ve en cada lugar y época. Datos abiertos (Open-Meteo, Wikidata, OpenStreetMap,
Wikimedia Commons, GBIF, eBird, iNaturalist), gratis, sin cuentas y sin IA.

```bash
make instalar        # .venv con los pipelines y npm ci
make check           # ruff, pytest, tsc, ESLint, Prettier
npm run build && npx playwright test
python -m rasante --help   # modo Luz
python -m safari --help    # modo Fauna (--espana…) y safaris (congelado)
```

Contexto para desarrollar: [CLAUDE.md](CLAUDE.md). Producto: [docs/producto](docs/producto). Decisiones:
[docs/decisiones](docs/decisiones).
