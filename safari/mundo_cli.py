"""Todos los parques del mundo con fauna → safaris_mundo.json (fichas) y safaris_indice.json (buscador).

Uso:
  python -m safari --mundo [--osm-max 1500] [--hilos 4]
"""

from __future__ import annotations

import gzip
import json
import math
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

import requests

from safari import entorno, huellas, limpieza, mundo, practico
from safari import gbif as gbif_nombres
from safari.catalogo import cargar
from safari.comun.ficheros import escribir_json
from safari.refinar import puntuacion, refinar

_ERRORES = (requests.RequestException, KeyError, ValueError, RuntimeError)
EXTERIORES = "https://www.exteriores.gob.es/"
# Mamíferos que se guardan de cada parque (los más registrados): la carta del mundo (/mapa) solo encuentra una
# especie en los parques donde está en la lista. Eran 12 hasta el 08-11-2026; GBIF ya da hasta 200 en la misma
# petición (`mundo.gbif`), así que subir el corte solo cuesta tamaño (unos 2 MB más sin comprimir) y nombres comunes.
MAX_MAMIFEROS = 40


def _sin_perros(x: dict, g: dict) -> dict:
    """El «lobo» sin los perros: GBIF los junta en la misma especie; se restan los de la subespecie doméstica."""
    for especie, domestica in mundo.SUBESPECIE_DOMESTICA.items():
        if not any(e[0] == especie for e in g["especies"]):
            continue
        try:
            perros = mundo.conteo_taxon(x["lat"], x["lon"], x["radio_km"], domestica, x.get("forma"))
        except _ERRORES:
            perros = 0
        g = {**g, "especies": [e if e[0] != especie else [especie, max(0, e[1] - perros)] for e in g["especies"]]}
        g["especies"] = sorted([e for e in g["especies"] if e[1] > 0], key=lambda e: -e[1])
    return g


def _en_paralelo(funcion, elementos, hilos: int, etiqueta: str):
    salida = [None] * len(elementos)
    t0 = time.time()

    def uno(i):
        try:
            salida[i] = funcion(elementos[i])
        except _ERRORES as e:
            print(f"    {etiqueta}: fallo en {i}: {e}", flush=True)

    with ThreadPoolExecutor(hilos) as ex:
        for n, _ in enumerate(ex.map(uno, range(len(elementos)))):
            if n and n % 500 == 0:
                print(f"  {etiqueta}: {n}/{len(elementos)} ({time.time() - t0:.0f} s)", flush=True)
    return salida


def claves_estrella(curados: list[dict]) -> dict[int, str]:
    """Clave de GBIF de las especies estrella del catálogo curado (para filtrar parques por especie)."""
    salida = {}
    for c in sorted({c for p in curados for c in p["estrella"]}):
        try:
            d = gbif_nombres._get("species/match", {"name": c, "strict": "true"})
        except _ERRORES:
            continue
        clave = d.get("speciesKey") or d.get("usageKey")
        if clave and d.get("matchType") != "NONE":
            salida[int(clave)] = c
    return salida


def area_plausible(x: dict, paises: dict) -> int | None:
    """Superficie en km², o None si es imposible: más de la mitad del país (comas decimales mal importadas en
    Wikidata dan parques ×100 o ×1000 más grandes que el real)."""
    if not x.get("area_m2"):
        return None
    km2 = x["area_m2"] / 1e6
    pais = paises.get(x.get("pais") or "", {}).get("area_km2")
    if pais and km2 > pais / 2:
        return None
    return round(km2)


def quitar_duplicados(parques: list[dict]) -> list[dict]:
    """El mismo parque con dos elementos de Wikidata (p. ej. parque nacional y reserva de la biosfera)."""
    parques = sorted(parques, key=lambda p: -p["puntuacion"])
    vistos: list[dict] = []
    for p in parques:
        nombre = mundo.slug(p["nombre"])
        if any(
            mundo.slug(v["nombre"]) == nombre and practico.km((p["lat"], p["lon"]), (v["lat"], v["lon"])) < 40
            for v in vistos
        ):
            continue
        vistos.append(p)
    return vistos


