import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { createLeadSchema } from '../validators/lead.validator.js'
import * as c from '../controllers/leadController.js'

const router = Router()

const leadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
})

router.post('/', leadRateLimit, validate(createLeadSchema), asyncHandler(c.createLead))
router.get('/', authenticate, requireAdmin, asyncHandler(c.listLeads))

export default router
