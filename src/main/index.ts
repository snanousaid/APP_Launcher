import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  loadApps,
  launch,
  stop,
  allStatuses,
  stopAllApps,
  stopAllSpawned,
  type AppState
} from './launcher'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    title: 'APP Launcher',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** Envoie un changement d'état au renderer (dev Windows : app fermée/crash) */
function broadcastStatus(state: AppState): void {
  mainWindow?.webContents.send('app-status', state)
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.app.launcher')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Au démarrage du launcher : on arrête tous les services d'apps (état propre)
  await stopAllApps()

  // Liste des applications configurées
  ipcMain.handle('get-apps', () => loadApps())

  // États courants de toutes les applications
  ipcMain.handle('get-statuses', () => allStatuses())

  // Lancer une application (Linux : start service + quit launcher)
  ipcMain.handle('launch-app', (_, id: string) =>
    launch(id, (exitState) => broadcastStatus(exitState))
  )

  // Arrêter une application
  ipcMain.handle('stop-app', (_, id: string) => stop(id))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopAllSpawned()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => stopAllSpawned())
