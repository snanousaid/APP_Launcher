# Déploiement APP Launcher sur ARM64 (systemd)

Le launcher et les apps sont des **services systemd** mutuellement exclusifs, pilotés
**manuellement depuis le code** du launcher :

- **Au démarrage du launcher** → il exécute `systemctl stop` sur les services d'apps.
- **Clic sur une carte** → le launcher délègue à `rotate-launch.sh` (lancé détaché via
  `sudo systemd-run`) qui, selon `rotation` :
  - **rotation: true**  → `cp xorg.conf /etc/X11/` → `restart startx` → `start <app>.service`
  - **rotation: false** → `rm /etc/X11/xorg.conf` → `restart startx` → `start <app>.service`
  Le script est détaché car `restart startx` ferme le launcher (l'écran X redémarre).
- **Retour au menu** (optionnel) → ajouter `ExecStopPost=/usr/bin/systemctl start app-launcher.service`
  dans le `.service` de l'app.

### Rotation de l'écran
`xorg.conf` (dans deploy) applique la rotation (CCW + matrice tactile). Apps `rotation: true`
(viogris, terminal) → écran tourné ; `rotation: false` (fridge, matiplant) + launcher → écran droit.

Tout est déployé dans **un seul dossier** : `/home/nextronic/APP_Launcher/deploy/`.

> `apps.config.json` n'est PAS un fichier de ce dossier : il est **embarqué dans le binaire**
> du launcher (bundle). Pour changer les apps, on l'édite à la racine du projet et on rebuild.

---

## 1. Configurer les applications

Éditer `apps.config.json` (racine du projet) et mettre **les vrais noms de services** dans `service` :

```json
[
  { "id": "fridge",   "name": "Fridge",   "service": "fridge.service",   "icon": "Refrigerator" },
  { "id": "mediot",   "name": "Mediot",   "service": "mediot.service",   "icon": "Activity" },
  { "id": "aptiv",    "name": "Aptiv",    "service": "aptiv.service",    "icon": "Cpu" },
  { "id": "terminal", "name": "Terminal", "service": "terminal.service", "icon": "Terminal" }
]
```

> `exePath` n'est utilisé qu'en dev Windows ; sur ARM64 seul `service` compte.

## 2. Construire le binaire ARM64

```bash
npm install
npm run build           # compile main/preload/renderer
npm run build:linux     # génère le binaire (electron-builder, cible arm64)
# → produit dist/ (binaire « app-launcher »)
```

## 3. Copier les fichiers dans le dossier de déploiement

Tout va dans `/home/nextronic/APP_Launcher/deploy/` :

```
/home/nextronic/APP_Launcher/deploy/
├─ app-launcher          (binaire du launcher, depuis dist/)
├─ launcher.sh
├─ app-launcher.service
├─ rotate-launch.sh      (gère rotation + restart startx + start app)
├─ xorg.conf             (config rotation écran)
├─ fridge      + fridge.sh    + fridge.service
├─ matiplant   + matiplant.sh + matiplant.service
├─ viogris     + viogris.sh   + viogris.service
└─ terminal    + terminal.sh  + terminal.service
```

> Les `.sh` lancent `./<app>` en relatif et `WorkingDirectory` = ce dossier → les binaires
> doivent être copiés ici. `DISPLAY` n'est plus exporté dans les scripts (déjà défini par la session X).

```bash
chmod +x /home/nextronic/APP_Launcher/deploy/*.sh
```

## 4. Installer les services systemd

```bash
cd /home/nextronic/APP_Launcher/deploy
sudo cp *.service /etc/systemd/system/
sudo systemctl daemon-reload
```

> Retour au menu : déjà intégré dans chaque `<app>.service` via
> `ExecStopPost=/bin/bash .../rotate-launch.sh off app-launcher.service`.
> Quand l'app se ferme → `rm xorg.conf` → `restart startx` → `start app-launcher`
> (le launcher revient toujours en **écran droit**).

## 5. Activer et démarrer

```bash
# Le launcher démarre au boot ; les apps NON (lancées à la demande)
sudo systemctl enable app-launcher.service
sudo systemctl disable fridge.service matiplant.service viogris.service terminal.service

# Démarrer maintenant
sudo systemctl start app-launcher.service
```

## 6. Vérifier

```bash
systemctl status app-launcher.service
journalctl -u app-launcher.service -f
```

---

## Permissions (sudo NOPASSWD)

Le launcher appelle `sudo systemd-run …` et `sudo systemctl …`. Pour que ça marche **sans
mot de passe** (l'app GUI ne peut pas en saisir un), autoriser en NOPASSWD :

```bash
sudo visudo -f /etc/sudoers.d/app-launcher
```
Coller (adapter le chemin si `which systemd-run` diffère) :
```
nextronic ALL=(root) NOPASSWD: /usr/bin/systemd-run, /usr/bin/systemctl
```

> Le script `rotate-launch.sh` est lancé en root via `systemd-run`, donc `cp`, `rm`,
> `restart startx` et `start` à l'intérieur n'ont PAS besoin de sudo individuel.

## Cycle de vie résumé

```
boot ─▶ app-launcher.service (menu, stoppe les apps)
   │
   └─ clic viogris (rotation) ─▶ systemd-run rotate-launch.sh on viogris.service
                                   ├─ cp xorg.conf /etc/X11/
                                   ├─ restart startx  (ferme le launcher)
                                   └─ start viogris.service  (écran tourné)
                                         │
                                         └─ viogris fermée ─▶ ExecStopPost ─▶ rotate-launch.sh off app-launcher.service
                                                                ├─ rm xorg.conf
                                                                ├─ restart startx
                                                                └─ start app-launcher  (écran droit)
```
