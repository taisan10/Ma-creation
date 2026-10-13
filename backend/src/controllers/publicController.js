import { PublicService } from '../services/public.service.js'
import { addRealtimeClient } from '../services/realtime.js'

export async function getPage(req, res) {
  const page = await PublicService.getPageBySlug(req.params.slug)
  res.json({ success: true, page })
}

export async function getFaqs(req, res) {
  const faqs = await PublicService.getActiveFaqs()
  res.json({ success: true, faqs })
}

export async function getPartners(req, res) {
  const partners = await PublicService.getActivePartners()
  res.json({ success: true, partners })
}

export async function getSetting(req, res) {
  const setting = await PublicService.getSiteSetting(req.params.key)
  res.json({ success: true, setting })
}

export function events(req, res) {
  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()
  res.write(': connected\n\n')
  addRealtimeClient(res)
}
