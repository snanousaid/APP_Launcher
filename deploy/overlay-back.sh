#!/bin/bash
# Bouton flottant "Retour" affiché par-dessus l'application en cours.
# Au clic → arrête l'app active → son ExecStopPost ramène le menu (écran droit).
# Lancé en parallèle de l'app par son script (fridge.sh, viogris.sh, ...).

export DISPLAY=:0
TITLE="retour-overlay"

# Bouton flottant (en arrière-plan). Le bouton renvoie 0 quand on clique dessus.
yad --undecorated --on-top --sticky --skip-taskbar --no-escape \
    --title="$TITLE" --geometry=130x70-15-15 \
    --text="" --button="⟲ Retour:0" &
YAD_PID=$!

# Nettoyage si le script est tué (quand l'app se ferme)
trap 'kill "$YAD_PID" "$RAISER_PID" 2>/dev/null' EXIT

# L'app peut s'afficher APRÈS le bouton et le recouvrir (pas de gestionnaire de fenêtres).
# On ré-élève donc le bouton au-dessus toutes les 3 s tant qu'il existe.
(
  while kill -0 "$YAD_PID" 2>/dev/null; do
    xdotool search --name "$TITLE" windowraise 2>/dev/null
    sleep 3
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
