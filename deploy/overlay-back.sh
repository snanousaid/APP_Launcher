#!/bin/bash
# Bouton flottant "Retour" affiché par-dessus l'application en cours.
# Au clic → arrête l'app active → son ExecStopPost ramène le menu (écran droit).
# Lancé en parallèle de l'app par son script (fridge.sh, viogris.sh, ...).

export DISPLAY=:0

# yad affiche une petite fenêtre toujours au-dessus, dans un coin.
# Le bouton renvoie le code 0 quand on clique dessus.
if yad --undecorated --on-top --sticky --skip-taskbar --no-escape \
       --geometry=130x70-15-15 \
       --text="" --button="⟲ Retour:0"; then
  # Arrête l'app active (les 3 autres = no-op). --no-block pour ne pas se bloquer
  # soi-même quand le cgroup de l'app est tué.
  systemctl stop --no-block fridge.service matiplant.service viogris.service terminal.service
fi
