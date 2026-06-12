#!/bin/bash

export DISPLAY=:0

# Lancer l'app en arrière-plan, puis afficher le bouton Retour par-dessus
./matiplant --no-sandbox --disable-gpu &
APP_PID=$!
sleep 2
bash /home/nextronic/APP_Launcher/deploy/overlay-back.sh &
OVERLAY_PID=$!

wait $APP_PID
kill $OVERLAY_PID 2>/dev/null
