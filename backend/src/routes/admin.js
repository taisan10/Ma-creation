import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import {
  updateUserSchema,
  updateLeadStatusSchema,
  upsertSettingSchema,
  resolveIncidentSchema,
} from '../validators/admin.validator.js'
import * as c from '../controllers/adminController.js'
import * as refundController from '../controllers/refundController.js'

const router = Router()
router.use(authenticate, requireAdmin)

router.get('/dashboard', asyncHandler(c.dashboard))
router.get('/users', asyncHandler(c.listUsers))


router.get('/leads', asyncHandler(c.listLeads))
router.patch('/leads/:id', validate(updateLeadStatusSchema), asyncHandler(c.updateLead))
router.delete('/leads/:id', asyncHandler(c.deleteLead))

router.get('/payments', asyncHandler(c.listPayments))

router.get('/resources/:resource', asyncHandler(c.listResource))
router.post('/resources/:resource', asyncHandler(c.createResource))
router.patch('/resources/:resource/:id', asyncHandler(c.updateResource))
router.delete('/resources/:resource/:id', asyncHandler(c.deleteResource))

router.get('/settings/:key', asyncHandler(c.getSetting))
router.put('/settings/:key', validate(upsertSettingSchema), asyncHandler(c.upsertSetting))

// Security & Screen Recording Incidents Management
router.get('/security-incidents', asyncHandler(c.listSecurityIncidents))
router.post('/security-incidents/:id/resolve', validate(resolveIncidentSchema), asyncHandler(c.resolveSecurityIncident))
router.post('/security-incidents/:id/revoke-plan', validate(resolveIncidentSchema), asyncHandler(c.revokePlanFromIncident))
router.post('/security-incidents/:id/ban-user', validate(resolveIncidentSchema), asyncHandler(c.banUserFromIncident))

// Refund Tickets Management
router.get('/refunds', asyncHandler(refundController.listTickets))
router.post('/refunds/:id/approve', validate(resolveIncidentSchema), asyncHandler(refundController.approveRefund))
router.post('/refunds/:id/reject', validate(resolveIncidentSchema), asyncHandler(refundController.rejectRefund))

export default router
