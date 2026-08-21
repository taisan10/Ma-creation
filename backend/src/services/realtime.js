const clients = new Set()

export function addRealtimeClient(res) {
  clients.add(res)
  const heartbeat = setInterval(() => {
    try { res.write(': keepalive\n\n') } catch { clearInterval(heartbeat); clients.delete(res) }
  }, 25000)
  heartbeat.unref?.()

  const cleanup = () => {
    clearInterval(heartbeat)
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
