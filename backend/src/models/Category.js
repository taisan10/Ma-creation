import mongoose from 'mongoose'

// A Category is purely organizational -- it groups Courses for display
// (e.g. "GeM Registration", "MSME", "Startup India"), independent of which
// Plan unlocks which Course. This mirrors how your existing Service/Plan
// models use a free-text `category` field, but here we make it a real
// collection since courses will need admin-manageable ordering + a
// thumbnail/description for the unlock page grid.
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxLength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, maxLength: 500 },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('Category', schema)