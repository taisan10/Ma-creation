import mongoose from 'mongoose'
import Book from '../models/LMS/Book.js'
import { minioClient, VIDEO_BUCKET } from '../config/minio.js'
import { AppError } from '../utils/AppError.js'

const MAX_BOOK_BYTES = 50 * 1024 * 1024
const DEFAULT_COVER = '/assets/gem-book-cover.png'

// Legacy GridFS helper (only used as fallback for existing old books)
export function getGridFSBucket() {
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
   * Fetch active book and return a readable stream for streaming or download.
   * Supports both MinIO S3 object storage (new) and GridFS (legacy fallback).
   */
  static async getBookForStream(id) {
    const book = await Book.findOne({ _id: id, active: true })
    if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')

    // 1. MinIO S3 Storage (Primary)
    if (book.fileKey) {
      try {
        const stream = await minioClient.getObject(VIDEO_BUCKET, book.fileKey)
        return { book, stream }
      } catch (err) {
        console.error('[MinIO Book Stream Error]', err)
        throw new AppError('Book file is unavailable from storage', 404, 'FILE_NOT_FOUND')
      }
    }

    // 2. Legacy GridFS fallback
    if (book.fileId) {
      const bucket = getGridFSBucket()
      const fileId = new mongoose.Types.ObjectId(book.fileId)
      const files = await bucket.find({ _id: fileId }).toArray()
      if (!files.length) throw new AppError('Book file is unavailable', 404, 'FILE_NOT_FOUND')
      const stream = bucket.openDownloadStream(fileId)
      return { book, stream }
    }

    throw new AppError('Book file record is invalid', 404, 'FILE_NOT_FOUND')
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
   * Create a new book from MinIO upload stream
   */
  static async createBook(file, body, uploadedBy) {
    if (!file?.fileKey) {
      throw new AppError('Please choose a PDF book file.', 400, 'BOOK_FILE_REQUIRED')
    }
    if (file.size > MAX_BOOK_BYTES) {
      throw new AppError('Book file is too large. Maximum size is 50 MB.', 413, 'BOOK_TOO_LARGE')
    }

    const title = String(body?.title || '').trim()
    if (!title || title.length > 180) {
      throw new AppError('A valid book title is required', 400, 'BOOK_TITLE_REQUIRED')
    }

    const filename = cleanFilename(body?.filename || file.filename || 'gem-guide.pdf')
    const description = String(body?.description || '').trim().slice(0, 2000)
    const coverImageUrl = String(body?.coverImageUrl || DEFAULT_COVER).trim() || DEFAULT_COVER
    const active = String(body?.active ?? 'true') !== 'false'

    return await Book.create({
      title,
      description,
      filename,
      mimeType: file.mimeType || 'application/pdf',
      size: file.size,
      fileKey: file.fileKey,
      storage: 'minio',
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
   * Delete book document and clean up MinIO S3 object (or legacy GridFS)
   */
  static async deleteBook(id) {
    const book = await Book.findById(id)
    if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')

    if (book.fileKey) {
      await minioClient.removeObject(VIDEO_BUCKET, book.fileKey).catch(() => {})
    } else if (book.fileId) {
      try {
        await getGridFSBucket().delete(new mongoose.Types.ObjectId(book.fileId))
      } catch {
        // file may already be deleted
      }
    }

    await book.deleteOne()
  }
}
