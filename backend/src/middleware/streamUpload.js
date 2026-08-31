import Busboy from 'busboy'
import { randomUUID } from 'crypto'
import path from 'path'
import { minioClient, VIDEO_BUCKET } from '../config/minio.js'
import { AppError } from '../utils/AppError.js'

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024 // 5GB safety ceiling, raise if needed

/**
 * Streaming replacement for middleware/multipartBook.js, used ONLY for
 * video uploads. Route must include a ":id" param (the Video document's
 * _id, created beforehand via POST /api/admin/lms/videos) so we know which
 * video this file belongs to.
 *
 * KEY DIFFERENCE from multipartBook.js: that file reads the ENTIRE request
 * into a Buffer in memory before doing anything with it -- fine for a 5MB
 * PDF, but a 2GB video would either crash the Node process (out of memory)
 * or make the server unresponsive to every other request while it buffers.
 * Here, busboy hands us a readable stream for the file part AS BYTES ARRIVE
 * from the client, and we pipe that stream directly into MinIO's putObject,
 * which itself streams to MinIO in chunks (S3-style multipart upload under
 * the hood for large files). At no point does the full video sit in Node's
 * memory or on the VPS's local disk.
 */
export function streamVideoUpload(req, res, next) {
  const videoId = req.params.id
  if (!videoId) return next(new AppError('Video id is required in the URL', 400, 'BAD_REQUEST'))

  let busboy
  try {
    busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_VIDEO_BYTES } })
  } catch {
    return next(new AppError('Invalid upload request', 400, 'BAD_REQUEST'))
  }

  let fileFieldSeen = false
  let uploadPromise = null // tracks the actual MinIO write, so we can await it before continuing

  busboy.on('file', (fieldName, fileStream, info) => {
    // The frontend's <input type="file" name="video"> must produce this
    // exact field name -- anything else is ignored (and its stream drained
    // so the request doesn't hang).
    if (fieldName !== 'video') {
      fileStream.resume()
      return
    }

    const { mimeType, filename } = info
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      fileStream.resume()
      uploadPromise = Promise.reject(
        new AppError(`Unsupported video type "${mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400, 'BAD_REQUEST')
      )
      return
    }

    fileFieldSeen = true
    const ext = path.extname(filename || '') || '.mp4'
    // Object key format: courses/videos/<videoId>/<random-uuid>.<ext>
    // Using a fresh UUID (not the original filename) avoids collisions and
    // avoids leaking the original filename into the storage path.
    const objectKey = `courses/videos/${videoId}/${randomUUID()}${ext}`

    uploadPromise = minioClient
      .putObject(VIDEO_BUCKET, objectKey, fileStream, undefined, { 'Content-Type': mimeType })
      .then(() => ({ objectKey, mimeType }))
  })

  busboy.on('filesLimit', () => {
    uploadPromise = Promise.reject(new AppError('Only one video file allowed per upload', 400, 'BAD_REQUEST'))
  })

  busboy.on('error', err => {
    uploadPromise = Promise.reject(err)
  })

  busboy.on('finish', async () => {
    try {
      if (!fileFieldSeen) {
        throw new AppError('No video file received (expected form field name "video")', 400, 'BAD_REQUEST')
      }
      // Wait for the actual MinIO upload to finish -- busboy finishing means
      // it's done READING the request, not that the write to MinIO has
      // completed (that's a separate async network call).
      req.uploadedVideo = await uploadPromise
      next()
    } catch (err) {
      next(err)
    }
  })

  req.pipe(busboy)
}