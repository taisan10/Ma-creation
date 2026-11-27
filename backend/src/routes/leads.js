import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { leadLimiter } from '../middleware/rateLimiter.js'
import { createLeadSchema } from '../validators/lead.validator.js'
import * as c from '../controllers/leadController.js'

const router = Router()

router.post('/', leadLimiter, validate(createLeadSchema), asyncHandler(c.createLead))
router.get('/', authenticate, requireAdmin, asyncHandler(c.listLeads))

export default router
