const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

let source = null
let listeners = new Set()
let currentRevision = 0
let reconnectTimeout = null

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
    if (source?.readyState === EventSource.CLOSED) {
      source.close()
      source = null
      // Reconnect with exponential backoff (1s, 2s, 4s, max 30s)
      if (listeners.size > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, Math.min(reconnectAttempts, 5)), 30000)
        reconnectTimeout = setTimeout(() => { reconnectAttempts++; connect() }, delay)
      }
    }
  }
}

let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 20

export function subscribeToLiveUpdates(listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    reconnectAttempts = 0
    connect()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && source) {
      clearTimeout(reconnectTimeout)
      source.close()
      source = null
    }
  }
}

export function getLiveRevision() { return currentRevision }
