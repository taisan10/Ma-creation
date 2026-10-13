import { CatalogService } from '../services/catalog.service.js'

export async function listServices(req, res) {
  const services = await CatalogService.getActiveServices()
  res.json({ success: true, services })
}

export async function listPlans(req, res) {
  const plans = await CatalogService.getActivePlans()
  res.json({ success: true, plans })
}
