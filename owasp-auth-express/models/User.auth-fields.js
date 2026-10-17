import mongoose from 'mongoose'

/**
 * These fields must be included in your Mongoose User schema to support
 * OWASP Level 2 Lockout with Exponential Backoff and Account Lifecycle controls.
 */
export const authUserSchemaFields = {
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Never return passwordHash in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'manager'],
    default: 'customer',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
}

/**
 * Complete standalone User schema example for quick reference.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minLength: 2, maxLength: 80 },
    ...authUserSchemaFields,
    phone: { type: String, trim: true },
    company: { type: String, trim: true, maxLength: 120 },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model('User', userSchema)
