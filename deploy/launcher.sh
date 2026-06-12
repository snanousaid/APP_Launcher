#!/bin/bash

export DISPLAY=:0
# Se placer dans le dossier du script (deploy) → cwd = deploy.
# Indispensable pour ./app-launcher ET pour que le launcher retrouve rotate-launch.sh.
cd "$(dirname "$0")" || exit 1
./app-launcher --no-sandbox --disable-gpu
