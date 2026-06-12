import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppConfig, AppState } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getApps: () => Promise<AppConfig[]>
      getStatuses: () => Promise<AppState[]>
      launchApp: (id: string) => Promise<AppState>
      stopApp: (id: string) => Promise<AppState>
      onStatus: (cb: (state: AppState) => void) => () => void
    }
  }
}

export {}