def calcular(hilos: int = 4, osm_max: int = 1500, limite: int | None = None) -> dict:
    curados = cargar()
    estrella = claves_estrella(curados)
    cands = mundo.candidatos()
    qids_curados = {c["wikidata"]: c for c in curados if c["wikidata"]}
    lista = [
        # el círculo con la misma superficie que la caja de antes (radio × 2/√π): los umbrales de fauna
        # (`MIN_ESPECIES`, `MIN_OBS`) se calibraron con la caja, y con el círculo del mismo radio, el 78,5 % de su
        # superficie, se quedaban fuera 580 de 3525 parques (08-11-2026). Los destacados conservan su radio, el mismo
        # que usa iNaturalist.
        {"qid": q, **x, "radio_km": round(mundo.radio_km(x["area_m2"], x["clase"]) * 2 / math.sqrt(math.pi), 1)}
        for q, x in cands.items()
        if q not in qids_curados
    ][:limite]
    # los parques del catálogo curado entran siempre, con su zona de safari
    lista += [
        {
            "qid": c["wikidata"],
            "id": c["id"],
            "lat": c["lat"],
            "lon": c["lon"],
            "radio_km": c["radio_km"],
            "area_m2": (cands.get(c["wikidata"]) or {}).get("area_m2"),
            "pais": (cands.get(c["wikidata"]) or {}).get("pais"),
            "clase": (cands.get(c["wikidata"]) or {}).get("clase", "parque nacional"),
            "destacado": True,
        }
        for c in curados
    ]
    print(f"  {len(lista)} candidatos; cribado con GBIF…", flush=True)
    mam = _en_paralelo(lambda x: mundo.gbif(x["lat"], x["lon"], x["radio_km"], mundo.MAMIFEROS), lista, hilos, "GBIF")
    elegidos = []
    for x, g in zip(lista, mam, strict=True):
        if g is None:
            continue
        g = _sin_perros(x, g)
        if x.get("destacado") or (len(g["especies"]) >= mundo.MIN_ESPECIES and g["obs"] >= mundo.MIN_OBS):
            elegidos.append({**x, "mam": g})
    print(f"  {len(elegidos)} parques con fauna", flush=True)

    det = mundo.detalles([x["qid"] for x in elegidos if x["qid"]])
    # el contorno real (P3896, un mapa de Commons) donde lo hay: la fauna se vuelve a contar dentro de él, con la
    # misma huella para todas las fuentes (safari/huellas.py); sin respuesta aún, se queda la del círculo
    try:
        formas = huellas.contornos([d["forma"] for d in det.values() if d.get("forma")])
    except _ERRORES as e:
        print(f"  sin contornos de Commons: {e}", flush=True)
        formas = {}
    # los destacados no: también se cuentan en iNaturalist, cuya API solo admite círculos, y las dos fuentes han de
    # usar la misma zona
    con_forma = [
        x for x in elegidos if not x.get("destacado") and formas.get(det.get(x["qid"] or "", {}).get("forma", ""))
    ]
    print(f"  {len(con_forma)} parques con contorno; GBIF dentro de él…", flush=True)
    for x in con_forma:
        x["forma"] = formas[det[x["qid"]]["forma"]]
    nuevos = _en_paralelo(
        lambda x: mundo.gbif(x["lat"], x["lon"], x["radio_km"], mundo.MAMIFEROS, forma=x["forma"]),
        con_forma,
        hilos,
        "GBIF",
    )
    for x, g in zip(con_forma, nuevos, strict=True):
        if g is not None:
            x["mam"] = _sin_perros(x, g)
        else:
            x.pop("forma")
    paises = mundo.paises([x["pais"] for x in elegidos if x["pais"]])
    paises_salida = {
        q: {
            "nombre": d.get("n"),
            "iso": d.get("iso"),
            "continente": mundo.CONTINENTE.get(d.get("cont", ""), d.get("cont")),
            "moneda": d.get("mon"),
            "idiomas": d["idiomas"][:3],
        }
        for q, d in paises.items()
    }
    parques = []
    for x in elegidos:
        d = det.get(x["qid"] or "", {})
        nombre = next((c["nombre"] for c in curados if c["id"] == x.get("id")), None) or d.get("es") or d.get("en")
        if not nombre or nombre == x["qid"]:
            continue
        g = x["mam"]
        parques.append(
            {
                "id": x.get("id") or f"{mundo.slug(nombre) or 'parque'}-{x['qid'].lower()}",
                "qid": x["qid"],
                "nombre": nombre,
                "clase": x["clase"],
                "pais": x["pais"],
                "lat": round(x["lat"], 4),
                "lon": round(x["lon"], 4),
                "radio_km": x["radio_km"],
                "area_km2": area_plausible(x, paises),
                "iucn": d.get("iucnl"),
                "unesco": bool(d.get("unesco")),
                "wdpa": d.get("wdpa"),
                "web": d.get("web"),
                "wiki": d.get("wiki"),
                "img": d.get("img"),
                "destacado": bool(x.get("destacado")),
                "temporada": next((c["meses"] for c in curados if c["id"] == x.get("id")), None),
                # país del catálogo, por si el elemento de Wikidata no lo tiene (el Masái Mara es una región)
                **next(
                    (
                        {"pais_nombre": c["pais"], "continente": c["continente"]}
                        for c in curados
                        if c["id"] == x.get("id")
                    ),
                    {},
                ),
                "obs": g["obs"],
                "huella": "caja" if g.get("antigua") else "contorno" if x.get("forma") else "círculo",
                "_forma": x.get("forma"),
                "n_mamiferos": len(g["especies"]),
                # unos pocos de margen: después se quitan los domésticos
                "mamiferos": g["especies"][: MAX_MAMIFEROS + 5],
                "estrella": {str(k): n for k, n in g["especies"] if k in estrella},
                "meses": g["meses"],
                "puntuacion": puntuacion(
                    len(g["especies"]), sum(1 for k, n in g["especies"] if k in estrella and n >= 5)
                ),
            }
        )
    parques = quitar_duplicados(parques)
    print(f"  {len(parques)} parques tras quitar duplicados; aves, clima y cómo llegar…", flush=True)

    aves = _en_paralelo(
        lambda p: mundo.gbif(p["lat"], p["lon"], p["radio_km"], mundo.AVES, 40, forma=p["_forma"]),
        parques,
        hilos,
        "aves",
    )
    # nombres comunes antes que la lluvia y OSM, y sin límite de tiempo (peticiones rápidas): si se quedaban para el
    # final, al agotarse el tiempo la ficha salía con «Especie 5219461»
    claves = {k for p in parques for k, _ in p["mamiferos"]}
    claves |= {k for a in aves if a for k, _ in a["especies"][:10]} | set(estrella)
    nombres_lista = sorted(claves)
    print(f"  nombres de {len(nombres_lista)} especies…", flush=True)
    nombres = _en_paralelo(gbif_nombres.nombre_comun, nombres_lista, hilos, "nombres")
    especies = {
        str(k): {"c": n["cientifico"], "n": n["nombre"]} for k, n in zip(nombres_lista, nombres, strict=True) if n
    }
    climas = _en_paralelo(lambda p: practico.clima(p["lat"], p["lon"]), parques, min(hilos, 3), "clima")
    aeropuertos = practico.Aeropuertos()
    try:
        fotos = entorno.fotos_commons([p["img"] for p in parques if p["img"]])
    except _ERRORES as e:
        print(f"  sin fotos de Commons: {e}", flush=True)
        fotos = {}
    for p, a, c in zip(parques, aves, climas, strict=True):
        p["aves"] = (a or {}).get("especies", [])[:10]
        p["lluvia_mm"] = c["lluvia_mm"] if c else None
        p["meses_secos"] = practico.meses_secos(c)
        p["epoca"] = practico.epoca(p["lat"], p.get("temporada"), p["lluvia_mm"], p["meses"])
        p["llegar"] = aeropuertos.llegar(p["lat"], p["lon"], p["radio_km"], paises.get(p["pais"] or "", {}).get("iso"))
        p["foto"] = fotos.get(p.pop("img")) if p.get("img") else p.pop("img", None)
        p.pop("_forma", None)

    # nivel de cada parque (A destacados, B destinos de fauna, C el resto): decide qué se pide a OSM
    refinar({"paises": paises_salida, "estrella": {str(k): c for k, c in estrella.items()}, "parques": parques})
    orden = sorted(
        (i for i, p in enumerate(parques) if p["nivel"] != "C"),
        key=lambda i: (parques[i]["nivel"], -parques[i]["puntuacion"]),
    )
    print(f"  {len(orden)} parques de nivel A o B", flush=True)

    operadores([parques[i] for i in orden])

    # OSM por tandas: primero los destacados y los mejores de nivel B; el resto, de la caché si ya se pidió
    pedir_osm = set(orden[:osm_max])
    osm = _en_paralelo(
        lambda i: practico.osm(parques[i]["lat"], parques[i]["lon"], parques[i]["radio_km"], i not in pedir_osm),
        list(range(len(parques))),
        2,
        "OSM",
    )
    for p, o in zip(parques, osm, strict=True):
        if o is not None:
            p["osm"] = o
    limpieza.repartir_alojamientos(parques)
    con_osm = sum(1 for p in parques if "osm" in p)
    print(f"  OSM: {con_osm}/{len(parques)} parques; espejos: {practico.resumen_espejos()}", flush=True)

    # fuera los animales domésticos de las listas
    domesticos = {int(k) for k, e in especies.items() if e["c"] in mundo.DOMESTICOS}
    for p in parques:
        p["mamiferos"] = [e for e in p["mamiferos"] if e[0] not in domesticos][:MAX_MAMIFEROS]
        p["aves"] = [e for e in p["aves"] if e[0] not in domesticos]
    return refinar(
        {
            "paises": paises_salida,
            "especies": especies,
            "estrella": {str(k): c for k, c in estrella.items()},
            "parques": parques,
        }
    )


