import { PaymentService } from '../services/payment.service.js'

export async function createOrder(req, res) {
  const result = await PaymentService.createOrder({
    ...req.body,
    userId: req.user?.sub,
  })
  res.status(201).json({ success: true, ...result })
}

export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const payment = await PaymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
  res.json({ success: true, verified: true, payment })
}

export async function markFailed(req, res) {
  await PaymentService.markPaymentFailed(req.body.razorpay_order_id)
  res.json({ success: true })
}

export async function myPayments(req, res) {
  const { payments, user } = await PaymentService.getUserPayments(req.user.sub)
  res.json({ success: true, payments, user })
}

export async function webhook(req, res) {
  const signature = req.headers['x-razorpay-signature']
  const event = req.body?.event
  const entity = req.body?.payload?.payment?.entity

  await PaymentService.handleWebhook(req.rawBody, signature, event, entity)
  res.json({ success: true })
}
