# APP Launcher

Application desktop **Electron + React + TypeScript** qui contrôle (lance / arrête) d'autres
applications desktop déjà installées. Chaque application apparaît sous forme de carte avec un
bouton **Lancer / Arrêter** et un indicateur d'état en temps réel.

## Architecture

```
APP_Launcher/
├─ apps.config.json          → liste des applications (nom, chemin exe, icône, couleur)
├─ src/
│  ├─ main/                  → process principal (Node)
│  │  ├─ index.ts            → fenêtre + handlers IPC
│  │  └─ launcher.ts         → spawn / kill / suivi des process
│  ├─ preload/
│  │  └─ index.ts            → pont sécurisé window.api (IPC)
│  └─ renderer/src/          → interface React
│     ├─ App.tsx             → grille des cartes
│     ├─ components/AppCard.tsx
│     ├─ hooks/useApps.ts    → chargement config + suivi des états
│     ├─ types.ts
│     └─ components/ui/      → shadcn/ui
```

### Flux d'un clic

```
[Clic carte] → window.api.launchApp(id)   (renderer)
        → IPC 'launch-app'                 (preload)
        → child_process.spawn(exePath)     (main/launcher.ts)
        → suivi du PID, détection de fermeture/crash
        → IPC 'app-status' → mise à jour de la carte
```

## Configuration des applications

Éditer **`apps.config.json`** (aucune recompilation nécessaire) :

```json
[
  {
    "id": "app1",
    "name": "Mon application",
    "description": "Description courte",
    "exePath": "C:/chemin/vers/app.exe",
    "args": [],
    "icon": "AppWindow",
    "color": "#3b82f6"
  }
]
```

- `id` : identifiant unique
- `exePath` : chemin absolu de l'exécutable (utiliser `/` ou `\\`)
- `args` : arguments de ligne de commande (optionnel)
- `icon` : nom d'une icône [lucide-react](https://lucide.dev/icons) (ex: `Calculator`, `Folder`)
- `color` : couleur d'accent de la carte (hex)

> En version installée, le fichier `apps.config.json` est copié à côté de l'exécutable et reste
> modifiable.

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:win    # Windows
npm run build:linux  # Linux
npm run build:mac    # macOS
```
