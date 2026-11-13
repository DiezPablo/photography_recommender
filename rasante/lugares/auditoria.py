"""Auditoría de lugares.json (spec 002): cobertura por provincia, tipos, campos vacíos, posibles duplicados y
nombres dudosos, en un informe Markdown. No corrige nada: dice dónde mirar.

  python -m rasante auditar --lugares lugares.json --salida docs/datos/auditoria-AAAA-MM-DD.md
"""

from __future__ import annotations

import argparse
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from statistics import median

from rasante.comun.territorio import Provincias
from rasante.lugares.cli import leer
from rasante.lugares.modelo import km

# Dos spots a menos de esto son candidatos a ser el mismo sitio (el descubrimiento fusiona a < 400 m)
KM_DUPLICADO_LUZ = 0.4
# En fauna, mismo nombre a menos de esto, o cualquier par de espacios u observatorios a menos de 100 m
KM_MISMO_NOMBRE = 2.0
KM_PEGADOS = 0.1
POCOS_SPOTS = 15
EJEMPLOS = 12
GENERICOS = re.compile(r"^(mirador|playa|faro|cascada|pico|cumbre|embalse|lago|laguna|observatorio|punto)$")


def normal(nombre: str) -> str:
    """Nombre sin tildes, mayúsculas ni signos, para comparar."""
    sin = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", sin).strip()


