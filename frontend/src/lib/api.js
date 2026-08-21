// Prefer same-origin /api in Vite + production deployments. Set VITE_API_URL only when the API is hosted separately.
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504])

export async function api(path, options = {}) {
  const token = localStorage.getItem('mac_token')
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const isBinaryBody = options.body instanceof ArrayBuffer || ArrayBuffer.isView(options.body)
  const headers = { ...((options.body && !isFormData && !isBinaryBody) ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const maxAttempts = options.retry === false || options.method && options.method !== 'GET' ? 1 : 2
  const requestOptions = { ...options }
  delete requestOptions.retry

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response
    try {
      response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers })
    } catch (networkErr) {
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 350))
        continue
      }
      throw new Error('Could not reach the server. Please check that the backend API is running and try again.')
    }

    let data = {}
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : {}
    } catch {
      data = {}
    }

    if (response.ok) return data && typeof data === 'object' ? data : {}

    if (response.status === 401) {
      clearSession()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    if (attempt < maxAttempts && RETRYABLE_STATUS.has(response.status)) {
      const retryAfter = Number(response.headers.get('Retry-After') || 0)
      const delay = Math.min(Math.max(retryAfter * 1000, 350), 2000)
      await new Promise(resolve => setTimeout(resolve, delay))
      continue
    }

    const message = data.message || `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.code = data.code
    throw error
  }

  throw new Error('Request failed')
}

export function setSession(data) { localStorage.setItem('mac_token', data.token); localStorage.setItem('mac_user', JSON.stringify(data.user)) }
export function clearSession() { localStorage.removeItem('mac_token'); localStorage.removeItem('mac_user') }
export function getUser() { try { return JSON.parse(localStorage.getItem('mac_user') || 'null') } catch { return null } }
