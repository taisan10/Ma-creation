import { LeadService } from '../services/lead.service.js'

export async function createLead(req, res) {
  const lead = await LeadService.createLead(req.body)
  res.status(201).json({ success: true, lead })
}

export async function listLeads(req, res) {
  const leads = await LeadService.getLeadsList()
  res.json({ success: true, leads })
}
