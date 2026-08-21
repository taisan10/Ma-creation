import { AppError } from '../utils/AppError.js'

const MAX_BODY_BYTES = 50 * 1024 * 1024 + 1024 * 1024
const MAX_FIELD_BYTES = 256 * 1024

function parseContentDisposition(value) {
  const result = {}
  const nameMatch = value.match(/(?:^|;)\s*name="([^"]*)"/i)
  const filenameMatch = value.match(/(?:^|;)\s*filename="([^"]*)"/i)
  if (nameMatch) result.name = nameMatch[1]
  if (filenameMatch) result.filename = filenameMatch[1]
  return result
}

function indexOf(buffer, needle, start = 0) {
  return buffer.indexOf(Buffer.from(needle), start)
}

/**
 * Small, dependency-free multipart/form-data parser used only by the book
 * upload endpoint. It keeps the existing stack dependency-free while safely
 * enforcing a hard 50 MB request limit before parsing the form.
 */
export function parseBookMultipart(req, res, next) {
  const contentType = String(req.headers['content-type'] || '')
  const match = contentType.match(/^multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!match) return next(new AppError('Upload must use multipart/form-data', 415, 'INVALID_UPLOAD_FORMAT'))

  const boundary = match[1] || match[2]
  const boundaryMarker = `--${boundary}`
  const chunks = []
  let total = 0
  let settled = false

  const fail = error => {
    if (settled) return
    settled = true
    next(error)
  }

  req.on('data', chunk => {
    if (settled) return
    total += chunk.length
    if (total > MAX_BODY_BYTES) {
      req.destroy()
      fail(new AppError('Book upload is too large. Maximum size is 50 MB.', 413, 'BOOK_TOO_LARGE'))
      return
    }
    chunks.push(chunk)
  })

  req.on('error', error => fail(error))
  req.on('end', () => {
    if (settled) return
    try {
      const body = Buffer.concat(chunks, total)
      const boundaryBuffer = Buffer.from(boundaryMarker)
      const fields = {}
      let file = null
      let cursor = indexOf(body, boundaryBuffer)

      while (cursor !== -1) {
        const afterBoundary = cursor + boundaryBuffer.length
        if (body.subarray(afterBoundary, afterBoundary + 2).toString() === '--') break

        const partStart = afterBoundary + 2 // skip CRLF
        const headerEnd = indexOf(body, '\r\n\r\n', partStart)
        if (headerEnd === -1) throw new AppError('Malformed multipart upload', 400, 'INVALID_UPLOAD_FORMAT')

        const headerText = body.subarray(partStart, headerEnd).toString('utf8')
        const nextBoundary = indexOf(body, `\r\n${boundaryMarker}`, headerEnd + 4)
        if (nextBoundary === -1) throw new AppError('Malformed multipart upload', 400, 'INVALID_UPLOAD_FORMAT')

        const contentStart = headerEnd + 4
        const content = body.subarray(contentStart, nextBoundary)
        const headers = {}
        for (const line of headerText.split('\r\n')) {
          const colon = line.indexOf(':')
          if (colon > 0) headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim()
        }

        const disposition = parseContentDisposition(headers['content-disposition'] || '')
        if (!disposition.name) throw new AppError('Malformed multipart field', 400, 'INVALID_UPLOAD_FORMAT')

        if (disposition.filename !== undefined) {
          if (content.length > 50 * 1024 * 1024) throw new AppError('Book file is too large. Maximum size is 50 MB.', 413, 'BOOK_TOO_LARGE')
          file = {
            buffer: Buffer.from(content),
            originalname: disposition.filename,
            mimetype: headers['content-type'] || 'application/octet-stream',
            size: content.length,
          }
        } else {
          if (content.length > MAX_FIELD_BYTES) throw new AppError('Upload field is too large', 413, 'FIELD_TOO_LARGE')
          fields[disposition.name] = content.toString('utf8')
        }

        cursor = indexOf(body, boundaryBuffer, nextBoundary + 2)
      }

      req.body = fields
      req.file = file
      settled = true
      next()
    } catch (error) {
      fail(error)
    }
  })
}
