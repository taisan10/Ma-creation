import mongoose from 'mongoose'
// backend/src/models/User.js me schema fields me ye add karein:
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minLength: 2, maxLength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true },
  company: { type: String, trim: true, maxLength: 120 },
  passwordHash: { type: String, required: true },
  interest: { type: String, trim: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

  // 👇 OWASP Level 2+ ke liye yeh 4 fields add karein:
  isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },

  // Video DRM & Screen Recording Defense
  playbackLocked: { type: Boolean, default: false },
  playbackLockedAt: { type: Date, default: null },
  recordingStrikes: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model('User',schema)
