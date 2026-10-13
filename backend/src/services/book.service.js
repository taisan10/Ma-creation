import mongoose from 'mongoose'
import Book from '../models/Book.js'
import { AppError } from '../utils/AppError.js'

const MAX_BOOK_BYTES = 50 * 1024 * 1024
const DEFAULT_COVER = '/assets/gem-book-cover.png'

export function getBucket() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new AppError('Database is not connected', 503, 'DATABASE_UNAVAILABLE')
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'books' })
}

export function cleanFilename(value = 'gem-guide.pdf') {
  return String(value).replace(/[\u0000-\u001f\u007f\/\\:*?"<>|]/g, '_').trim().slice(0, 180) || 'gem-guide.pdf'
}

export function contentDispositionFilename(value) {
  const filename = cleanFilename(value)
  const fallback = filename.replace(/[^a-zA-Z0-9._ -]/g, '_') || 'gem-guide.pdf'
  return `attachment; filename="${fallback.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

function uploadBuffer(buffer, filename, contentType, metadata) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket()
    const upload = bucket.openUploadStream(filename, { contentType, metadata })
    upload.on('error', reject)
    upload.on('finish', () => resolve(upload.id))
    upload.end(buffer)
  })
}

export class BookService {
  /**
   * Get the active public book with read & download links
   */
  static async getPublicBook() {
    const book = await Book.findOne({ active: true }).sort({ createdAt: -1 }).lean()
    if (!book) return null
    return {
      ...book,
      readUrl: `/api/public/books/${book._id}/read`,
      downloadUrl: `/api/public/books/${book._id}/download`,
    }
  }

  /**
   * Fetch active book and verify GridFS file exists for streaming
   */
  static async getBookForStream(id) {
    const book = await Book.findOne({ _id: id, active: true })
    if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')

    const bucket = getBucket()
    const fileId = new mongoose.Types.ObjectId(book.fileId)
    const files = await bucket.find({ _id: fileId }).toArray()
    if (!files.length) throw new AppError('Book file is unavailable', 404, 'FILE_NOT_FOUND')

    return { book, file: files[0], fileId, bucket }
  }

  static async incrementDownloads(bookId) {
    await Book.updateOne({ _id: bookId }, { $inc: { downloads: 1 } }).catch(() => {})
  }

  /**
   * List all books for admin
   */
  static async listBooks() {
    return await Book.find().sort({ createdAt: -1 }).populate('uploadedBy', 'name email').lean()
  }

  /**
   * Upload and create a new book
   */
  static async createBook(file, body, uploadedBy) {
    if (!file?.buffer?.length) throw new AppError('Please choose a PDF book file.', 400, 'BOOK_FILE_REQUIRED')
    if (file.size > MAX_BOOK_BYTES) throw new AppError('Book file is too large. Maximum size is 50 MB.', 413, 'BOOK_TOO_LARGE')

    const mimeType = String(file.mimetype || '').split(';')[0].toLowerCase()
    const looksLikePdf = file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
    if (mimeType !== 'application/pdf' || !looksLikePdf) {
      throw new AppError('Only valid PDF books are supported', 415, 'INVALID_BOOK_TYPE')
    }

    const title = String(body?.title || '').trim()
    if (!title || title.length > 180) throw new AppError('A valid book title is required', 400, 'BOOK_TITLE_REQUIRED')

    const filename = cleanFilename(body?.filename || file.originalname || 'gem-guide.pdf')
    const description = String(body?.description || '').trim().slice(0, 2000)
    const coverImageUrl = String(body?.coverImageUrl || DEFAULT_COVER).trim() || DEFAULT_COVER
    const active = String(body?.active ?? 'true') !== 'false'

    const fileId = await uploadBuffer(file.buffer, filename, 'application/pdf', { title, uploadedBy })
    return await Book.create({
      title,
      description,
      filename,
      mimeType: 'application/pdf',
      size: file.size,
      fileId,
      coverImageUrl,
      active,
      uploadedBy,
    })
  }

  /**
   * Update an existing book's metadata
   */
  static async updateBook(id, body) {
    const allowed = ['title', 'description', 'coverImageUrl', 'active']
    const data = {}
    for (const key of allowed) if (body[key] !== undefined) data[key] = body[key]
    if (data.title !== undefined) data.title = String(data.title).trim().slice(0, 180)
    if (!data.title && body.title !== undefined) throw new AppError('Book title cannot be empty', 400, 'BOOK_TITLE_REQUIRED')

    const book = await Book.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')
    return book
  }

  /**
   * Delete book document and corresponding GridFS file
   */
  static async deleteBook(id) {
    const book = await Book.findById(id)
    if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')

    try {
      await getBucket().delete(new mongoose.Types.ObjectId(book.fileId))
    } catch {
      // GridFS file may already be deleted
    }

    await book.deleteOne()
  }
}
