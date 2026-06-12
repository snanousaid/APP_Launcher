import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface AppConfig {
  id: string
  name: string
  description?: string
  service?: string
  exePath?: string
  args?: string[]
  icon?: string
  color?: string
}

export type AppStatus = 'stopped' | 'running' | 'error'

export interface AppState {
  id: string
  status: AppStatus
  pid?: number
  error?: string
}

// API exposée au renderer via window.api
const api = {
  /** Récupère la liste des applications configurées */
  getApps: (): Promise<AppConfig[]> => ipcRenderer.invoke('get-apps'),

  /** Récupère l'état courant de toutes les applications */
  getStatuses: (): Promise<AppState[]> => ipcRenderer.invoke('get-statuses'),

  /** Lance une application par son id */
  launchApp: (id: string): Promise<AppState> => ipcRenderer.invoke('launch-app', id),

  /** Arrête une application par son id */
  stopApp: (id: string): Promise<AppState> => ipcRenderer.invoke('stop-app', id),

  /** S'abonne aux changements d'état (ex: app fermée/crash). Retourne une fonction de désabonnement. */
  onStatus: (cb: (state: AppState) => void): (() => void) => {
    const listener = (_: unknown, state: AppState): void => cb(state)
    ipcRenderer.on('app-status', listener)
    return () => ipcRenderer.removeListener('app-status', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
