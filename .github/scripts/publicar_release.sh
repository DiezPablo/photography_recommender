#!/usr/bin/env bash
# Publica los datos generados como ficheros de la release "datos" (se sobrescriben: el historial de git
# no crece con cada previsión) y hace un commit mínimo (public/datos/version.json) para que Vercel
# reconstruya la web, que descarga los datos al compilar (scripts/descargar-datos.mjs).
# Uso: publicar_release.sh "mensaje" fichero1 [fichero2 ...]      (requiere GH_TOKEN con contents:write)
set -euo pipefail
mensaje="$1"; shift
for f in "$@"; do [ -f "$f" ] || { echo "No existe $f: nada que publicar"; exit 0; }; done
# Si ningún fichero ha cambiado no se publica: cada commit de version.json es un despliegue nuevo de Vercel, y
# Vercel guarda los despliegues 30 días (el almacenamiento de despliegues llegaba a 30 GB)
git fetch -q origin main
if python3 - "$@" <<'PY'
import hashlib, json, subprocess, sys
try:
    actual = json.loads(subprocess.run(["git", "show", "origin/main:public/datos/version.json"],
                                       capture_output=True, text=True, check=True).stdout).get("ficheros", {})
except Exception:
    sys.exit(1)
nuevos = {f.split("/")[-1]: hashlib.sha1(open(f, "rb").read()).hexdigest()[:12] for f in sys.argv[1:]}
sys.exit(0 if all(actual.get(k) == v for k, v in nuevos.items()) else 1)
PY
then
  echo "Sin cambios en $*: no se publica (ni se despliega)"
  exit 0
fi
gh release view datos >/dev/null 2>&1 || \
  gh release create datos --title "Datos de safaris" --notes "Ficheros que publica GitHub Actions (se sobrescriben en cada actualización)." --prerelease
gzip -kf9 "$@"
gh release upload datos "$@" $(printf '%s.gz ' "$@") --clobber
echo "Subidos: $*"

# Versiones (decisión de la auditoría, 08-11-2026): los .gz de lo publicado cada día van también a la release
# «datos-AAAA-MM-DD», para comparar y volver atrás; se guardan las 6 últimas. Cada una tiene solo los ficheros que
# cambiaron ese día: la versión de un fichero en una fecha es la de la release más reciente anterior que lo tenga
# (o la de «datos», si ninguna lo tiene). Un fallo aquí no impide la publicación.
version="datos-$(date -u +%Y-%m-%d)"
{
  gh release view "$version" >/dev/null 2>&1 || \
    gh release create "$version" --title "Datos del $(date -u +%d-%m-%Y)" --prerelease --latest=false \
      --notes "Copia de los ficheros publicados ese día (comprimidos). Se guardan las 6 últimas."
  gh release upload "$version" $(printf '%s.gz ' "$@") --clobber
  gh api "repos/${GITHUB_REPOSITORY}/releases?per_page=100" --jq '.[].tag_name' \
    | grep -E '^datos-[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort -r | tail -n +7 \
    | while read -r viejo; do gh release delete "$viejo" --yes --cleanup-tag; done
} || echo "Aviso: no se pudo guardar la versión $version"

tmp=$(mktemp)
python3 - "$tmp" "$@" <<'PY'
import hashlib, json, sys, datetime
salida, ficheros = sys.argv[1], sys.argv[2:]
info = {"actualizado": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "ficheros": {f.split("/")[-1]: hashlib.sha1(open(f, "rb").read()).hexdigest()[:12] for f in ficheros}}
json.dump(info, open(salida, "w"), indent=1)
PY
# el commit de version.json, con la API (firmado por GitHub, verificado): subir_fichero.sh fusiona las huellas con
# las de main y reintenta si otro workflow publica a la vez
FUSIONAR=1 "$(dirname "$0")/subir_fichero.sh" public/datos/version.json "$mensaje" "$tmp"
