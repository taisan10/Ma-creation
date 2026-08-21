import mongoose from 'mongoose'
import Book from '../models/Book.js'
import { AppError } from '../utils/AppError.js'

const MAX_BOOK_BYTES = 50 * 1024 * 1024
const DEFAULT_COVER = '/assets/gem-book-cover.png'

function getBucket() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new AppError('Database is not connected', 503, 'DATABASE_UNAVAILABLE')
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'books' })
}

function cleanFilename(value = 'gem-guide.pdf') {
  return String(value).replace(/[\u0000-\u001f\u007f\/\\:*?"<>|]/g, '_').trim().slice(0, 180) || 'gem-guide.pdf'
}

function contentDispositionFilename(value) {
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

export async function getPublicBook(req, res) {
  const book = await Book.findOne({ active: true }).sort({ createdAt: -1 }).lean()
  res.json({
    success: true,
    book: book ? {
      ...book,
      readUrl: `/api/public/books/${book._id}/read`,
      downloadUrl: `/api/public/books/${book._id}/download`,
    } : null,
  })
}

async function streamBook(req, res, mode) {
  const book = await Book.findOne({ _id: req.params.id, active: true })
  if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')

  const bucket = getBucket()
  const fileId = new mongoose.Types.ObjectId(book.fileId)
  const files = await bucket.find({ _id: fileId }).toArray()
  if (!files.length) throw new AppError('Book file is unavailable', 404, 'FILE_NOT_FOUND')

  const file = files[0]
  res.setHeader('Content-Type', book.mimeType || file.contentType || 'application/pdf')
  res.setHeader('Content-Length', String(book.size || file.length))
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Disposition', mode === 'download' ? contentDispositionFilename(book.filename) : `inline; filename="${cleanFilename(book.filename).replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(cleanFilename(book.filename))}`)

  if (mode === 'download') {
    await Book.updateOne({ _id: book._id }, { $inc: { downloads: 1 } })
  }

  const stream = bucket.openDownloadStream(fileId)
  stream.on('error', error => {
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Unable to read the book file' })
    else res.destroy(error)
  })
  stream.pipe(res)
}

export async function readBook(req, res) {
  await streamBook(req, res, 'read')
}

export async function downloadBook(req, res) {
  await streamBook(req, res, 'download')
}

export async function listBooks(req, res) {
  const books = await Book.find().sort({ createdAt: -1 }).populate('uploadedBy', 'name email').lean()
  res.json({ success: true, books })
}

export async function uploadBook(req, res) {
  const file = req.file
  if (!file?.buffer?.length) throw new AppError('Please choose a PDF book file.', 400, 'BOOK_FILE_REQUIRED')
  if (file.size > MAX_BOOK_BYTES) throw new AppError('Book file is too large. Maximum size is 50 MB.', 413, 'BOOK_TOO_LARGE')

  const mimeType = String(file.mimetype || '').split(';')[0].toLowerCase()
  const looksLikePdf = file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  if (mimeType !== 'application/pdf' || !looksLikePdf) {
    throw new AppError('Only valid PDF books are supported', 415, 'INVALID_BOOK_TYPE')
  }

  const title = String(req.body?.title || '').trim()
  if (!title || title.length > 180) throw new AppError('A valid book title is required', 400, 'BOOK_TITLE_REQUIRED')

  const filename = cleanFilename(req.body?.filename || file.originalname || 'gem-guide.pdf')
  const description = String(req.body?.description || '').trim().slice(0, 2000)
  const coverImageUrl = String(req.body?.coverImageUrl || DEFAULT_COVER).trim() || DEFAULT_COVER
  const active = String(req.body?.active ?? 'true') !== 'false'

  const fileId = await uploadBuffer(file.buffer, filename, 'application/pdf', { title, uploadedBy: req.user.sub })
  const book = await Book.create({ title, description, filename, mimeType: 'application/pdf', size: file.size, fileId, coverImageUrl, active, uploadedBy: req.user.sub })

  res.status(201).json({ success: true, book })
}

export async function updateBook(req, res) {
  const allowed = ['title', 'description', 'coverImageUrl', 'active']
  const data = {}
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key]
  if (data.title !== undefined) data.title = String(data.title).trim().slice(0, 180)
  if (!data.title && req.body.title !== undefined) throw new AppError('Book title cannot be empty', 400, 'BOOK_TITLE_REQUIRED')

  const book = await Book.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true })
  if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')
  res.json({ success: true, book })
}

export async function deleteBook(req, res) {
  const book = await Book.findById(req.params.id)
  if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND')

  try {
    await getBucket().delete(new mongoose.Types.ObjectId(book.fileId))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  await book.deleteOne()
  res.json({ success: true })
}
