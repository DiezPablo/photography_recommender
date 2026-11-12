"""Sale con 1 si safaris_mundo.json nuevo no tiene los nombres de las especies o tiene bastantes menos parques que el publicado (el de la release de
este repo). Con la caché vacía, las primeras ejecuciones solo llegan a parte de
los parques: publicarlas dejaría la web con menos que antes. Uso: no_empeora.py salida/safaris_mundo.json"""

import gzip
import json
import sys
import urllib.request
from pathlib import Path

REPOS = ["DiezPablo/photography_recommender"]
MARGEN = 0.95


def publicado() -> int | None:
    for repo in REPOS:
        url = f"https://github.com/{repo}/releases/download/datos/safaris_mundo.json.gz"
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return len(json.loads(gzip.decompress(r.read()))["parques"])
        except Exception:
            continue
    return None


datos = json.loads(Path(sys.argv[1]).read_text())
nuevo = len(datos["parques"])
# los nombres de las especies: el 26-10-2026 se publicó un fichero sin ninguno (se pedían al final y se acabó el
# tiempo) y las fichas salían con «Especie sin nombre común»
usadas = {k for p in datos["parques"] for k, _ in p.get("mamiferos", []) + p.get("aves", [])}
con_nombre = sum(1 for k in usadas if str(k) in datos.get("especies", {}))
print(f"Nombres: {con_nombre} de {len(usadas)} especies")
if usadas and con_nombre < len(usadas) * MARGEN:
    print("Faltan nombres de especies: no se publica")
    sys.exit(1)
antes = publicado()
print(f"Parques: {nuevo} nuevos, {antes} publicados")
if antes and nuevo < antes * MARGEN:
    print("Menos parques que lo publicado: no se publica hasta que la caché lo complete")
    sys.exit(1)
