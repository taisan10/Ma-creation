import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },
    status: {
      type: String,
      enum: ['pending_review', 'processing', 'approved', 'rejected', 'cancelled'],
      default: 'pending_review',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxLength: 500,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    razorpayRefundId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
)



export default mongoose.model('RefundTicket', schema)