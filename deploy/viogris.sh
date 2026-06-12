#!/bin/bash

export DISPLAY=:0

# Process pm2 ACL (appartient à l'utilisateur nextronic) : démarre avec viogris,
# et s'arrête quand viogris se ferme (trap sur la sortie du script).
# Le service tourne en root → "sudo -iu nextronic" sans mot de passe + PATH/HOME de nextronic.
sudo -iu nextronic pm2 start ACL
trap 'sudo -iu nextronic pm2 stop ACL' EXIT

# Lancer l'app en arrière-plan, puis afficher le bouton Retour par-dessus
./viogris --no-sandbox --disable-gpu &
APP_PID=$!
sleep 2
bash /home/nextronic/APP_Launcher/deploy/overlay-back.sh &
OVERLAY_PID=$!

wait $APP_PID
kill $OVERLAY_PID 2>/dev/null
