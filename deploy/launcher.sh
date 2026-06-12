#!/bin/bash

export DISPLAY=:0
# Se placer dans le dossier du script (deploy) → cwd = deploy.
# Indispensable pour ./app-launcher ET pour que le launcher retrouve rotate-launch.sh.
cd "$(dirname "$0")" || exit 1

# Attendre que le serveur X soit prêt (évite le crash au boot si X pas encore démarré)
for i in $(seq 1 30); do
  [ -S /tmp/.X11-unix/X0 ] && break
  sleep 1
done
sleep 1

./app-launcher --no-sandbox --disable-gpu
