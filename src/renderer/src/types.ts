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
