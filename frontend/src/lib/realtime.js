const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

let source = null
let listeners = new Set()
let currentRevision = 0

function connect() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return
  if (source && source.readyState !== EventSource.CLOSED) return

  source = new EventSource(`${API_URL}/public/events`)
  source.addEventListener('cms:updated', (event) => {
    let detail = {}
    try { detail = JSON.parse(event.data || '{}') } catch {}
    currentRevision += 1
    listeners.forEach(listener => listener({ ...detail, revision: currentRevision }))
  })
  source.onerror = () => {
    // EventSource retries automatically. If the browser closes it permanently,
    // allow the next subscriber to create a fresh connection.
    if (source?.readyState === EventSource.CLOSED) {
      source.close()
      source = null
    }
  }
}

export function subscribeToLiveUpdates(listener) {
  listeners.add(listener)
  connect()
  return () => listeners.delete(listener)
}

export function getLiveRevision() { return currentRevision }
