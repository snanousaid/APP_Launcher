import { useEffect, useState, useCallback } from 'react'
import type { AppConfig, AppState, AppStatus } from '../types'

/**
 * Charge la liste des applications, suit leur état (lancée/arrêtée/erreur)
 * et expose les actions launch/stop.
 */
export function useApps(): {
  apps: AppConfig[]
  statusMap: Record<string, AppStatus>
  errors: Record<string, string | undefined>
  toggle: (id: string) => Promise<void>
} {
  const [apps, setApps] = useState<AppConfig[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, AppStatus>>({})
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const applyState = useCallback((s: AppState) => {
    setStatusMap((prev) => ({ ...prev, [s.id]: s.status }))
    setErrors((prev) => ({ ...prev, [s.id]: s.error }))
  }, [])

  // Chargement initial : apps + états + abonnement aux changements
  useEffect(() => {
    let unsub: (() => void) | undefined

    void (async () => {
      const list = await window.api.getApps()
      setApps(list)

      const statuses = await window.api.getStatuses()
      const map: Record<string, AppStatus> = {}
      for (const s of statuses) map[s.id] = s.status
      setStatusMap(map)

      // notifications du main (app fermée manuellement, crash, etc.)
      unsub = window.api.onStatus(applyState)
    })()

    return () => unsub?.()
  }, [applyState])

  // Lance ou arrête selon l'état courant
  const toggle = useCallback(
    async (id: string) => {
      const current = statusMap[id]
      const state =
        current === 'running' ? await window.api.stopApp(id) : await window.api.launchApp(id)
      applyState(state)
    },
    [statusMap, applyState]
  )

  return { apps, statusMap, errors, toggle }
}
