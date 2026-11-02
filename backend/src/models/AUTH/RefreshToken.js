import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['WEB', 'MOBILE_IOS', 'MOBILE_ANDROID'],
      default: 'WEB',
    },
    deviceLabel: {
      type: String,
      default: 'Unknown Device',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedReason: {
      type: String, // e.g., 'USER_LOGOUT', 'TOKEN_ROTATION', 'REPLACED_SESSION', 'PASSWORD_CHANGE'
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL cleanup
    },
  },
  { timestamps: true }
)

export default mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema)
