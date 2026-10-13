import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    type: {
      type: String,
      required: true,
      enum: ['recording_suspected', 'screenshot_suspected', 'incognito_suspected', 'blur_suspected'],
      default: 'recording_suspected',
    },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    lastWatchedSeconds: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending_review', 'approved_unlocked', 'plan_revoked', 'user_banned'],
      default: 'pending_review',
      index: true,
    },
    resolvedAt: { type: Date, default: null },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNotes: { type: String, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('SecurityIncident', schema)
