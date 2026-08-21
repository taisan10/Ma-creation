import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import * as c from '../controllers/paymentController.js'

const router = Router()

const orderSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(2, 'Name is required').max(80),
  email: z.string().email('A valid email is required'),
  phone: z.string().min(8, 'A valid phone number is required').max(20),
  company: z.string().max(120).optional()
})

// No `authenticate` requirement any more -- checkout works for guests.
// `optionalAuthenticate` still attaches req.user when a valid token is sent,
// so a logged-in customer's payment stays linked to their account too.
router.post('/order', optionalAuthenticate, validate(orderSchema), asyncHandler(c.createOrder))
router.post('/verify', optionalAuthenticate, validate(z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string()
})), asyncHandler(c.verifyPayment))
router.post('/failed', optionalAuthenticate, validate(z.object({ razorpay_order_id: z.string() })), asyncHandler(c.markFailed))
router.get('/mine', authenticate, asyncHandler(c.myPayments))

export default router
