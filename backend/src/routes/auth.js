import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { refreshCsrfGuard } from '../middleware/refreshCsrf.guard.js'
import { loginRateLimiter } from '../middleware/loginRateLimiter.js'
import * as c from '../controllers/authController.js'
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator.js'

const router = Router()

router.post('/register',loginRateLimiter,  validate(registerSchema), asyncHandler(c.register))
router.post('/login', loginRateLimiter, validate(loginSchema), asyncHandler(c.login))
router.post('/refresh', refreshCsrfGuard, asyncHandler(c.refresh))
router.post('/logout', authenticate, refreshCsrfGuard, asyncHandler(c.logout))
router.post('/logout-all', authenticate, asyncHandler(c.logoutAll))
router.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(c.changePassword))
router.get('/me', authenticate, asyncHandler(c.me))

export default router
