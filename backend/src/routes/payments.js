import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import * as c from '../controllers/paymentController.js'

const router = Router()

const orderSchema = z.object({
  planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID'),
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(120).optional()
})

// All payment endpoints require an authenticated user session


router.post('/order', authenticate, validate(orderSchema), asyncHandler(c.createOrder))
router.post('/verify', authenticate, validate(z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string()
})), asyncHandler(c.verifyPayment))
router.post('/failed', authenticate, validate(z.object({ razorpay_order_id: z.string() })), asyncHandler(c.markFailed))
router.get('/mine', authenticate, asyncHandler(c.myPayments))

export default router
