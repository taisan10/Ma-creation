import { AdminService } from '../services/admin.service.js'

export async function dashboard(req, res) {
  const stats = await AdminService.getDashboardStats()
  res.json({ success: true, stats })
}

export async function listUsers(req, res) {
  const users = await AdminService.listUsers()
  res.json({ success: true, users })
}

export async function updateUser(req, res) {
  const user = await AdminService.updateUser(req.user.sub, req.params.id, req.body)
  res.json({ success: true, user })
}

export async function deleteUser(req, res) {
  await AdminService.deleteUser(req.user.sub, req.params.id)
  res.json({ success: true })
}

export async function listLeads(req, res) {
  const leads = await AdminService.listLeads()
  res.json({ success: true, leads })
}

export async function updateLead(req, res) {
  const lead = await AdminService.updateLead(req.params.id, req.body)
  res.json({ success: true, lead })
}

export async function deleteLead(req, res) {
  await AdminService.deleteLead(req.params.id)
  res.json({ success: true })
}

export async function listPayments(req, res) {
  const payments = await AdminService.listPayments()
  res.json({ success: true, payments })
}

export async function listResource(req, res) {
  const items = await AdminService.listResource(req.params.resource)
  res.json({ success: true, items })
}

export async function createResource(req, res) {
  const item = await AdminService.createResource(req.params.resource, req.body)
  res.status(201).json({ success: true, item })
}

export async function updateResource(req, res) {
  const item = await AdminService.updateResource(req.params.resource, req.params.id, req.body)
  res.json({ success: true, item })
}

export async function deleteResource(req, res) {
  await AdminService.deleteResource(req.params.resource, req.params.id)
  res.json({ success: true })
}

export async function getSetting(req, res) {
  const setting = await AdminService.getSetting(req.params.key)
  res.json({ success: true, setting })
}

export async function upsertSetting(req, res) {
  const setting = await AdminService.upsertSetting(req.params.key, req.body.value)
  res.json({ success: true, setting })
}

export async function listSecurityIncidents(req, res) {
  const incidents = await AdminService.listSecurityIncidents(req.query.status)
  res.json({ success: true, incidents })
}

export async function resolveSecurityIncident(req, res) {
  const incident = await AdminService.approveIncidentAndUnlockPlayback(
    req.user.sub,
    req.params.id,
    req.body.adminNotes
  )
  res.json({ success: true, incident })
}

export async function revokePlanFromIncident(req, res) {
  const incident = await AdminService.revokePlanFromIncident(
    req.user.sub,
    req.params.id,
    req.body.adminNotes
  )
  res.json({ success: true, incident })
}

export async function banUserFromIncident(req, res) {
  const incident = await AdminService.banUserFromIncident(
    req.user.sub,
    req.params.id,
    req.body.adminNotes
  )
  res.json({ success: true, incident })
}
