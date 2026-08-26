import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxLength: 180 },
  description: { type: String, trim: true, maxLength: 2000, default: '' },
  filename: { type: String, required: true, trim: true, maxLength: 255 },
  mimeType: { type: String, required: true, default: 'application/pdf' },
  size: { type: Number, required: true, min: 1 },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  coverImageUrl: { type: String, trim: true, default: '/assets/gem-book-cover.png' },
  active: { type: Boolean, default: true, index: true },
  downloads: { type: Number, default: 0, min: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.model('Book', schema)
