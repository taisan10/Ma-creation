import crypto from 'crypto'
import Razorpay from 'razorpay'
import Plan from '../models/Plan.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError('Razorpay test keys are not configured on the server', 503, 'PAYMENTS_NOT_CONFIGURED')
  }
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret })
}

export class PaymentService {
  /**
   * Create Razorpay order and save pending Payment document
   */
  static async createOrder({ planId, name, email, phone, company, userId }) {
    const plan = await Plan.findOne({ _id: planId, active: true })
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND')

    const ownershipQuery = {
      plan: plan._id,
      status: 'paid',
      $or: [
        ...(userId ? [{ user: userId }] : []),
        { email },
      ],
    }
    const existing = await Payment.findOne(ownershipQuery)
    if (existing) throw new AppError('You have already purchased this plan', 409, 'ALREADY_PURCHASED')

    let order
    try {
      order = await getRazorpayClient().orders.create({
        amount: Math.round(plan.price * 100),
        currency: 'INR',
        receipt: `mac_${Date.now()}`,
        notes: { planId: plan._id.toString(), userId: userId || 'guest', email },
      })
    } catch (err) {
      if (err?.statusCode === 400 && err?.error?.code === 'DUPLICATE_ORDER') {
        throw new AppError('A payment is already in progress for this plan', 409, 'ALREADY_PURCHASED')
      }
      throw err
    }

    const payment = await Payment.create({
      user: userId || undefined,
      plan: plan._id,
      name,
      email,
      phone,
      company,
      razorpayOrderId: order.id,
      amount: plan.price,
    })

    return {
      keyId: env.razorpayKeyId,
      order,
      paymentId: payment._id,
      plan: { id: plan._id, name: plan.name, price: plan.price },
    }
  }

  /**
   * Verify Razorpay payment signature and mark payment paid
   */
  static async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    if (!env.razorpayKeySecret) throw new AppError('Razorpay secret is not configured', 503, 'PAYMENTS_NOT_CONFIGURED')

    const expected = crypto
      .createHmac('sha256', env.razorpayKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    const sigBuf = Buffer.from(razorpaySignature || '', 'utf8')
    const expBuf = Buffer.from(expected, 'utf8')

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(expBuf, sigBuf)) {
      throw new AppError('Payment signature verification failed', 400, 'INVALID_SIGNATURE')
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId, status: 'created' },
      { razorpayPaymentId, status: 'paid', verifiedAt: new Date() },
      { new: true }
    ).populate('plan', 'name price billing duration features')

    if (!payment) throw new AppError('Payment record not found for this order', 404, 'NOT_FOUND')

    return payment
  }

  /**
   * Mark a payment as failed
   */
  static async markPaymentFailed(razorpayOrderId) {
    await Payment.findOneAndUpdate(
      { razorpayOrderId, status: 'created' },
      { status: 'failed' },
      { new: true }
    )
  }

  /**
   * Fetch customer payment history with guest linking
   */
  static async getUserPayments(userId) {
    const user = await User.findById(userId).select('email name phone company')
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const payments = await Payment.find({
      status: 'paid',
      $or: [{ user: user._id }, { user: { $exists: false }, email: user.email }, { user: null, email: user.email }],
    })
      .populate('plan', 'name price billing duration features category')
      .sort({ createdAt: -1 })
      .limit(100)

    const unlinked = payments.filter(p => !p.user)
    if (unlinked.length) {
      await Payment.updateMany({ _id: { $in: unlinked.map(p => p._id) } }, { $set: { user: user._id } })
      unlinked.forEach(p => { p.user = user._id })
    }

    return { payments, user }
  }

  /**
   * Process incoming Razorpay webhook
   */
  static async handleWebhook(rawBody, signature, event, entity) {
    if (!env.razorpayWebhookSecret || !signature) {
      throw new AppError('Webhook signature missing', 400, 'BAD_REQUEST')
    }

    const expected = crypto.createHmac('sha256', env.razorpayWebhookSecret).update(rawBody).digest('hex')
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new AppError('Invalid webhook signature', 400, 'BAD_REQUEST')
    }

    if (event === 'payment.captured' && entity?.order_id) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id, status: 'created' },
        { razorpayPaymentId: entity.id, status: 'paid', verifiedAt: new Date() }
      )
    }

    if (event === 'payment.failed' && entity?.order_id) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id, status: 'created' },
        { status: 'failed' }
      )
    }
  }
}
