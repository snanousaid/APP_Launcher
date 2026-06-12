#!/bin/bash
# Bouton flottant "Retour" affiché par-dessus l'application en cours.
# Au clic → arrête l'app active → son ExecStopPost ramène le menu (écran droit).
# Lancé en parallèle de l'app par son script (fridge.sh, viogris.sh, ...).

export DISPLAY=:0

# Bouton flottant (en arrière-plan). Le bouton renvoie 0 quand on clique dessus.
yad --undecorated --on-top --sticky --skip-taskbar --no-escape \
    --geometry=130x70-15-15 \
    --text="" --button="⟲ Retour:0" &
YAD_PID=$!

# Nettoyage si le script est tué (quand l'app se ferme)
trap 'kill "$YAD_PID" "$RAISER_PID" 2>/dev/null' EXIT

# L'app peut s'afficher APRÈS le bouton et le recouvrir (pas de gestionnaire de fenêtres).
# On retrouve la fenêtre du bouton par son PID, puis on la remonte au-dessus chaque seconde.
(
  WID=""
  for i in $(seq 1 50); do
    WID=$(xdotool search --pid "$YAD_PID" 2>/dev/null | tail -1)
    [ -n "$WID" ] && break
    sleep 0.2
  done
  while kill -0 "$YAD_PID" 2>/dev/null; do
    [ -n "$WID" ] && xdotool windowraise "$WID" 2>/dev/null
    sleep 1
  done
) &
RAISER_PID=$!

# Attendre le clic (sortie de yad)
wait "$YAD_PID"
RC=$?
kill "$RAISER_PID" 2>/dev/null

# Bouton cliqué (code 0) → arrêter l'app active (les autres = no-op)
[ "$RC" -eq 0 ] && systemctl stop --no-block \
  fridge.service matiplant.service viogris.service terminal.service
