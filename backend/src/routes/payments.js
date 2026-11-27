import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { refundLimiter } from '../middleware/rateLimiter.js'
import { createOrderSchema, verifyPaymentSchema, markFailedSchema, createRefundTicketSchema } from '../validators/payment.validator.js'
import * as c from '../controllers/paymentController.js'
import * as refundController from '../controllers/refundController.js'

const router = Router()

// All payment endpoints require an authenticated user session
router.post('/order', authenticate, validate(createOrderSchema), asyncHandler(c.createOrder))
router.post('/verify', authenticate, validate(verifyPaymentSchema), asyncHandler(c.verifyPayment))
router.post('/failed', authenticate, validate(markFailedSchema), asyncHandler(c.markFailed))
router.get('/mine', authenticate, asyncHandler(c.myPayments))

// Student Refund Ticket (5 requests / 15 minutes per IP)
router.post('/refund', authenticate, refundLimiter, validate(createRefundTicketSchema), asyncHandler(refundController.createTicket))

export default router