def acceso(p: dict) -> tuple[str, float, float] | None:
    """Ciudad desde la que se organiza el safari: la de ACCESO en los destacados y la del aeropuerto regular más
    cercano en el resto."""
    if p.get("id") in practico.ACCESO:
        return practico.ACCESO[p["id"]]
    a = (p["llegar"]["aeropuertos"] or [None])[0]
    return (a["ciudad"] or a["nombre"], a["lat"], a["lon"]) if a and a.get("lat") is not None else None


def operadores(parques: list[dict]) -> None:
    """Agencias y operadores de la ciudad de acceso de cada parque (una consulta a OSM por ciudad, compartida).
    Va antes que el resto de OSM, que se comía el tiempo: el 26-10-2026 salieron 0 de 1105 ciudades."""
    ciudades = list(dict.fromkeys(c for p in parques if (c := acceso(p))))
    ops = _en_paralelo(lambda c: practico.operadores_ciudad(c[1], c[2], c[0]), ciudades, 2, "operadores")
    por_ciudad = {c: o for c, o in zip(ciudades, ops, strict=True) if o}
    for p in parques:
        c = acceso(p)
        if c:
            # la ciudad, aunque OSM no tenga operadores: la web enlaza una búsqueda allí
            p["acceso"] = {"ciudad": c[0], "lat": c[1], "lon": c[2]}
        if c and por_ciudad.get(c):
            p["operadores_ciudad"] = {"ciudad": c[0], "lista": por_ciudad[c]}
    print(
        f"  operadores en {len(por_ciudad)}/{len(ciudades)} ciudades de acceso; {practico.resumen_espejos()}",
        flush=True,
    )


