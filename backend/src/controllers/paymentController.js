import crypto from 'crypto'
import Razorpay from 'razorpay'
import Plan from '../models/Plan.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

function client() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) throw new AppError('Razorpay test keys are not configured on the server', 503, 'PAYMENTS_NOT_CONFIGURED')
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret })
}

export async function createOrder(req, res) {
  const { planId, name, email, phone, company } = req.body
  const plan = await Plan.findOne({ _id: planId, active: true })
  if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND')

  const order = await client().orders.create({
    amount: Math.round(plan.price * 100),
    currency: 'INR',
    receipt: `mac_${Date.now()}`,
    notes: { planId: plan._id.toString(), userId: req.user?.sub || 'guest', email }
  })

  const payment = await Payment.create({
    user: req.user?.sub || undefined,
    plan: plan._id,
    name,
    email,
    phone,
    company,
    razorpayOrderId: order.id,
    amount: plan.price
  })

  res.status(201).json({
    success: true,
    keyId: env.razorpayKeyId,
    order,
    paymentId: payment._id,
    plan: { id: plan._id, name: plan.name, price: plan.price }
  })
}

export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const expected = crypto.createHmac('sha256', env.razorpayKeySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
  if (expected !== razorpay_signature) throw new AppError('Payment signature verification failed', 400, 'INVALID_SIGNATURE')
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    { razorpayPaymentId: razorpay_payment_id, status: 'paid', verifiedAt: new Date() },
    { new: true }
  ).populate('plan', 'name price billing duration features')
  if (!payment) throw new AppError('Payment record not found for this order', 404, 'NOT_FOUND')
  res.json({ success: true, verified: true, payment })
}

export async function markFailed(req, res) {
  const { razorpay_order_id } = req.body
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id, status: 'created' },
    { status: 'failed' },
    { new: true }
  )
  res.json({ success: true, payment: payment || null })
}

export async function myPayments(req, res) {
  const user = await User.findById(req.user.sub).select('email name phone company')
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

  // Include older guest purchases made with the same verified account email.
  // This makes a purchase appear in the customer's account even if they paid
  // before registering/logging in.
  const payments = await Payment.find({
    status: 'paid',
    $or: [{ user: user._id }, { user: { $exists: false }, email: user.email }, { user: null, email: user.email }]
  })
    .populate('plan', 'name price billing duration features category')
    .sort({ createdAt: -1 })
    .limit(100)

  const unlinked = payments.filter(p => !p.user)
  if (unlinked.length) {
    await Payment.updateMany({ _id: { $in: unlinked.map(p => p._id) } }, { $set: { user: user._id } })
    unlinked.forEach(p => { p.user = user._id })
  }

  res.json({ success: true, payments, user })
}

export async function webhook(req, res) {
  const signature = req.headers['x-razorpay-signature']
  if (!env.razorpayWebhookSecret || !signature) return res.status(400).json({ success: false, message: 'Webhook signature missing' })
  const expected = crypto.createHmac('sha256', env.razorpayWebhookSecret).update(req.rawBody).digest('hex')
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' })
  }
  const event = req.body?.event
  const entity = req.body?.payload?.payment?.entity
  if (event === 'payment.captured' && entity?.order_id) {
    await Payment.findOneAndUpdate({ razorpayOrderId: entity.order_id }, { razorpayPaymentId: entity.id, status: 'paid', rawWebhook: req.body, verifiedAt: new Date() })
  }
  if (event === 'payment.failed' && entity?.order_id) {
    await Payment.findOneAndUpdate({ razorpayOrderId: entity.order_id, status: 'created' }, { status: 'failed', rawWebhook: req.body })
  }
  res.json({ success: true })
}
