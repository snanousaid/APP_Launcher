#!/bin/bash

export DISPLAY=:0

# Process pm2 ACL dont viogris a besoin : démarre avec viogris,
# et s'arrête quand viogris se ferme (trap sur la sortie du script).
pm2 start ACL
trap 'pm2 stop ACL' EXIT

./viogris --no-sandbox --disable-gpu
