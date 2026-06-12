import { LayoutGrid } from 'lucide-react'
import AppCard from './components/AppCard'
import { useApps } from './hooks/useApps'

function App(): JSX.Element {
  const { apps, statusMap, errors, toggle } = useApps()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* En-tête */}
      <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/50 px-8 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-blue-500">APP</span>
              <span className="text-white"> Launcher</span>
            </h1>
            <p className="text-xs text-slate-500">Contrôle des applications</p>
          </div>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {apps.length} application{apps.length > 1 ? 's' : ''}
        </span>
      </header>

      {/* Grille des applications */}
      <main className="flex-1 overflow-y-auto p-8">
        {apps.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Aucune application configurée. Vérifiez apps.config.json
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                status={statusMap[app.id] ?? 'stopped'}
                error={errors[app.id]}
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
