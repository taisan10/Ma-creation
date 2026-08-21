import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  // Mandatory contact details captured on the "Buy Now" form before the
  // Razorpay checkout opens. Kept on the Payment record itself so admins can
  // follow up even when the buyer isn't a logged-in / registered user, and
  // even if they abandon checkout before paying.
  name: { type: String, required: true, trim: true, maxLength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  company: { type: String, trim: true, maxLength: 120 },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  verifiedAt: Date,
  rawWebhook: Object
}, { timestamps: true })
export default mongoose.model('Payment', schema)