def indice(datos: dict) -> list[dict]:
    """Lo justo para el buscador del navegador."""
    salida = []
    for p in datos["parques"]:
        pais = datos["paises"].get(p["pais"] or "", {})
        salida.append(
            {
                "id": p["id"],
                "n": p["nombre"],
                "p": pais.get("nombre") or p.get("pais_nombre"),
                "c": pais.get("continente") or p.get("continente"),
                "la": p["lat"],
                "lo": p["lon"],
                "r": p["radio_km"],
                "s": p["puntuacion"],
                # la muestra (observaciones de mamíferos): la confianza, aparte del potencial
                "o": p.get("obs", 0),
                "m": p["n_mamiferos"],
                "e": [int(k) for k in p["estrella"]],
                "nv": p.get("nivel", "C"),
                "sec": p["meses_secos"],
                "ep": p["epoca"]["meses"],
                "em": p["epoca"]["motivo"],
                "d": p["destacado"],
                **({"t": p["temporada"]} if p.get("temporada") else {}),
                "f": (p.get("foto") or {}).get("url"),
            }
        )
    return sorted(salida, key=lambda x: -x["s"])


def main(
    salida: Path, indice_salida: Path, hilos: int, osm_max: int, limite: int | None = None, minutos: float | None = None
) -> None:
    t0 = time.time()
    if minutos:
        mundo.LIMITE[0] = t0 + minutos * 60
    datos = calcular(hilos, osm_max, limite)
    escribir_json(
        salida,
        {
            "generado": date.today().isoformat(),
            "fuentes": {
                "parques": "Wikidata (CC0)",
                "fauna": f"GBIF.org, mamíferos y aves desde {mundo.DESDE_ANO}",
                "lluvia": "NASA POWER (climatología 2001-2025)",
                "aeropuertos": "OurAirports (dominio público)",
                "servicios": "OpenStreetMap (ODbL)",
                "viajar": EXTERIORES,
            },
            **datos,
        },
    )
    escribir_json(indice_salida, {"generado": date.today().isoformat(), "parques": indice(datos)})
    print(f"{salida}: {len(datos['parques'])} parques ({time.time() - t0:.0f} s)")


def refinar_fichero(
    entrada: Path, salida: Path, indice_salida: Path, minutos: float | None = None, con_operadores: bool = True
) -> None:
    """Niveles y especies estrella de un safaris_mundo.json ya calculado (p. ej. el ya publicado mientras la caché
    de este repo se llena) y, si hay tiempo, los operadores de la ciudad de acceso de los parques A y B."""
    crudo = entrada.read_bytes()
    datos = json.loads(gzip.decompress(crudo) if crudo[:2] == b"\x1f\x8b" else crudo)
    refinar(datos)
    if con_operadores:
        if minutos:
            mundo.LIMITE[0] = time.time() + minutos * 60
        orden = sorted((p for p in datos["parques"] if p["nivel"] != "C"), key=lambda p: (p["nivel"], -p["puntuacion"]))
        operadores(orden)
    escribir_json(salida, datos)
    escribir_json(indice_salida, {"generado": datos.get("generado"), "parques": indice(datos)})
    niveles = Counter(p["nivel"] for p in datos["parques"])
    print(f"{salida}: {len(datos['parques'])} parques ({', '.join(f'{k}: {v}' for k, v in sorted(niveles.items()))})")
