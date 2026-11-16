#!/usr/bin/env bash
# Descarga un fichero de la release «datos» (su .gz) a DESTINO. Si no está, no deja fichero y no falla (el paso
# sigue sin historial).
# Uso: bajar_dato.sh fauna_listas_dias.json salida/fauna_listas_dias.json
set -uo pipefail
nombre="$1"; destino="$2"
mkdir -p "$(dirname "$destino")"
if curl -fsSL "https://github.com/${GITHUB_REPOSITORY}/releases/download/datos/$nombre.gz" | gunzip > "$destino" \
  && [ -s "$destino" ]; then
  echo "Datos: $nombre → $destino"
  exit 0
fi
rm -f "$destino"
echo "Datos: $nombre no está en la release"
