import { LayoutGrid } from 'lucide-react'
import { Toaster } from 'sonner'
import AppCard from './components/AppCard'
import { useApps } from './hooks/useApps'

function App(): JSX.Element {
  const { apps, statusMap, toggle } = useApps()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Notifications (erreurs, etc.) */}
      <Toaster theme="dark" richColors position="top-center" />

      {/* En-tête */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800/60 bg-slate-950/50 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <LayoutGrid size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-blue-500">APP</span>
              <span className="text-white"> Launcher</span>
            </h1>
            <p className="text-[11px] text-slate-500">Contrôle des applications</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {apps.length} application{apps.length > 1 ? 's' : ''}
        </span>
      </header>

      {/* Grille des applications — remplit l'écran sans scroll */}
      <main className="flex-1 overflow-hidden p-4">
        {apps.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Aucune application configurée. Vérifiez apps.config.json
          </div>
        ) : (
          <div className="grid h-full auto-rows-fr grid-cols-2 gap-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                status={statusMap[app.id] ?? 'stopped'}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
