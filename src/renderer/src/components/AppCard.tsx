import { Play, Square, AlertCircle, type LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { AppConfig, AppStatus } from '../types'

interface AppCardProps {
  app: AppConfig
  status: AppStatus
  error?: string
  onToggle: (id: string) => void
}

/** Résout dynamiquement une icône lucide-react par son nom (depuis la config) */
function resolveIcon(name?: string): LucideIcon {
  if (name && name in Icons) {
    return (Icons as unknown as Record<string, LucideIcon>)[name]
  }
  return Icons.AppWindow
}

export default function AppCard({ app, status, error, onToggle }: AppCardProps): JSX.Element {
  const running = status === 'running'
  const hasError = status === 'error'
  const Icon = resolveIcon(app.icon)
  const color = app.color ?? '#3b82f6'

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-slate-900 p-6 transition-all duration-200 ${
        running ? 'border-green-500/60 shadow-lg shadow-green-500/10' : 'border-slate-700'
      }`}
    >
      {/* Badge d'état */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            running ? 'bg-green-500' : hasError ? 'bg-red-500' : 'bg-slate-600'
          }`}
          style={running ? { boxShadow: '0 0 8px rgba(34,197,94,0.7)' } : undefined}
        />
        <span className="text-xs font-medium text-slate-400">
          {running ? 'En cours' : hasError ? 'Erreur' : 'Arrêtée'}
        </span>
      </div>

      {/* Icône */}
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}22` }}
      >
        <Icon size={28} style={{ color }} />
      </div>

      {/* Texte */}
      <h3 className="text-lg font-bold text-white">{app.name}</h3>
      {app.description && <p className="mt-1 text-sm text-slate-400">{app.description}</p>}

      {hasError && error && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* Bouton lancer/arrêter */}
      <button
        onClick={() => onToggle(app.id)}
        className={`mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
          running
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {running ? <Square size={16} /> : <Play size={16} />}
        {running ? 'Arrêter' : 'Lancer'}
      </button>
    </div>
  )
}
