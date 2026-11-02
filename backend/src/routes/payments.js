import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { createOrderSchema, verifyPaymentSchema, markFailedSchema } from '../validators/payment.validator.js'
import * as c from '../controllers/paymentController.js'

const router = Router()

// All payment endpoints require an authenticated user session
router.post('/order', authenticate, validate(createOrderSchema), asyncHandler(c.createOrder))
router.post('/verify', authenticate, validate(verifyPaymentSchema), asyncHandler(c.verifyPayment))
router.post('/failed', authenticate, validate(markFailedSchema), asyncHandler(c.markFailed))
router.get('/mine', authenticate, asyncHandler(c.myPayments))

export default router
