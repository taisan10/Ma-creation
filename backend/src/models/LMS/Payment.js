import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
  // Verified contact details from the authenticated user.
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
