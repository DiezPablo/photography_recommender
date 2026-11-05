#!/usr/bin/env bash
# Sube un fichero a main con la API de contenidos de GitHub (un commit por fichero). Los commits que crea la API con
# el token de Actions los firma GitHub: salen como verificados, a diferencia de un `git commit` dentro de Actions.
# Uso: subir_fichero.sh ruta/en/el/repo "mensaje" [fichero_local]      (requiere GH_TOKEN con contents:write)
# Si se pasa la variable FUSIONAR=1, en vez de sustituir version.json se mezclan sus huellas con las de main (lo usa
# publicar_release.sh: cada publicación solo trae las de sus ficheros).
set -euo pipefail
ruta="$1"; mensaje="$2"; local="${3:-$1}"
repo="${GITHUB_REPOSITORY:?falta GITHUB_REPOSITORY}"
for intento in 1 2 3 4 5; do
  cuerpo=$(mktemp)
  # el fichero actual en main (sha para la API y contenido para fusionar), si existe
  if ! remoto=$(gh api "repos/$repo/contents/$ruta?ref=main" 2>/dev/null); then remoto='{}'; fi
  python3 - "$remoto" "$local" "$mensaje" "${FUSIONAR:-0}" > "$cuerpo" <<'PY'
import base64, json, sys
remoto, local, mensaje, fusionar = json.loads(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4] == "1"
datos = open(local, "rb").read()
if fusionar and remoto.get("content"):
    viejo = json.loads(base64.b64decode(remoto["content"]))
    nuevo = json.loads(datos)
    ficheros = {**viejo.get("ficheros", {}), **nuevo.get("ficheros", {})}
    datos = (json.dumps({"actualizado": nuevo["actualizado"], "ficheros": ficheros}, indent=1) + "\n").encode()
if remoto.get("content") and base64.b64decode(remoto["content"]) == datos:
    print(json.dumps({"igual": True}))
    sys.exit(0)
cuerpo = {"message": mensaje, "content": base64.b64encode(datos).decode(), "branch": "main"}
if remoto.get("sha"):
    cuerpo["sha"] = remoto["sha"]
print(json.dumps(cuerpo))
PY
  if grep -q '"igual": true' "$cuerpo"; then echo "Sin cambios en $ruta"; exit 0; fi
  # 409 si otro commit cambió el fichero entre medias: se vuelve a leer y a fusionar
  if gh api -X PUT "repos/$repo/contents/$ruta" --input "$cuerpo" >/dev/null; then
    echo "Publicado: $mensaje"
    exit 0
  fi
  sleep "${ESPERA:-$((intento * 5))}"
done
echo "No se pudo subir $ruta tras 5 intentos"; exit 1
