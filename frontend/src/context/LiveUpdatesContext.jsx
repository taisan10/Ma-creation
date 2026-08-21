import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getLiveRevision, subscribeToLiveUpdates } from '../lib/realtime'

const LiveUpdatesContext = createContext({ revision: 0, lastUpdate: null })

export function LiveUpdatesProvider({ children }) {
  const [revision, setRevision] = useState(getLiveRevision())
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => subscribeToLiveUpdates(event => {
    setRevision(event.revision)
    setLastUpdate(event)
  }), [])

  const value = useMemo(() => ({ revision, lastUpdate }), [revision, lastUpdate])
  return <LiveUpdatesContext.Provider value={value}>{children}</LiveUpdatesContext.Provider>
}

export function useLiveUpdates() { return useContext(LiveUpdatesContext) }
