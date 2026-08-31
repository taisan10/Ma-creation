import { AppError } from '../utils/AppError.js'
import Category from '../models/Category.js'
import Course from '../models/Course.js'
import Video from '../models/Video.js'
import { minioClient, VIDEO_BUCKET } from '../config/minio.js'

// ============================================================
// ADMIN -- Category
// ============================================================

export async function createCategory(req, res) {
  const { name, slug, description, order } = req.body
  if (!name || !slug) throw new AppError('name and slug are required', 400, 'BAD_REQUEST')
  const category = await Category.create({ name, slug, description, order })
  res.status(201).json({ success: true, category })
}

export async function listCategoriesAdmin(req, res) {
  const categories = await Category.find().sort({ order: 1, createdAt: 1 })
  res.json({ success: true, categories })
}

// ============================================================
// ADMIN -- Course
// ============================================================

export async function createCourse(req, res) {
  const { category, plan, title, description, thumbnailUrl, order } = req.body
  if (!category || !plan || !title) throw new AppError('category, plan and title are required', 400, 'BAD_REQUEST')
  const course = await Course.create({ category, plan, title, description, thumbnailUrl, order })
  res.status(201).json({ success: true, course })
}

export async function listCoursesAdmin(req, res) {
  const courses = await Course.find()
    .populate('category', 'name slug')
    .populate('plan', 'name price')
    .sort({ order: 1, createdAt: 1 })
  res.json({ success: true, courses })
}

// ============================================================
// ADMIN -- Video (two-step create: metadata first, file upload second)
// ============================================================

// Step 1: create the Video record with a placeholder storage key. `active`
// stays false so it can never appear on the public unlock page until a real
// file has actually landed in MinIO (see uploadVideoFile below).
export async function createVideoMeta(req, res) {
  const { course, title, description, order, durationSeconds, maxWatchCount } = req.body
  if (!course || !title) throw new AppError('course and title are required', 400, 'BAD_REQUEST')

  const video = await Video.create({
    course,
    title,
    description,
    order,
    durationSeconds,
    maxWatchCount,
    minioObjectKey: `pending/${Date.now()}`,
    active: false
  })
  res.status(201).json({ success: true, video })
}

export async function listVideosAdmin(req, res) {
  const { courseId } = req.query
  const filter = courseId ? { course: courseId } : {}
  const videos = await Video.find(filter).sort({ order: 1, createdAt: 1 })
  res.json({ success: true, videos })
}

// Step 2: called AFTER streamVideoUpload middleware has already streamed the
// file into MinIO -- req.uploadedVideo = { objectKey, mimeType } is set by
// that middleware. This handler just finalizes the DB record.
export async function uploadVideoFile(req, res) {
  const video = await Video.findById(req.params.id)
  if (!video) throw new AppError('Video not found', 404, 'NOT_FOUND')

  const previousKey = video.minioObjectKey
  video.minioObjectKey = req.uploadedVideo.objectKey
  video.mimeType = req.uploadedVideo.mimeType
  video.active = true
  await video.save()

  // Re-upload case: if this video already pointed at a real (non-placeholder)
  // MinIO object, delete the old one so storage doesn't fill up with orphaned
  // files nobody references anymore. Done fire-and-forget so it doesn't slow
  // down the admin's response.
  if (previousKey && !previousKey.startsWith('pending/')) {
    minioClient.removeObject(VIDEO_BUCKET, previousKey).catch(err => {
      console.error(`[minio] failed to remove superseded object ${previousKey}:`, err.message)
    })
  }

  res.json({ success: true, video })
}

export async function deleteVideo(req, res) {
  const video = await Video.findById(req.params.id)
  if (!video) throw new AppError('Video not found', 404, 'NOT_FOUND')

  if (video.minioObjectKey && !video.minioObjectKey.startsWith('pending/')) {
    await minioClient.removeObject(VIDEO_BUCKET, video.minioObjectKey).catch(err => {
      console.error(`[minio] failed to remove object ${video.minioObjectKey}:`, err.message)
    })
  }
  await video.deleteOne()
  res.json({ success: true })
}