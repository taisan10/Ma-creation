import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
  // Verified contact details from the authenticated user.
  name: { type: String, required: true, trim: true, maxLength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true },
  
  // ⚠️ ARCHITECTURAL NOTICE (OAuth Checkout Fallback):
  // Razorpay and refund follow-ups require a contact phone number.
  // If an OAuth user creates an order without a phone in their profile,
  // frontend checkout dialog MUST prompt for phone and pass it in `req.body.phone`.
  phone: { type: String, required: true, trim: true },
  
  company: { type: String, trim: true, maxLength: 120 },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded', 'refund_failed'], default: 'created' },
  refundId: { type: String, index: true, default: null },
  refundedAt: { type: Date, default: null },
  verifiedAt: Date,
  rawWebhook: Object
}, { timestamps: true })

// schema.index({ user: 1, plan: 1, status: 1 });
// schema.index({ user: 1, status: 1 });

export default mongoose.model('Payment', schema)
