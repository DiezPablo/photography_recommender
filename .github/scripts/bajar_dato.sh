#!/usr/bin/env bash
# Descarga un fichero de la release «datos» (su .gz) a DESTINO. Si aún no está con su nombre nuevo (spec 007:
# espana_* → fauna_*), prueba el antiguo; sin ninguno, no deja fichero y no falla (el paso sigue sin historial).
# Uso: bajar_dato.sh fauna_listas_dias.json salida/fauna_listas_dias.json
set -uo pipefail
nombre="$1"; destino="$2"
case "$nombre" in
  fauna_cuadricula.json) antiguo="espana.json" ;;
  fauna_*) antiguo="espana_${nombre#fauna_}" ;;
  *) antiguo="$nombre" ;;
esac
mkdir -p "$(dirname "$destino")"
for n in "$nombre" "$antiguo"; do
  if curl -fsSL "https://github.com/${GITHUB_REPOSITORY}/releases/download/datos/$n.gz" | gunzip > "$destino" \
    && [ -s "$destino" ]; then
    echo "Datos: $n → $destino"
    exit 0
  fi
done
rm -f "$destino"
echo "Datos: $nombre no está en la release (ni como $antiguo)"
