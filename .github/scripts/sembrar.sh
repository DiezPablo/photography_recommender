#!/usr/bin/env bash
# Siembra: copia a la release «datos» de este repositorio los ficheros del modo Luz que aún no tenga, desde la
# release del repositorio anterior (DiezPablo/photo_recommender). Solo hace algo la primera vez; cuando los
# workflows de aquí ya publican cada fichero, no descarga nada. Uso: sembrar.sh fichero.json [otro.json …]
set -euo pipefail
ORIGEN="${SIEMBRA_REPO:-DiezPablo/photo_recommender}"
mkdir -p salida/siembra
nuevos=""
for f in "$@"; do
  if curl -fsIL -o /dev/null "https://github.com/${GITHUB_REPOSITORY}/releases/download/datos/$f.gz"; then
    continue
  fi
  if curl -fsSL "https://github.com/$ORIGEN/releases/download/datos/$f.gz" | gunzip > "salida/siembra/$f"; then
    nuevos="$nuevos salida/siembra/$f"
    echo "Sembrado $f desde $ORIGEN"
  else
    rm -f "salida/siembra/$f"
    echo "Aviso: $f no está en $ORIGEN"
  fi
done
if [ -n "$nuevos" ]; then
  "$(dirname "$0")/publicar_release.sh" "Siembra de datos de Luz ($(date -u +%Y-%m-%d))" $nuevos
fi
