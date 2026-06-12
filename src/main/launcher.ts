import { spawn, ChildProcess } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { app } from 'electron'

/** Nom du service systemd du launcher lui-même */
const LAUNCHER_SERVICE = 'app-launcher.service'

/** Sur Linux (ARM64) on pilote systemd ; sur Windows on lance l'exe (test UI en dev) */
const USE_SYSTEMD = process.platform === 'linux'

/** Description d'une application contrôlée (apps.config.json) */
export interface AppConfig {
  id: string
  name: string
  description?: string
  /** Nom de l'unité systemd, ex: "app1.service" (utilisé en prod ARM64) */
  service?: string
  /** Chemin de l'exécutable (utilisé seulement en dev Windows) */
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

/** Process lancés en dev Windows (spawn), indexés par id */
const running = new Map<string, ChildProcess>()

/** Localise apps.config.json (dev = racine projet, prod = à côté de l'exe) */
function configPath(): string {
  const candidates = [
    join(app.getAppPath(), 'apps.config.json'),
    join(dirname(app.getPath('exe')), 'apps.config.json'),
    join(process.resourcesPath ?? '', 'apps.config.json')
  ]
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }
  return candidates[0]
}

/** Charge la liste des applications */
export function loadApps(): AppConfig[] {
  try {
    const raw = readFileSync(configPath(), 'utf-8')
    const apps = JSON.parse(raw) as AppConfig[]
    if (!Array.isArray(apps)) throw new Error('apps.config.json doit contenir un tableau')
    return apps
  } catch (e) {
    console.error('[launcher] Lecture config impossible:', e)
    return []
  }
}

/** Exécute une commande systemctl et renvoie { ok, out } */
function systemctl(
  action: 'start' | 'stop' | 'is-active',
  service: string
): Promise<{ ok: boolean; out: string }> {
  // start/stop nécessitent les privilèges → sudo (sudoers NOPASSWD requis).
  // is-active est en lecture seule → pas de sudo.
  const needsSudo = action === 'start' || action === 'stop'
  const cmd = needsSudo ? 'sudo' : 'systemctl'
  const args = needsSudo ? ['systemctl', action, service] : [action, service]
  return new Promise((resolve) => {
    const child = spawn(cmd, args)
    let out = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (out += d.toString()))
    child.on('close', (code) => resolve({ ok: code === 0, out: out.trim() }))
    child.on('error', (e) => resolve({ ok: false, out: String(e) }))
  })
}

/** Arrête TOUS les services d'apps — appelé au démarrage du launcher */
export async function stopAllApps(): Promise<void> {
  if (USE_SYSTEMD) {
    for (const a of loadApps()) {
      if (a.service) {
        const r = await systemctl('stop', a.service)
        console.log(`[launcher] stop ${a.service}:`, r.ok ? 'ok' : r.out)
      }
    }
  } else {
    for (const id of running.keys()) stopWindows(id)
  }
}

/**
 * Lance une application.
 * Linux  : systemctl start appX.service, puis arrêt du launcher (app.quit).
 * Windows: spawn de l'exe (test UI en dev).
 */
export async function launch(
  id: string,
  onExit: (state: AppState) => void
): Promise<AppState> {
  const cfg = loadApps().find((a) => a.id === id)
  if (!cfg) return { id, status: 'error', error: 'Application inconnue' }

  if (USE_SYSTEMD) {
    if (!cfg.service) return { id, status: 'error', error: 'Champ "service" manquant' }

    const r = await systemctl('start', cfg.service)
    if (!r.ok) return { id, status: 'error', error: r.out || 'Échec systemctl start' }

    // App lancée → on arrête le launcher (le service sort proprement, sans Restart)
    setTimeout(() => app.quit(), 400)
    return { id, status: 'running', pid: undefined }
  }

  // --- Dev Windows : spawn direct ---
  if (running.has(id)) return statusWindows(id)
  if (!cfg.exePath || !existsSync(cfg.exePath)) {
    return { id, status: 'error', error: `Exécutable introuvable: ${cfg.exePath}` }
  }
  try {
    const child = spawn(cfg.exePath, cfg.args ?? [], { stdio: 'ignore' })
    running.set(id, child)
    child.on('error', (err) => {
      running.delete(id)
      onExit({ id, status: 'error', error: err.message })
    })
    child.on('exit', () => {
      running.delete(id)
      onExit({ id, status: 'stopped' })
    })
    return { id, status: 'running', pid: child.pid }
  } catch (e) {
    running.delete(id)
    return { id, status: 'error', error: String(e) }
  }
}

/** Arrête une application (systemctl stop, ou kill en dev Windows) */
export async function stop(id: string): Promise<AppState> {
  const cfg = loadApps().find((a) => a.id === id)
  if (USE_SYSTEMD) {
    if (cfg?.service) await systemctl('stop', cfg.service)
    return { id, status: 'stopped' }
  }
  return stopWindows(id)
}

/** État courant d'une application */
export async function statusOf(id: string): Promise<AppState> {
  const cfg = loadApps().find((a) => a.id === id)
  if (USE_SYSTEMD) {
    if (!cfg?.service) return { id, status: 'stopped' }
    const r = await systemctl('is-active', cfg.service)
    return { id, status: r.out === 'active' ? 'running' : 'stopped' }
  }
  return statusWindows(id)
}

/** États de toutes les applications */
export async function allStatuses(): Promise<AppState[]> {
  return Promise.all(loadApps().map((a) => statusOf(a.id)))
}

// ----- Helpers dev Windows -----
function statusWindows(id: string): AppState {
  const proc = running.get(id)
  return proc ? { id, status: 'running', pid: proc.pid } : { id, status: 'stopped' }
}

function stopWindows(id: string): AppState {
  const proc = running.get(id)
  if (proc) {
    try {
      if (proc.pid) spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'])
    } catch (e) {
      console.error('[launcher] stop error:', e)
    }
    running.delete(id)
  }
  return { id, status: 'stopped' }
}

/** Arrête tous les process spawn en dev (no-op sous systemd) */
export function stopAllSpawned(): void {
  if (!USE_SYSTEMD) for (const id of running.keys()) stopWindows(id)
}

export { LAUNCHER_SERVICE }
