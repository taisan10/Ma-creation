import { z } from 'zod'

export const createOrderSchema = z.object({
  planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID'),
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(120).optional(),
})

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
  razorpay_signature: z.string().min(1, 'Razorpay signature is required'),
})

export const markFailedSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
})

