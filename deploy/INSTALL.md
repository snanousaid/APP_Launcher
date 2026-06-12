# Déploiement APP Launcher sur ARM64 (systemd)

Le launcher et les apps sont des **services systemd** mutuellement exclusifs, pilotés
**manuellement depuis le code** du launcher :

- **Au démarrage du launcher** → il exécute `systemctl stop` sur les 4 services d'apps.
- **Clic sur une carte** → `systemctl start <app>.service` puis le launcher se ferme
  (`app.quit`), ce qui arrête `app-launcher.service`.
- **Retour au menu** (optionnel) → ajouter `ExecStopPost=/usr/bin/systemctl start app-launcher.service`
  dans le `.service` de l'app.

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
├─ fridge      + fridge.sh   + fridge.service
├─ mediot      + mediot.sh   + mediot.service
├─ aptiv       + aptiv.sh    + aptiv.service
└─ terminal    + terminal.sh + terminal.service
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

> Retour-au-menu (optionnel) : ajouter dans chaque `<app>.service`, section `[Service]` :
> `ExecStopPost=/usr/bin/systemctl start app-launcher.service`

## 5. Activer et démarrer

```bash
# Le launcher démarre au boot ; les apps NON (lancées à la demande)
sudo systemctl enable app-launcher.service
sudo systemctl disable fridge.service mediot.service aptiv.service terminal.service

# Démarrer maintenant
sudo systemctl start app-launcher.service
```

## 6. Vérifier

```bash
systemctl status app-launcher.service
journalctl -u app-launcher.service -f
```

---

## Permissions

Le launcher tourne en `User=root` → il peut faire `systemctl start/stop` **sans sudo**.

## Cycle de vie résumé

```
boot ─▶ app-launcher.service (menu, stoppe les apps)
   │
   └─ clic fridge ─▶ systemctl start fridge.service ─▶ launcher app.quit() (service inactif)
                           │
                           └─ (option) fridge fermée ─▶ ExecStopPost ─▶ start app-launcher.service
```
