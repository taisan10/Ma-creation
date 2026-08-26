const clients = new Set()
const MAX_SSE_CLIENTS = 100
const MAX_SSE_LIFETIME_MS = 60 * 60 * 1000 // 1 hour

export function addRealtimeClient(res) {
  if (clients.size >= MAX_SSE_CLIENTS) {
    res.status(429).json({ success: false, message: 'Too many connections' })
    return
  }
  clients.add(res)
  const heartbeat = setInterval(() => {
    try { res.write(': keepalive\n\n') } catch { clearInterval(heartbeat); clients.delete(res) }
  }, 25000)
  heartbeat.unref?.()

  const lifetime = setTimeout(() => { cleanup() }, MAX_SSE_LIFETIME_MS)
  lifetime.unref?.()

  const cleanup = () => {
    clearInterval(heartbeat)
    clearTimeout(lifetime)
    clients.delete(res)
  }
  res.on('close', cleanup)
  res.on('error', cleanup)
}

export function broadcastCmsUpdate(payload = {}) {
  const message = `event: cms:updated\ndata: ${JSON.stringify({
    resource: payload.resource || 'site',
    action: payload.action || 'updated',
    key: payload.key || null,
    timestamp: new Date().toISOString(),
  })}\n\n`

  for (const client of clients) {
    try { client.write(message) } catch { clients.delete(client) }
  }
}