def _pares_cerca(lugares: list[dict], km_max: float):
    """Pares de lugares a km_max o menos (rejilla de 0,05°: vale hasta ~4 km)."""
    paso = 0.05
    rejilla: dict[tuple[int, int], list[dict]] = defaultdict(list)
    for x in lugares:
        rejilla[(int(x["lat"] // paso), int(x["lon"] // paso))].append(x)
    for (i, j), grupo in rejilla.items():
        vecinos = [y for di in (-1, 0, 1) for dj in (-1, 0, 1) for y in rejilla.get((i + di, j + dj), ())]
        for x in grupo:
            for y in vecinos:
                if x["id"] < y["id"]:
                    d = km(x["lat"], x["lon"], y["lat"], y["lon"])
                    if d <= km_max:
                        yield d, x, y


def duplicados(lugares: list[dict]) -> dict[str, list[tuple[float, dict, dict]]]:
    """Candidatos a duplicado dentro de cada catálogo (entre catálogos no lo son: decisión 0015)."""
    luz = [x for x in lugares if x["catalogo"] == "luz"]
    fauna = [x for x in lugares if x["catalogo"] == "fauna"]
    sitios = [x for x in fauna if x["tipo"] != "punto_de_observacion"]
    mismo_nombre = [
        (d, x, y) for d, x, y in _pares_cerca(fauna, KM_MISMO_NOMBRE) if normal(x["nombre"]) == normal(y["nombre"])
    ]
    return {
        "luz": sorted(_pares_cerca(luz, KM_DUPLICADO_LUZ), key=lambda t: t[0]),
        "fauna_mismo_nombre": sorted(mismo_nombre, key=lambda t: t[0]),
        "fauna_pegados": sorted(_pares_cerca(sitios, KM_PEGADOS), key=lambda t: t[0]),
    }


def nombres_dudosos(lugares: list[dict]) -> list[dict]:
    """Nombres genéricos («Mirador»), de menos de 4 letras o que son solo un código."""
    return [
        x
        for x in lugares
        if len(normal(x["nombre"])) < 4
        or GENERICOS.match(normal(x["nombre"]))
        or re.fullmatch(r"[\W\d_]+", x["nombre"])
    ]


def vacios(lugares: list[dict]) -> dict[str, dict[str, int]]:
    """Cuántos lugares de cada catálogo tienen cada campo sin dato."""
    luz = [x for x in lugares if x["catalogo"] == "luz"]
    fauna = [x for x in lugares if x["catalogo"] == "fauna"]
    puntos = [x for x in fauna if x["tipo"] == "punto_de_observacion"]
    return {
        "luz": {
            "total": len(luz),
            "sin foto": sum(1 for x in luz if not x["foto"]),
            "foto sin autor o sin licencia": sum(
                1 for x in luz if x["foto"] and not (x["foto"]["autor"] and x["foto"]["licencia"])
            ),
            "sin perfil del horizonte": sum(1 for x in luz if not x["luz"]["horizonte"]),
            "sin brillo del cielo": sum(1 for x in luz if x["luz"]["cielo_mag"] is None),
            "tipo «otro»": sum(1 for x in luz if x["tipo"] == "otro"),
            "sin aparcamiento": sum(1 for x in luz if x["acceso"]["aparcamiento_m"] is None),
            "sin lugares de fauna cerca": sum(1 for x in luz if not x["cerca"]),
            "cielo urbano (Bortle ≥ 7)": sum(1 for x in luz if (x["luz"]["bortle"] or 0) >= 7),
        },
        "fauna": {
            "total": len(fauna),
            "sin foto": sum(1 for x in fauna if not x["foto"]),
            "sin cuadrículas": sum(1 for x in fauna if not x["fauna"]["celdas"]),
            "puntos de eBird sin recuento de especies": sum(1 for x in puntos if x["fauna"]["especies_ebird"] is None),
            "puntos de eBird con menos de 20 especies": sum(
                1 for x in puntos if (x["fauna"]["especies_ebird"] or 0) < 20
            ),
            "sin aparcamiento": sum(1 for x in fauna if x["acceso"]["aparcamiento_m"] is None),
            "sin spots de luz cerca": sum(1 for x in fauna if not x["cerca"]),
        },
    }


def cobertura(lugares: list[dict], provincias: list[str]) -> list[dict]:
    """Por provincia: spots, puntos de eBird y sitios de fauna (espacios, humedales y observatorios)."""
    luz = Counter(x["provincia"] for x in lugares if x["catalogo"] == "luz")
    puntos = Counter(x["provincia"] for x in lugares if x["tipo"] == "punto_de_observacion")
    sitios = Counter(
        x["provincia"] for x in lugares if x["catalogo"] == "fauna" and x["tipo"] != "punto_de_observacion"
    )
    ccaa = {x["provincia"]: x["ccaa"] for x in lugares}
    todas = sorted(set(provincias) | set(luz) | set(puntos) | set(sitios))
    return [
        {"provincia": p, "ccaa": ccaa.get(p, "—"), "spots": luz[p], "puntos": puntos[p], "sitios": sitios[p]}
        for p in todas
    ]


def auditar(doc: dict, provincias: list[str]) -> dict:
    lugares = doc["lugares"]
    return {
        "generado": doc.get("generado"),
        "cuenta": Counter(x["catalogo"] for x in lugares),
        "tipos": {
            cat: Counter(x["tipo"] for x in lugares if x["catalogo"] == cat).most_common() for cat in ("luz", "fauna")
        },
        "fuentes": Counter((f["fuente"], f["licencia"]) for x in lugares for f in x["fuentes"]).most_common(),
        "cobertura": cobertura(lugares, provincias),
        "vacios": vacios(lugares),
        "duplicados": duplicados(lugares),
        "nombres": nombres_dudosos(lugares),
    }


def _pct(n: int, total: int) -> str:
    return f"{n} ({100 * n / total:.0f} %)" if total else str(n)


def _par(t: tuple[float, dict, dict]) -> str:
    d, x, y = t
    return f"- {x['nombre']} (`{x['id']}`) ↔ {y['nombre']} (`{y['id']}`): {d * 1000:.0f} m, {x['provincia']}"


def informe(a: dict, hoy: date) -> str:
    """El informe en Markdown."""
    cob = a["cobertura"]
    spots = [c["spots"] for c in cob]
    sin_spots = [c["provincia"] for c in cob if c["spots"] == 0]
    pocos = [c for c in cob if 0 < c["spots"] < POCOS_SPOTS]
    sin_sitios = [c["provincia"] for c in cob if c["sitios"] == 0]
    lineas = [
        f"# Auditoría de la base de datos de lugares ({hoy.isoformat()})",
        "",
        f"Sobre `lugares.json` generado el {a['generado']}: **{a['cuenta']['luz']} spots de luz** y "
        f"**{a['cuenta']['fauna']} lugares de fauna**. La escribe `python -m rasante auditar`; no corrige nada.",
        "",
        "## Lo que hay que mirar",
        f"- Spots por provincia: de {min(spots)} a {max(spots)} (mediana {median(spots):.0f}). "
        f"{len(pocos)} provincias con menos de {POCOS_SPOTS} y {len(sin_spots)} sin ninguno"
        + (f" ({', '.join(sin_spots)})" if sin_spots else "")
        + ".",
        f"- Provincias sin ningún espacio, humedal u observatorio de fauna: {', '.join(sin_sitios) or 'ninguna'}.",
        f"- Posibles duplicados: {len(a['duplicados']['luz'])} pares de spots a menos de "
        f"{KM_DUPLICADO_LUZ * 1000:.0f} m; {len(a['duplicados']['fauna_mismo_nombre'])} pares de lugares de fauna "
        f"con el mismo nombre a menos de {KM_MISMO_NOMBRE:.0f} km; {len(a['duplicados']['fauna_pegados'])} pares de "
        f"espacios u observatorios a menos de {KM_PEGADOS * 1000:.0f} m.",
        f"- Nombres dudosos (genéricos, muy cortos o solo un código): {len(a['nombres'])}.",
        "",
        "## Tipos",
    ]
    for cat in ("luz", "fauna"):
        lineas.append(f"- **{cat}**: " + ", ".join(f"{t} {n}" for t, n in a["tipos"][cat]))
    lineas += ["", "## Campos sin dato", "| Catálogo | Campo | Lugares |", "|---|---|---|"]
    for cat, campos in a["vacios"].items():
        total = campos["total"]
        lineas += [f"| {cat} | {campo} | {_pct(n, total)} |" for campo, n in campos.items() if campo != "total"]
    lineas += ["", "## Fuentes y licencias de los lugares", "| Fuente | Licencia | Lugares |", "|---|---|---|"]
    lineas += [f"| {f} | {lic} | {n} |" for (f, lic), n in a["fuentes"]]
    lineas += [
        "",
        "## Cobertura por provincia",
        "Sitios de fauna = espacios protegidos, humedales y observatorios (sin los puntos de eBird).",
        "",
        "| Provincia | Comunidad | Spots de luz | Sitios de fauna | Puntos de eBird |",
        "|---|---|---|---|---|",
    ]
    lineas += [
        f"| {c['provincia']} | {c['ccaa']} | {c['spots']}{' ⚠' if c['spots'] < POCOS_SPOTS else ''} | "
        f"{c['sitios']}{' ⚠' if c['sitios'] == 0 else ''} | {c['puntos']} |"
        for c in sorted(cob, key=lambda c: (c["spots"], c["provincia"]))
    ]
    titulos = {
        "luz": f"Spots a menos de {KM_DUPLICADO_LUZ * 1000:.0f} m",
        "fauna_mismo_nombre": f"Lugares de fauna con el mismo nombre a menos de {KM_MISMO_NOMBRE:.0f} km",
        "fauna_pegados": f"Espacios u observatorios de fauna a menos de {KM_PEGADOS * 1000:.0f} m",
    }
    lineas += ["", "## Posibles duplicados"]
    for clave, titulo in titulos.items():
        pares = a["duplicados"][clave]
        lineas += ["", f"### {titulo}: {len(pares)}"]
        lineas += [_par(t) for t in pares[:EJEMPLOS]]
        if len(pares) > EJEMPLOS:
            lineas.append(f"- … y {len(pares) - EJEMPLOS} más")
    lineas += ["", f"## Nombres dudosos: {len(a['nombres'])}"]
    lineas += [f"- «{x['nombre']}» (`{x['id']}`, {x['catalogo']}, {x['provincia']})" for x in a["nombres"][:EJEMPLOS]]
    if len(a["nombres"]) > EJEMPLOS:
        lineas.append(f"- … y {len(a['nombres']) - EJEMPLOS} más")
    return "\n".join(lineas) + "\n"


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(prog="python -m rasante auditar", description=__doc__.split("\n")[0])
    ap.add_argument("--lugares", type=Path, default=Path("public/datos/lugares.json"))
    ap.add_argument("--salida", type=Path, default=None, help="por defecto, docs/datos/auditoria-AAAA-MM-DD.md")
    a = ap.parse_args(argv)
    doc = leer(a.lugares)
    if not doc:
        raise SystemExit(f"No existe {a.lugares}: genera antes lugares.json con `python -m rasante lugares`")
    hoy = date.today()
    salida = a.salida or Path("docs/datos") / f"auditoria-{hoy.isoformat()}.md"
    provincias = sorted({p["provincia"] for p in Provincias().props if p.get("provincia")})
    texto = informe(auditar(doc, provincias), hoy)
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(texto, encoding="utf-8")
    print("\n".join(texto.split("\n")[4:9]))
    print(f"Escrito {salida}")


if __name__ == "__main__":
    main()
