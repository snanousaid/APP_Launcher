#!/bin/bash
# Gère la rotation de l'écran puis lance l'application.
# Lancé en root (via "sudo systemd-run") par le launcher, donc indépendant de l'écran :
# il survit au "restart startx" qui ferme le launcher.
#
# Usage : rotate-launch.sh <on|off> <service>
#   on  = écran tourné   (copie xorg.conf dans /etc/X11/)
#   off = écran droit     (supprime xorg.conf de /etc/X11/)

ROT="$1"        # on | off
SERVICE="$2"    # ex: viogris.service
DIR="$(dirname "$0")"

if [ "$ROT" = "on" ]; then
  cp "$DIR/xorg.conf" /etc/X11/xorg.conf
else
  rm -f /etc/X11/xorg.conf
fi

# Redémarre l'affichage pour appliquer (ou retirer) la rotation
systemctl restart startx

# Laisser le serveur X redémarrer avant de lancer l'app
sleep 4

# Démarrer l'application
systemctl start "$SERVICE"
