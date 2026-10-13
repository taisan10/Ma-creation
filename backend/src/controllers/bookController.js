import { BookService, cleanFilename, contentDispositionFilename } from '../services/book.service.js'

export async function getPublicBook(req, res) {
  const book = await BookService.getPublicBook()
  res.json({ success: true, book })
}

async function streamBook(req, res, mode) {
  const { book, file, fileId, bucket } = await BookService.getBookForStream(req.params.id)

  res.setHeader('Content-Type', book.mimeType || file.contentType || 'application/pdf')
  res.setHeader('Content-Length', String(book.size || file.length))
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader(
    'Content-Disposition',
    mode === 'download'
      ? contentDispositionFilename(book.filename)
      : `inline; filename="${cleanFilename(book.filename).replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(cleanFilename(book.filename))}`
  )

  const stream = bucket.openDownloadStream(fileId)

  if (mode === 'download') {
    stream.on('finish', () => {
      BookService.incrementDownloads(book._id)
    })
  }

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
  const books = await BookService.listBooks()
  res.json({ success: true, books })
}

export async function uploadBook(req, res) {
  const book = await BookService.createBook(req.file, req.body, req.user.sub)
  res.status(201).json({ success: true, book })
}

export async function updateBook(req, res) {
  const book = await BookService.updateBook(req.params.id, req.body)
  res.json({ success: true, book })
}

export async function deleteBook(req, res) {
  await BookService.deleteBook(req.params.id)
  res.json({ success: true })
}
